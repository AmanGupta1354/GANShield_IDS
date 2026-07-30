import numpy as np
import pickle
import xgboost as xgb
from pathlib import Path
from typing import Tuple
from config import settings
import logging

logger = logging.getLogger(__name__)

FEATURE_COLUMNS = [
    "dst_port", "protocol", "flow_duration", "tot_fwd_pkts", "tot_bwd_pkts",
    "totlen_fwd_pkts", "totlen_bwd_pkts", "fwd_pkt_len_max", "fwd_pkt_len_min",
    "fwd_pkt_len_mean", "fwd_pkt_len_std", "bwd_pkt_len_max", "bwd_pkt_len_min",
    "bwd_pkt_len_mean", "bwd_pkt_len_std", "flow_byts_s", "flow_pkts_s",
    "flow_iat_mean", "flow_iat_std", "flow_iat_max", "flow_iat_min",
    "fwd_iat_tot", "fwd_iat_mean", "fwd_iat_std", "fwd_iat_max", "fwd_iat_min",
    "bwd_iat_tot", "bwd_iat_mean", "bwd_iat_std", "bwd_iat_max", "bwd_iat_min",
    "fwd_psh_flags", "bwd_psh_flags", "fwd_urg_flags", "bwd_urg_flags",
    "fwd_header_len", "bwd_header_len", "fwd_pkts_s", "bwd_pkts_s",
    "pkt_len_min", "pkt_len_max", "pkt_len_mean", "pkt_len_std", "pkt_len_var",
    "fin_flag_cnt", "syn_flag_cnt", "rst_flag_cnt", "psh_flag_cnt", "ack_flag_cnt",
    "urg_flag_cnt", "cwe_flag_count", "ece_flag_cnt", "down_up_ratio",
    "pkt_size_avg", "fwd_seg_size_avg", "bwd_seg_size_avg",
    "fwd_byts_b_avg", "fwd_pkts_b_avg", "fwd_blk_rate_avg",
    "bwd_byts_b_avg", "bwd_pkts_b_avg", "bwd_blk_rate_avg",
    "subflow_fwd_pkts", "subflow_fwd_byts", "subflow_bwd_pkts", "subflow_bwd_byts",
    "init_fwd_win_byts", "init_bwd_win_byts", "fwd_act_data_pkts", "fwd_seg_size_min",
    "active_mean", "active_std", "active_max", "active_min",
    "idle_mean", "idle_std", "idle_max", "idle_min",
]

BENIGN_LABEL = "Benign"


class IDSPredictor:
    def __init__(self):
        self.model = None
        self.encoder = None
        self._load()

    def _load(self):
        try:
            model_path = Path(settings.MODEL_PATH)
            encoder_path = Path(settings.ENCODER_PATH)

            if not model_path.exists():
                raise FileNotFoundError(f"Model file not found: {model_path}")
            if not encoder_path.exists():
                raise FileNotFoundError(f"Encoder file not found: {encoder_path}")

            # ── Load XGBoost model ─────────────────────────────────────────────
            # .json  → use load_model()   (XGBoost native format)
            # .pkl   → use pickle / joblib (scikit-learn wrapper format)
            suffix = model_path.suffix.lower()
            if suffix == ".json":
                self.model = xgb.XGBClassifier()
                self.model.load_model(str(model_path))
            elif suffix in (".pkl", ".joblib"):
                import joblib
                self.model = joblib.load(str(model_path))
            else:
                # Try XGBoost native as fallback
                self.model = xgb.XGBClassifier()
                self.model.load_model(str(model_path))

            # ── Load LabelEncoder ──────────────────────────────────────────────
            with open(encoder_path, "rb") as f:
                self.encoder = pickle.load(f)

            logger.info(
                f"✅ Model loaded ({suffix}) — "
                f"{len(self.encoder.classes_)} classes: {list(self.encoder.classes_)}"
            )

        except Exception as e:
            logger.warning(
                f"⚠️  Model load failed: {e}\n"
                f"    MODEL_PATH   = {settings.MODEL_PATH}\n"
                f"    ENCODER_PATH = {settings.ENCODER_PATH}\n"
                f"    Check these files exist in backend/model/"
            )
            self.model = None
            self.encoder = None

    def predict(self, features: dict) -> Tuple[str, float, bool]:
        if self.model is None or self.encoder is None:
            raise RuntimeError(
                "ML model is not loaded. "
                "Check MODEL_PATH and ENCODER_PATH in config.py."
            )

        # Build feature vector in the correct column order
        x = np.array(
            [[features.get(col, 0.0) for col in FEATURE_COLUMNS]],
            dtype=np.float64,
        )
        # Replace NaN / Inf that CICFlowMeter sometimes produces
        x = np.nan_to_num(x, nan=0.0, posinf=1e9, neginf=-1e9)

        pred_class = int(self.model.predict(x)[0])
        proba = self.model.predict_proba(x)[0]
        confidence = float(proba[pred_class])

        label = self.encoder.inverse_transform([pred_class])[0]
        is_attack = label.lower() != BENIGN_LABEL.lower()

        return label, confidence, is_attack

    def predict_batch(self, features_list: list) -> list:
        if not features_list:
            return []
            
        if self.model is None or self.encoder is None:
            raise RuntimeError("ML model is not loaded. Check MODEL_PATH and ENCODER_PATH in config.py.")
            
        # Build 2D numpy array for batch
        rows = []
        for features in features_list:
            rows.append([features.get(col, 0.0) for col in FEATURE_COLUMNS])
            
        x_batch = np.array(rows, dtype=np.float64)
        x_batch = np.nan_to_num(x_batch, nan=0.0, posinf=1e9, neginf=-1e9)
        
        pred_classes = self.model.predict(x_batch)
        probas = self.model.predict_proba(x_batch)
        
        results = []
        for i, pred_class in enumerate(pred_classes):
            pred_class = int(pred_class)
            confidence = float(probas[i][pred_class])
            label = self.encoder.inverse_transform([pred_class])[0]
            is_attack = label.lower() != BENIGN_LABEL.lower()
            results.append({"label": label, "confidence": confidence, "is_attack": is_attack})
            
        return results

    @property
    def is_ready(self) -> bool:
        return self.model is not None and self.encoder is not None


# Singleton
predictor = IDSPredictor()