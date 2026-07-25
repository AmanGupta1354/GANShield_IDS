"""
pcap_watcher.py

Uses pure-Python pcap_to_csv (Scapy-based) instead of the cicflowmeter pip
package, which requires tcpdump and therefore fails silently on Windows.

Pipeline:
  packet_capture.py  →  pcap_output/*.pcap
       ↓  (this file watches pcap_output/)
  pcap_to_csv.pcap_to_csv()  →  flow_output/<stem>.csv
       ↓
  watcher.py         →  POST /predict/live
"""

import logging
import threading
from pathlib import Path

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from config import settings
from pcap_to_csv import pcap_to_csv

logger = logging.getLogger(__name__)


def _convert_pcap(pcap_path: str):
    stem = Path(pcap_path).stem
    csv_path = str(Path(settings.FLOW_OUTPUT_DIR) / f"{stem}.csv")
    logger.info(f"[PcapWatcher] converting: {Path(pcap_path).name} → {stem}.csv")
    try:
        n = pcap_to_csv(pcap_path, csv_path)
        if n > 0:
            logger.info(f"[PcapWatcher] done → {csv_path}  ({n} flows)")
        else:
            logger.warning(f"[PcapWatcher] 0 flows extracted from {Path(pcap_path).name}")
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