import asyncio
import logging
import time
import traceback
from datetime import datetime, timezone
from typing import List, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func
from sqlalchemy.orm import Session

from config import settings
from database import init_db, get_db, SessionLocal, FlowLog, RequestLog, User
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
from pipeline import pipeline
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

    # Bind the pipeline to this running event loop so pcap_watcher (running
    # on background threads) can broadcast predictions over WebSocket
    # without an HTTP round-trip back into this same process.
    pipeline.bind(asyncio.get_running_loop(), manager.broadcast)
    logger.info(
        f"✅ Capture scoped to app traffic — filter: '{settings.CAPTURE_BPF_FILTER}'"
    )
    yield
    packet_capture.stop()
    pcap_watcher_service.stop()
    pipeline.bind(None, None)
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


# ── Application-layer request logging ──────────────────────────────────────────
# Literal "traffic entering our website" visibility at the HTTP layer,
# independent of the network-flow ML classifier. Cheap, in-memory-batched,
# and skips noisy/self-referential paths (websocket, health polling) so it
# doesn't become its own bottleneck under load.
_REQUEST_LOG_SKIP_PATHS = {"/health", "/ws/live"}


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    if request.url.path not in _REQUEST_LOG_SKIP_PATHS:
        duration_ms = (time.perf_counter() - start) * 1000
        client_ip = request.client.host if request.client else None
        record = {
            "timestamp": datetime.now(timezone.utc),
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
            "client_ip": client_ip,
            "user_agent": request.headers.get("user-agent"),
            "content_length": int(response.headers.get("content-length") or 0) or None,
        }
        await _persist_request_log(record)
    return response


async def _persist_request_log(record: dict):
    """A single SQLite insert + WS broadcast — cheap enough to await inline.
    Deliberately not fire-and-forget: an unawaited task queue would grow
    unbounded under sustained load, trading a latency micro-optimization
    for a memory-growth bug."""
    try:
        db = SessionLocal()
        try:
            db.add(RequestLog(**record))
            db.commit()
        finally:
            db.close()
        await manager.broadcast({"type": "request", "data": {
            **{k: v for k, v in record.items() if k != "timestamp"},
            "timestamp": record["timestamp"].isoformat(),
        }})
    except Exception:
        logger.exception("Failed to persist request log")


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

def _payload_to_dict(p: LivePredictionPayload) -> dict:
    return {
        "features": p.features.model_dump(),
        "src_ip": p.src_ip,
        "dst_ip": p.dst_ip,
        "src_port": p.src_port,
        "dst_port_info": p.dst_port_info,
        "protocol": p.protocol,
    }


@app.post("/predict/live")
async def predict_live(payload: LivePredictionPayload):
    if not predictor.is_ready:
        raise HTTPException(status_code=503, detail="ML model not loaded")
    result = await asyncio.to_thread(
        pipeline.ingest_payloads, [_payload_to_dict(payload)], "http"
    )
    if result["processed"] == 0:
        raise HTTPException(status_code=503, detail="Prediction failed")
    return result


@app.post("/predict/live/batch")
async def predict_live_batch(payloads: List[LivePredictionPayload]):
    if not predictor.is_ready:
        raise HTTPException(status_code=503, detail="ML model not loaded")
    if not payloads:
        return {"status": "empty", "processed": 0}
    # Run off the event loop: predictor.predict_batch + DB writes are
    # blocking (CPU/IO) and would otherwise stall every other request.
    result = await asyncio.to_thread(
        pipeline.ingest_payloads, [_payload_to_dict(p) for p in payloads], "http"
    )
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
    # Aggregate in SQL instead of loading the whole flow_logs table into
    # Python on every dashboard poll — this used to be O(n) memory/CPU per
    # request and got worse every time a new flow was logged.
    total = db.query(func.count(FlowLog.id)).scalar() or 0
    total_attacks = (
        db.query(func.count(FlowLog.id)).filter(FlowLog.is_attack == True).scalar() or 0  # noqa: E712
    )
    total_benign = total - total_attacks

    top_rows = (
        db.query(FlowLog.label, func.count(FlowLog.id).label("cnt"))
        .filter(FlowLog.is_attack == True)  # noqa: E712
        .group_by(FlowLog.label)
        .order_by(func.count(FlowLog.id).desc())
        .limit(5)
        .all()
    )
    top_attacks = [{"label": label, "count": cnt} for label, cnt in top_rows]

    recent = (
        db.query(FlowLog)
        .filter(FlowLog.is_attack == True)  # noqa: E712
        .order_by(FlowLog.timestamp.desc())
        .limit(20)
        .all()
    )
    recent_alerts = [
        {
            "id": log.id,
            "label": log.label,
            "confidence": log.confidence,
            "timestamp": log.timestamp.isoformat(),
            "src_ip": log.src_ip,
            "dst_ip": log.dst_ip,
        }
        for log in recent
    ]

    return DashboardStats(
        total_flows=total,
        total_attacks=total_attacks,
        total_benign=total_benign,
        attack_rate=(total_attacks / total) if total > 0 else 0.0,
        top_attacks=top_attacks,
        recent_alerts=recent_alerts,
    )


# ── Application-layer traffic logs ─────────────────────────────────────────────

@app.get("/requests/logs")
def get_request_logs(
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    limit = max(1, min(limit, 1000))
    logs = (
        db.query(RequestLog)
        .order_by(RequestLog.timestamp.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "method": r.method,
            "path": r.path,
            "status_code": r.status_code,
            "duration_ms": r.duration_ms,
            "client_ip": r.client_ip,
            "user_agent": r.user_agent,
            "content_length": r.content_length,
        }
        for r in logs
    ]


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
    packet_capture.bpf_filter = settings.CAPTURE_BPF_FILTER
    packet_capture.start()
    pcap_watcher_service.start()
    return {
        "status": "started",
        "interface": packet_capture.interface,
        "bpf_filter": packet_capture.bpf_filter,
        "monitored_ports": settings.MONITORED_PORTS,
    }


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
        "bpf_filter": packet_capture.bpf_filter,
        "monitored_ports": settings.MONITORED_PORTS,
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