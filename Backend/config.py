from pydantic_settings import BaseSettings
from pathlib import Path

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

    # Database
    DATABASE_URL: str = f"sqlite:///{BASE_DIR}/ganshield.db"

    class Config:
        env_file = ".env"

settings = Settings()