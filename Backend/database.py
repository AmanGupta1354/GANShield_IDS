from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime
from config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite only
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)


class FlowLog(Base):
    __tablename__ = "flow_logs"
    id = Column(Integer, primary_key=True, index=True)
    # Indexed: /stats and /logs filter/sort on these for every request.
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    label = Column(String, nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    is_attack = Column(Boolean, nullable=False, index=True)
    src_ip = Column(String, nullable=True)
    dst_ip = Column(String, nullable=True)
    src_port = Column(Integer, nullable=True)
    dst_port = Column(Integer, nullable=True)
    protocol = Column(String, nullable=True)
    raw_features = Column(Text, nullable=True)  # JSON string


class RequestLog(Base):
    """Application-layer visibility: one row per HTTP request that hit this
    app (see the ASGI middleware in main.py). Independent of the ML flow
    classifier — this is raw request metadata, not a prediction."""
    __tablename__ = "request_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    method = Column(String, nullable=False)
    path = Column(String, nullable=False)
    status_code = Column(Integer, nullable=False)
    duration_ms = Column(Float, nullable=False)
    client_ip = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    content_length = Column(Integer, nullable=True)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()