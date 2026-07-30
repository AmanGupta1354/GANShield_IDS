import os
import time
import csv
import json
import requests
import logging
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from concurrent.futures import ThreadPoolExecutor
from config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

API_URL = f"http://127.0.0.1:{settings.PORT}/predict/live/batch"
executor = ThreadPoolExecutor(max_workers=4)

# Map CICFlowMeter CSV column names → our feature keys
COLUMN_MAP = {
    "Dst Port": "dst_port",
    "Protocol": "protocol",
    "Flow Duration": "flow_duration",
    "Tot Fwd Pkts": "tot_fwd_pkts",
    "Tot Bwd Pkts": "tot_bwd_pkts",
    "TotLen Fwd Pkts": "totlen_fwd_pkts",
    "TotLen Bwd Pkts": "totlen_bwd_pkts",
    "Fwd Pkt Len Max": "fwd_pkt_len_max",
    "Fwd Pkt Len Min": "fwd_pkt_len_min",
    "Fwd Pkt Len Mean": "fwd_pkt_len_mean",
    "Fwd Pkt Len Std": "fwd_pkt_len_std",
    "Bwd Pkt Len Max": "bwd_pkt_len_max",
    "Bwd Pkt Len Min": "bwd_pkt_len_min",
    "Bwd Pkt Len Mean": "bwd_pkt_len_mean",
    "Bwd Pkt Len Std": "bwd_pkt_len_std",
    "Flow Byts/s": "flow_byts_s",
    "Flow Pkts/s": "flow_pkts_s",
    "Flow IAT Mean": "flow_iat_mean",
    "Flow IAT Std": "flow_iat_std",
    "Flow IAT Max": "flow_iat_max",
    "Flow IAT Min": "flow_iat_min",
    "Fwd IAT Tot": "fwd_iat_tot",
    "Fwd IAT Mean": "fwd_iat_mean",
    "Fwd IAT Std": "fwd_iat_std",
    "Fwd IAT Max": "fwd_iat_max",
    "Fwd IAT Min": "fwd_iat_min",
    "Bwd IAT Tot": "bwd_iat_tot",
    "Bwd IAT Mean": "bwd_iat_mean",
    "Bwd IAT Std": "bwd_iat_std",
    "Bwd IAT Max": "bwd_iat_max",
    "Bwd IAT Min": "bwd_iat_min",
    "Fwd PSH Flags": "fwd_psh_flags",
    "Bwd PSH Flags": "bwd_psh_flags",
    "Fwd URG Flags": "fwd_urg_flags",
    "Bwd URG Flags": "bwd_urg_flags",
    "Fwd Header Len": "fwd_header_len",
    "Bwd Header Len": "bwd_header_len",
    "Fwd Pkts/s": "fwd_pkts_s",
    "Bwd Pkts/s": "bwd_pkts_s",
    "Pkt Len Min": "pkt_len_min",
    "Pkt Len Max": "pkt_len_max",
    "Pkt Len Mean": "pkt_len_mean",
    "Pkt Len Std": "pkt_len_std",
    "Pkt Len Var": "pkt_len_var",
    "FIN Flag Cnt": "fin_flag_cnt",
    "SYN Flag Cnt": "syn_flag_cnt",
    "RST Flag Cnt": "rst_flag_cnt",
    "PSH Flag Cnt": "psh_flag_cnt",
    "ACK Flag Cnt": "ack_flag_cnt",
    "URG Flag Cnt": "urg_flag_cnt",
    "CWE Flag Count": "cwe_flag_count",
    "ECE Flag Cnt": "ece_flag_cnt",
    "Down/Up Ratio": "down_up_ratio",
    "Pkt Size Avg": "pkt_size_avg",
    "Fwd Seg Size Avg": "fwd_seg_size_avg",
    "Bwd Seg Size Avg": "bwd_seg_size_avg",
    "Fwd Byts/b Avg": "fwd_byts_b_avg",
    "Fwd Pkts/b Avg": "fwd_pkts_b_avg",
    "Fwd Blk Rate Avg": "fwd_blk_rate_avg",
    "Bwd Byts/b Avg": "bwd_byts_b_avg",
    "Bwd Pkts/b Avg": "bwd_pkts_b_avg",
    "Bwd Blk Rate Avg": "bwd_blk_rate_avg",
    "Subflow Fwd Pkts": "subflow_fwd_pkts",
    "Subflow Fwd Byts": "subflow_fwd_byts",
    "Subflow Bwd Pkts": "subflow_bwd_pkts",
    "Subflow Bwd Byts": "subflow_bwd_byts",
    "Init Fwd Win Byts": "init_fwd_win_byts",
    "Init Bwd Win Byts": "init_bwd_win_byts",
    "Fwd Act Data Pkts": "fwd_act_data_pkts",
    "Fwd Seg Size Min": "fwd_seg_size_min",
    "Active Mean": "active_mean",
    "Active Std": "active_std",
    "Active Max": "active_max",
    "Active Min": "active_min",
    "Idle Mean": "idle_mean",
    "Idle Std": "idle_std",
    "Idle Max": "idle_max",
    "Idle Min": "idle_min",
    # Meta (optional)
    "Src IP": "_src_ip",
    "Dst IP": "_dst_ip",
    "Src Port": "_src_port",
}


def safe_float(val):
    try:
        f = float(val)
        if f != f or f == float('inf') or f == float('-inf'):
            return 0.0
        return f
    except Exception:
        return 0.0


def process_csv_row(row: dict):
    """Map CSV row to feature dict and meta fields."""
    features = {}
    meta = {}
    for csv_col, feat_key in COLUMN_MAP.items():
        val = row.get(csv_col, row.get(csv_col.strip(), "0"))
        if feat_key.startswith("_"):
            meta[feat_key[1:]] = val
        else:
            features[feat_key] = safe_float(val)
    return features, meta


