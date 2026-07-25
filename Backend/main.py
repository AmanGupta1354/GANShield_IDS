import json
import logging
import traceback
from datetime import datetime, timezone
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from config import settings
from database import init_db, get_db, FlowLog, User
from models import (
    UserCreate, Token, PredictionResult, LivePredictionPayload,
    BatchPredictionRequest, DashboardStats, FlowFeatures, GeoBatchRequest,
)
from geo import lookup_ip, lookup_ips
from auth import (
    hash_password, authenticate_user, create_access_token,
    get_current_user, get_user_by_email,
)
from predictor import predictor
from packet_capture import packet_capture
from pcap_watcher import pcap_watcher_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ── WebSocket Connection Manager ───────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, data: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


# ── Lifespan ───────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("✅ Database initialized")
    if predictor.is_ready:
        logger.info("✅ ML model loaded")
    else:
        logger.warning("⚠️  ML model not loaded — prediction endpoints will return 503")
    yield
    packet_capture.stop()
    pcap_watcher_service.stop()
    logger.info("Server shutdown complete.")


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(title="GANShield IDS API", version="1.0.0", lifespan=lifespan)

# FIXED: CORS must be added BEFORE the global exception handler so headers
# are present on every response including 4xx/5xx
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# FIXED: Global exception handler — unhandled 500s now return JSON with CORS
# headers instead of crashing through Starlette's error middleware
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}:\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc)}"},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=getattr(exc, "headers", None),
    )


# ── Auth Routes ────────────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
    )
    db.add(user)
    db.commit()
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/auth/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"email": current_user.email, "name": current_user.name}


# ── Prediction Routes ──────────────────────────────────────────────────────────

@app.post("/predict/live")
async def predict_live(payload: LivePredictionPayload, db: Session = Depends(get_db)):
    if not predictor.is_ready:
        raise HTTPException(status_code=503, detail="ML model not loaded")

    features = payload.features.model_dump()
    label, confidence, is_attack = predictor.predict(features)
    ts = datetime.now(timezone.utc)

    log = FlowLog(
        timestamp=ts,
        label=label,
        confidence=confidence,
        is_attack=is_attack,
        src_ip=payload.src_ip,
        dst_ip=payload.dst_ip,
        src_port=payload.src_port,
        dst_port=int(features.get("dst_port", 0)),
        protocol=payload.protocol,
        raw_features=json.dumps(features),
    )
    db.add(log)
    db.commit()

    result = {
        "id": log.id,
        "label": label,
        "confidence": confidence,
        "is_attack": is_attack,
        "timestamp": ts.isoformat(),
        "src_ip": payload.src_ip,
        "dst_ip": payload.dst_ip,
        "src_port": payload.src_port,
        "dst_port": int(features.get("dst_port", 0)),
        "protocol": payload.protocol,
    }

    await manager.broadcast({"type": "prediction", "data": result})
    return result


@app.post("/predict/batch")
def predict_batch(
    request: BatchPredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not predictor.is_ready:
        raise HTTPException(status_code=503, detail="ML model not loaded")
    results = predictor.predict_batch([f.model_dump() for f in request.flows])
    return {"results": results, "total": len(results)}


@app.post("/predict/single")
def predict_single(
    features: FlowFeatures,
    current_user: User = Depends(get_current_user),
):
    if not predictor.is_ready:
        raise HTTPException(status_code=503, detail="ML model not loaded")
    label, confidence, is_attack = predictor.predict(features.model_dump())
    return {"label": label, "confidence": confidence, "is_attack": is_attack}


# ── Dashboard Stats ────────────────────────────────────────────────────────────

@app.get("/stats", response_model=DashboardStats)
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logs = db.query(FlowLog).all()
    total = len(logs)
    attacks = [l for l in logs if l.is_attack]
    benign = total - len(attacks)

    from collections import Counter
    label_counts = Counter(l.label for l in attacks)
    top_attacks = [{"label": k, "count": v} for k, v in label_counts.most_common(5)]

    recent_alerts = [
        {
            "id": log.id,
            "label": log.label,
            "confidence": log.confidence,
            "timestamp": log.timestamp.isoformat(),
            "src_ip": log.src_ip,
            "dst_ip": log.dst_ip,
        }
        for log in sorted(attacks, key=lambda x: x.timestamp, reverse=True)[:20]
    ]

    return DashboardStats(
        total_flows=total,
        total_attacks=len(attacks),
        total_benign=benign,
        attack_rate=len(attacks) / total if total > 0 else 0.0,
        top_attacks=top_attacks,
        recent_alerts=recent_alerts,
    )


@app.get("/logs")
def get_logs(
    limit: int = 100,
    attack_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(FlowLog)
    if attack_only:
        q = q.filter(FlowLog.is_attack == True)  # noqa: E712
    logs = q.order_by(FlowLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": l.id,
            "label": l.label,
            "confidence": l.confidence,
            "is_attack": l.is_attack,
            "timestamp": l.timestamp.isoformat(),
            "src_ip": l.src_ip,
            "dst_ip": l.dst_ip,
            "src_port": l.src_port,
            "dst_port": l.dst_port,
        }
        for l in logs
    ]

@app.delete("/logs/benign")
def delete_benign_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deleted_count = db.query(FlowLog).filter(FlowLog.is_attack == False).delete()
    db.commit()
    return {"status": "success", "deleted": deleted_count}


# ── Geolocation ────────────────────────────────────────────────────────────────

@app.get("/geo/ip/{ip}")
def geo_lookup_ip(ip: str, current_user: User = Depends(get_current_user)):
    return lookup_ip(ip)


@app.post("/geo/batch")
def geo_lookup_batch(
    body: GeoBatchRequest,
    current_user: User = Depends(get_current_user),
):
    return lookup_ips(body.ips)


# ── Capture Control ────────────────────────────────────────────────────────────

@app.post("/capture/start")
def start_capture(
    interface: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    packet_capture.interface = interface or settings.CAPTURE_INTERFACE
    packet_capture.start()
    pcap_watcher_service.start()
    return {"status": "started", "interface": packet_capture.interface}


@app.post("/capture/stop")
def stop_capture(current_user: User = Depends(get_current_user)):
    packet_capture.stop()
    pcap_watcher_service.stop()
    return {"status": "stopped"}


@app.get("/capture/status")
def capture_status(current_user: User = Depends(get_current_user)):
    return {
        "packet_capture": packet_capture.is_running(),
        "pcap_watcher": pcap_watcher_service.is_running(),
        "interface": packet_capture.interface,
        "available_interfaces": packet_capture.get_interfaces(),
    }


# ── WebSocket ──────────────────────────────────────────────────────────────────

@app.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):
    await manager.connect(websocket)
    logger.info(f"WebSocket connected: {websocket.client}")
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


# ── Health ─────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": predictor.is_ready,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)