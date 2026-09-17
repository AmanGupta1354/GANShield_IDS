"""
pipeline.py — shared flow-ingestion pipeline.

Previously, converting a PCAP to predictions required three hops:
  pcap_watcher.py (in-process) -> flow_output/*.csv (disk)
      -> watcher.py (a SEPARATE process, its own watchdog loop)
      -> HTTP POST back into this same server's /predict/live/batch

That added a disk round-trip, a second long-running process the operator had
to remember to start, and a loopback HTTP call for data that was already in
this process's memory. This module replaces all of that: whoever extracts
flow rows (pcap_watcher, or a manual CSV backfill) calls `ingest_rows()`
directly, in-process, and the same prediction + persistence + broadcast logic
that /predict/live/batch uses runs with no network hop.

The ML model and its feature contract (FEATURE_COLUMNS in predictor.py) are
untouched — this module only handles getting flow rows to the predictor.
"""

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Callable, Iterable, Optional

from database import FlowLog, SessionLocal
from predictor import predictor

logger = logging.getLogger(__name__)

# CICFlowMeter-style CSV column name -> predictor feature key.
# ("_"-prefixed keys are metadata, not model features.)
COLUMN_MAP = {
    "Dst Port": "dst_port", "Protocol": "protocol", "Flow Duration": "flow_duration",
    "Tot Fwd Pkts": "tot_fwd_pkts", "Tot Bwd Pkts": "tot_bwd_pkts",
    "TotLen Fwd Pkts": "totlen_fwd_pkts", "TotLen Bwd Pkts": "totlen_bwd_pkts",
    "Fwd Pkt Len Max": "fwd_pkt_len_max", "Fwd Pkt Len Min": "fwd_pkt_len_min",
    "Fwd Pkt Len Mean": "fwd_pkt_len_mean", "Fwd Pkt Len Std": "fwd_pkt_len_std",
    "Bwd Pkt Len Max": "bwd_pkt_len_max", "Bwd Pkt Len Min": "bwd_pkt_len_min",
    "Bwd Pkt Len Mean": "bwd_pkt_len_mean", "Bwd Pkt Len Std": "bwd_pkt_len_std",
    "Flow Byts/s": "flow_byts_s", "Flow Pkts/s": "flow_pkts_s",
    "Flow IAT Mean": "flow_iat_mean", "Flow IAT Std": "flow_iat_std",
    "Flow IAT Max": "flow_iat_max", "Flow IAT Min": "flow_iat_min",
    "Fwd IAT Tot": "fwd_iat_tot", "Fwd IAT Mean": "fwd_iat_mean",
    "Fwd IAT Std": "fwd_iat_std", "Fwd IAT Max": "fwd_iat_max", "Fwd IAT Min": "fwd_iat_min",
    "Bwd IAT Tot": "bwd_iat_tot", "Bwd IAT Mean": "bwd_iat_mean",
    "Bwd IAT Std": "bwd_iat_std", "Bwd IAT Max": "bwd_iat_max", "Bwd IAT Min": "bwd_iat_min",
    "Fwd PSH Flags": "fwd_psh_flags", "Bwd PSH Flags": "bwd_psh_flags",
    "Fwd URG Flags": "fwd_urg_flags", "Bwd URG Flags": "bwd_urg_flags",
    "Fwd Header Len": "fwd_header_len", "Bwd Header Len": "bwd_header_len",
    "Fwd Pkts/s": "fwd_pkts_s", "Bwd Pkts/s": "bwd_pkts_s",
    "Pkt Len Min": "pkt_len_min", "Pkt Len Max": "pkt_len_max",
    "Pkt Len Mean": "pkt_len_mean", "Pkt Len Std": "pkt_len_std", "Pkt Len Var": "pkt_len_var",
    "FIN Flag Cnt": "fin_flag_cnt", "SYN Flag Cnt": "syn_flag_cnt",
    "RST Flag Cnt": "rst_flag_cnt", "PSH Flag Cnt": "psh_flag_cnt",
    "ACK Flag Cnt": "ack_flag_cnt", "URG Flag Cnt": "urg_flag_cnt",
    "CWE Flag Count": "cwe_flag_count", "ECE Flag Cnt": "ece_flag_cnt",
    "Down/Up Ratio": "down_up_ratio", "Pkt Size Avg": "pkt_size_avg",
    "Fwd Seg Size Avg": "fwd_seg_size_avg", "Bwd Seg Size Avg": "bwd_seg_size_avg",
    "Fwd Byts/b Avg": "fwd_byts_b_avg", "Fwd Pkts/b Avg": "fwd_pkts_b_avg",
    "Fwd Blk Rate Avg": "fwd_blk_rate_avg", "Bwd Byts/b Avg": "bwd_byts_b_avg",
    "Bwd Pkts/b Avg": "bwd_pkts_b_avg", "Bwd Blk Rate Avg": "bwd_blk_rate_avg",
    "Subflow Fwd Pkts": "subflow_fwd_pkts", "Subflow Fwd Byts": "subflow_fwd_byts",
    "Subflow Bwd Pkts": "subflow_bwd_pkts", "Subflow Bwd Byts": "subflow_bwd_byts",
    "Init Fwd Win Byts": "init_fwd_win_byts", "Init Bwd Win Byts": "init_bwd_win_byts",
    "Fwd Act Data Pkts": "fwd_act_data_pkts", "Fwd Seg Size Min": "fwd_seg_size_min",
    "Active Mean": "active_mean", "Active Std": "active_std",
    "Active Max": "active_max", "Active Min": "active_min",
    "Idle Mean": "idle_mean", "Idle Std": "idle_std",
    "Idle Max": "idle_max", "Idle Min": "idle_min",
    # Meta (not fed to the model)
    "Src IP": "_src_ip", "Dst IP": "_dst_ip", "Src Port": "_src_port",
}