def send_batch_to_api(payloads: list, filepath: str, handler: "CSVHandler"):
    if not payloads:
        return
    try:
        resp = requests.post(API_URL, json=payloads, timeout=10)
        if resp.status_code == 200:
            result = resp.json()
            logger.info(f"✅ Batch processed: {result.get('processed', 0)} flows from {Path(filepath).name}")
            if result.get("has_attack"):
                handler.files_with_attacks.add(filepath)
        else:
            logger.warning(f"API error: {resp.status_code} — {resp.text[:200]}")
    except requests.ConnectionError:
        logger.error("Cannot connect to FastAPI. Is the server running?")
    except Exception as e:
        logger.error(f"Send error: {e}")
    finally:
        handler._cleanup_old_files()


def process_entire_csv(filepath: str, handler: "CSVHandler"):
    """Read and send every row in a CSV file (used for backfill on startup)."""
    try:
        with open(filepath, "r", newline="", encoding="utf-8-sig") as f:
            rows = list(csv.DictReader(f))
        if not rows:
            return
        logger.info(f"📂 Backfilling {len(rows)} rows from {Path(filepath).name}")
        
        payloads = []
        for row in rows:
            features, meta = process_csv_row(row)
            payloads.append({
                "features": features,
                "src_ip": meta.get("src_ip"),
                "dst_ip": meta.get("dst_ip"),
                "src_port": int(meta.get("src_port", 0)) if meta.get("src_port") else None,
            })
            
        if payloads:
            executor.submit(send_batch_to_api, payloads, filepath, handler)
            
        # Mark as fully read so the watchdog won't re-process it
        handler.processed_rows[filepath] = len(rows)
    except Exception as e:
        logger.error(f"Backfill error [{filepath}]: {e}")


class CSVHandler(FileSystemEventHandler):
    def __init__(self):
        self.processed_rows: dict = {}  # filepath -> row count already sent
        self.files_with_attacks: set = set()
        
        self.attack_log_dir = Path(settings.FLOW_OUTPUT_DIR).parent / "attack_log"
        self.attack_log_dir.mkdir(parents=True, exist_ok=True)

    def on_modified(self, event):
        if event.is_directory or not event.src_path.endswith(".csv"):
            return
        self._process_new_rows(event.src_path)

    def on_created(self, event):
        if event.is_directory or not event.src_path.endswith(".csv"):
            return
        self.processed_rows[event.src_path] = 0
        self._process_new_rows(event.src_path)

    def _process_new_rows(self, filepath: str):
        already_read = self.processed_rows.get(filepath, 0)
        try:
            with open(filepath, "r", newline="", encoding="utf-8-sig") as f:
                reader = list(csv.DictReader(f))
            new_rows = reader[already_read:]
            
            payloads = []
            for row in new_rows:
                features, meta = process_csv_row(row)
                payloads.append({
                    "features": features,
                    "src_ip": meta.get("src_ip"),
                    "dst_ip": meta.get("dst_ip"),
                    "src_port": int(meta.get("src_port", 0)) if meta.get("src_port") else None,
                })
                
            if payloads:
                executor.submit(send_batch_to_api, payloads, filepath, self)
                
            self.processed_rows[filepath] = len(reader)
        except Exception as e:
            logger.error(f"CSV read error [{filepath}]: {e}")
            
    def _cleanup_old_files(self):
        import shutil
        flow_dir = Path(settings.FLOW_OUTPUT_DIR)
        pcap_dir = Path(settings.CAPTURE_PCAP_DIR)
        
        csv_files = sorted(flow_dir.glob("*.csv"))
        
        if len(csv_files) > 5:
            files_to_remove = csv_files[:-5]
            for csv_path in files_to_remove:
                csv_str = str(csv_path)
                pcap_path = pcap_dir / f"{csv_path.stem}.pcap"
                
                if csv_str in self.files_with_attacks:
                    logger.info(f"🚨 Archiving attack log: {csv_path.name}")
                    try:
                        shutil.move(csv_str, self.attack_log_dir / csv_path.name)
                        if pcap_path.exists():
                            shutil.move(str(pcap_path), self.attack_log_dir / pcap_path.name)
                        self.files_with_attacks.remove(csv_str)
                    except Exception as e:
                        logger.error(f"Failed to move files: {e}")
                else:
                    logger.info(f"🗑️ Deleting benign file: {csv_path.name}")
                    try:
                        if csv_path.exists(): os.remove(csv_str)
                        if pcap_path.exists(): os.remove(str(pcap_path))
                    except Exception as e:
                        logger.error(f"Failed to delete files: {e}")
                
                if csv_str in self.processed_rows:
                    del self.processed_rows[csv_str]


def start_watcher():
    watch_dir = settings.FLOW_OUTPUT_DIR
    Path(watch_dir).mkdir(parents=True, exist_ok=True)

    handler = CSVHandler()

    # ── Backfill: process all CSV files already in flow_output/ ──────────────
    existing = sorted(Path(watch_dir).glob("*.csv"))
    if existing:
        logger.info(f"📂 Found {len(existing)} existing CSV(s) — processing now …")
        for csv_path in existing:
            process_entire_csv(str(csv_path), handler)
        logger.info("✅ Backfill complete.")
    else:
        logger.info("No existing CSVs found — waiting for new ones …")

    # ── Start watching for new CSVs ───────────────────────────────────────────
    observer = Observer()
    observer.schedule(handler, watch_dir, recursive=False)
    observer.start()
    logger.info(f"👀 Watching: {watch_dir}")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
        executor.shutdown(wait=True)
    observer.join()


if __name__ == "__main__":
    start_watcher()