from pydantic_settings import BaseSettings
from pathlib import Path
from typing import List

BASE_DIR = Path(__file__).parent

class Settings(BaseSettings):
    # App
    APP_NAME: str = "GANShield IDS"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # JWT
    SECRET_KEY: str = "ganshield-super-secret-key-change-in-prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Model paths
    MODEL_PATH: str = str(BASE_DIR / "model" / "xgb_IDS_model.json")
    ENCODER_PATH: str = str(BASE_DIR / "model" / "label_encoder.pkl")

    # CICFlowMeter (Python package – no Java JAR needed)
    FLOW_OUTPUT_DIR: str = str(BASE_DIR / "flow_output")
    FLOW_CSV_FILENAME: str = "flow_output.csv"

    # Packet Capture (Windows/Npcap: use Scapy-friendly name, not raw GUID)
    CAPTURE_INTERFACE: str = "WiFi 2"
    CAPTURE_PCAP_DIR: str = str(BASE_DIR / "pcap_output")

    # Traffic scope: instead of sniffing the whole NIC, capture is scoped to
    # traffic entering/leaving OUR application's own port(s) via a BPF filter.
    # This preserves the Scapy -> flow-features -> XGBoost pipeline unchanged
    # (flow-level stats like size/timing/TCP flags are visible on the wire
    # regardless of TLS) while narrowing "network monitoring" down to
    # "monitor traffic hitting this website/app".
    MONITORED_PORTS: List[int] = [8000]
    PCAP_FLUSH_INTERVAL_S: int = 10

    # Application-layer request logging (HTTP-level visibility, separate
    # from the ML flow classifier — see RequestLog / middleware in main.py)
    REQUEST_LOG_MAX_ROWS: int = 5000

    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/ganshield.db"

    class Config:
        env_file = ".env"

    @property
    def CAPTURE_BPF_FILTER(self) -> str:
        """BPF filter string scoping capture to the app's own port(s)."""
        ports = self.MONITORED_PORTS or [self.PORT]
        return " or ".join(f"tcp port {p}" for p in ports)


settings = Settings()