"""
pcap_watcher.py

Uses pure-Python pcap_to_csv (Scapy-based) instead of the cicflowmeter pip
package, which requires tcpdump and therefore fails silently on Windows.

Pipeline:
  packet_capture.py  →  pcap_output/*.pcap
       ↓  (this file watches pcap_output/)
  pcap_to_csv.pcap_to_flows()  →  in-memory flow rows
       ↓                              ↓ (also archived to disk for forensics)
  pipeline.ingest_rows()         flow_output/<stem>.csv
       ↓
  predict + persist + WS broadcast (in-process — no HTTP hop, no second process)
"""

import logging
import os
import shutil
import threading
from pathlib import Path

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from config import settings
from pcap_to_csv import pcap_to_flows, write_flows_csv
from pipeline import pipeline

logger = logging.getLogger(__name__)

_ATTACK_LOG_DIR = Path(settings.FLOW_OUTPUT_DIR).parent / "attack_log"
_KEEP_LAST_N = 5


def _rotate_files(current_csv: str, had_attack: bool):
    """Keep only the last N pcap/csv pairs. Archive pairs with an attack to
    attack_log/, delete benign pairs. Mirrors the old watcher.py behaviour,
    now run in-process right after ingestion instead of by a poller."""
    _ATTACK_LOG_DIR.mkdir(parents=True, exist_ok=True)
    flow_dir = Path(settings.FLOW_OUTPUT_DIR)
    pcap_dir = Path(settings.CAPTURE_PCAP_DIR)

    if had_attack:
        stem = Path(current_csv).stem
        pcap_path = pcap_dir / f"{stem}.pcap"
        try:
            if Path(current_csv).exists():
                shutil.move(current_csv, str(_ATTACK_LOG_DIR / Path(current_csv).name))
            if pcap_path.exists():
                shutil.move(str(pcap_path), str(_ATTACK_LOG_DIR / pcap_path.name))
            logger.info(f"[PcapWatcher] archived attack capture: {stem}")
        except Exception as e:
            logger.error(f"[PcapWatcher] failed to archive {stem}: {e}")

    csv_files = sorted(flow_dir.glob("*.csv"))
    if len(csv_files) > _KEEP_LAST_N:
        for old_csv in csv_files[:-_KEEP_LAST_N]:
            old_pcap = pcap_dir / f"{old_csv.stem}.pcap"
            try:
                if old_csv.exists():
                    os.remove(old_csv)
                if old_pcap.exists():
                    os.remove(old_pcap)
            except Exception as e:
                logger.error(f"[PcapWatcher] failed to delete {old_csv.name}: {e}")


def _convert_pcap(pcap_path: str):
    stem = Path(pcap_path).stem
    csv_path = str(Path(settings.FLOW_OUTPUT_DIR) / f"{stem}.csv")
    logger.info(f"[PcapWatcher] converting: {Path(pcap_path).name} → {stem}.csv")
    try:
        rows = pcap_to_flows(pcap_path, bpf_ports=settings.MONITORED_PORTS)
        write_flows_csv(rows, csv_path)  # forensic archive, matches on-disk rotation
        had_attack = False
        if rows:
            result = pipeline.ingest_rows(rows, source="pcap")
            had_attack = bool(result.get("has_attack"))
            logger.info(
                f"[PcapWatcher] done → {csv_path} ({len(rows)} flows, "
                f"processed={result.get('processed')}, has_attack={had_attack})"
            )
        else:
            logger.warning(f"[PcapWatcher] 0 flows extracted from {Path(pcap_path).name}")
        _rotate_files(csv_path, had_attack)
        return csv_path
    except Exception as e:
        logger.error(f"[PcapWatcher] error processing {pcap_path}: {e}")
        return None


class PcapHandler(FileSystemEventHandler):
    def __init__(self):
        self._seen: set = set()
        self._lock = threading.Lock()

    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith(".pcap"):
            self._process(event.src_path)

    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith(".pcap"):
            self._process(event.src_path)

    def _process(self, path: str):
        with self._lock:
            if path in self._seen:
                return
            self._seen.add(path)
            # _seen only needs to dedupe the create+modify pair for a file
            # that's about to be processed and rotated away — bound its size
            # rather than let it grow for the lifetime of the process.
            if len(self._seen) > 500:
                self._seen.clear()
                self._seen.add(path)
        t = threading.Thread(target=_convert_pcap, args=(path,), daemon=True)
        t.start()


class PcapWatcherService:
    def __init__(self):
        self._observer = None
        self._running = False
        Path(settings.FLOW_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
        Path(settings.CAPTURE_PCAP_DIR).mkdir(parents=True, exist_ok=True)

    def start(self, pcap_dir: str = None):
        if self._running:
            logger.warning("[PcapWatcher] already running.")
            return
        watch_dir = pcap_dir or settings.CAPTURE_PCAP_DIR
        handler = PcapHandler()
        self._observer = Observer()
        self._observer.schedule(handler, watch_dir, recursive=False)
        self._observer.start()
        self._running = True
        logger.info(f"[PcapWatcher] watching {watch_dir} for new PCAPs …")
        # Convert any existing PCAPs on startup
        for pcap in Path(watch_dir).glob("*.pcap"):
            t = threading.Thread(target=_convert_pcap, args=(str(pcap),), daemon=True)
            t.start()

    def stop(self):
        self._running = False
        if self._observer:
            self._observer.stop()
            self._observer.join(timeout=5)
            self._observer = None
        logger.info("[PcapWatcher] stopped.")

    def is_running(self) -> bool:
        return (
            self._running
            and self._observer is not None
            and self._observer.is_alive()
        )


pcap_watcher_service = PcapWatcherService()