import os
import sys
import tempfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

# Must happen before anything imports config/database — pydantic-settings
# reads these env vars at Settings() construction time (module import).
_tmp_db_fd, _tmp_db_path = tempfile.mkstemp(suffix=".db")
os.close(_tmp_db_fd)
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp_db_path}"
os.environ["DEBUG"] = "false"

import pytest  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _init_db():
    from database import init_db
    init_db()
    yield
    try:
        os.remove(_tmp_db_path)
    except OSError:
        pass


@pytest.fixture
def db_session():
    from database import SessionLocal
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    from fastapi.testclient import TestClient
    import main
    with TestClient(main.app) as c:
        yield c


@pytest.fixture
def auth_headers(client):
    email = "tester@example.com"
    password = "correct-horse-battery-staple"
    client.post("/auth/register", json={"email": email, "password": password, "name": "Tester"})
    resp = client.post("/auth/login", data={"username": email, "password": password})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def zero_features():
    from predictor import FEATURE_COLUMNS
    return {col: 0.0 for col in FEATURE_COLUMNS}
