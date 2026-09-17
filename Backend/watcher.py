"""
watcher.py — manual CSV backfill tool.

This used to be a required, separately-run process: it watched
flow_output/ with its own watchdog loop and POSTed each new row to
/predict/live over HTTP, back into the same server. That added a second
long-running process, a disk poll, and a loopback HTTP round-trip for data
the server could have processed directly.

pcap_watcher.py now calls pipeline.ingest_rows() in-process as soon as a
PCAP is converted, so nothing needs to run this file for the live pipeline
to work. It's kept as a CLI for reprocessing archived/backfilled CSVs
(e.g. files moved into attack_log/, or CSVs dropped in manually) without
spinning up the whole capture stack.

Usage:
    python watcher.py [directory]        # defaults to settings.FLOW_OUTPUT_DIR
"""

import csv
import logging
import sys
from pathlib import Path

from config import settings
from pipeline import pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def backfill_csv(filepath: Path) -> dict:
    with open(filepath, "r", newline="", encoding="utf-8-sig") as f:
        rows = list(csv.DictReader(f))
    if not rows:
        return {"status": "empty", "processed": 0}
    logger.info(f"Backfilling {len(rows)} rows from {filepath.name}")
    result = pipeline.ingest_rows(rows, source="backfill")
    logger.info(f"{filepath.name}: {result}")
    return result


def backfill_dir(directory: str):
    csv_files = sorted(Path(directory).glob("*.csv"))
    if not csv_files:
        logger.info(f"No CSV files found in {directory}")
        return
    for path in csv_files:
        try:
            backfill_csv(path)
        except Exception as e:
            logger.error(f"Failed to backfill {path.name}: {e}")


if __name__ == "__main__":
    target_dir = sys.argv[1] if len(sys.argv) > 1 else settings.FLOW_OUTPUT_DIR
    backfill_dir(target_dir)