def safe_float(val) -> float:
    try:
        f = float(val)
        if f != f or f in (float("inf"), float("-inf")):
            return 0.0
        return f
    except (TypeError, ValueError):
        return 0.0


def row_to_payload(row: dict) -> dict:
    """Map one CICFlowMeter-style row (dict, CSV-header or pcap_to_csv keys) to
    a {"features": {...}, "src_ip": ..., "dst_ip": ..., "src_port": ...} payload."""
    features, meta = {}, {}
    for col, feat_key in COLUMN_MAP.items():
        val = row.get(col, "0")
        if feat_key.startswith("_"):
            meta[feat_key[1:]] = val
        else:
            features[feat_key] = safe_float(val)
    src_port = meta.get("src_port")
    return {
        "features": features,
        "src_ip": meta.get("src_ip"),
        "dst_ip": meta.get("dst_ip"),
        "src_port": int(src_port) if src_port else None,
    }


def rows_to_payloads(rows: Iterable[dict]) -> list:
    return [row_to_payload(r) for r in rows]


class FlowIngestPipeline:
    """
    Runs prediction + DB persistence for a batch of flow rows and broadcasts
    the results over WebSocket — the same logic /predict/live/batch uses,
    but callable directly from a background thread (no HTTP hop).
    """

    def __init__(self):
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._broadcaster: Optional[Callable] = None

    def bind(self, loop: asyncio.AbstractEventLoop, broadcaster: Callable):
        """Called once at app startup with the running event loop and the
        WebSocket ConnectionManager.broadcast coroutine."""
        self._loop = loop
        self._broadcaster = broadcaster

    def ingest_rows(self, rows: Iterable[dict], source: str = "pcap") -> dict:
        payloads = rows_to_payloads(rows)
        if not payloads:
            return {"status": "empty", "processed": 0}
        return self.ingest_payloads(payloads, source=source)

    def ingest_payloads(self, payloads: list, source: str = "pcap") -> dict:
        if not payloads:
            return {"status": "empty", "processed": 0}
        if not predictor.is_ready:
            logger.warning("[pipeline] dropping %d flows — model not loaded", len(payloads))
            return {"status": "model_not_ready", "processed": 0}

        features_list = [p["features"] for p in payloads]
        predictions = predictor.predict_batch(features_list)
        ts = datetime.now(timezone.utc)

        db = SessionLocal()
        try:
            logs = []
            for payload, features, pred in zip(payloads, features_list, predictions):
                dst_port = payload.get("dst_port_info")
                dst_port = int(dst_port) if dst_port is not None else int(features.get("dst_port", 0))
                protocol = payload.get("protocol")
                protocol = protocol if protocol is not None else str(features.get("protocol", ""))
                logs.append(FlowLog(
                    timestamp=ts,
                    label=pred["label"],
                    confidence=pred["confidence"],
                    is_attack=pred["is_attack"],
                    src_ip=payload.get("src_ip"),
                    dst_ip=payload.get("dst_ip"),
                    src_port=payload.get("src_port"),
                    dst_port=dst_port,
                    protocol=protocol,
                    raw_features=json.dumps(features),
                ))
            db.add_all(logs)
            db.commit()
            for log in logs:
                db.refresh(log)

            results = [
                {
                    "id": log.id,
                    "label": log.label,
                    "confidence": log.confidence,
                    "is_attack": log.is_attack,
                    "timestamp": ts.isoformat(),
                    "src_ip": log.src_ip,
                    "dst_ip": log.dst_ip,
                    "src_port": log.src_port,
                    "dst_port": log.dst_port,
                    "protocol": log.protocol,
                    "source": source,
                }
                for log in logs
            ]
        finally:
            db.close()

        self._broadcast_many(results)
        has_attack = any(r["is_attack"] for r in results)
        return {"status": "success", "processed": len(results), "has_attack": has_attack}

    def _broadcast_many(self, results: list):
        if not self._loop or not self._broadcaster:
            return
        for result in results:
            try:
                asyncio.run_coroutine_threadsafe(
                    self._broadcaster({"type": "prediction", "data": result}), self._loop
                )
            except RuntimeError:
                # The event loop closed (e.g. app shutting down) while a
                # background capture thread was mid-flight. The prediction
                # is already committed to the DB above — just skip the
                # live broadcast rather than crashing the ingest thread.
                logger.warning("[pipeline] event loop unavailable — dropping WS broadcast")


pipeline = FlowIngestPipeline()
