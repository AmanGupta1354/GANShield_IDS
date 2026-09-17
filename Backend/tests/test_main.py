def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "model_loaded" in body


def test_register_and_login(client):
    resp = client.post(
        "/auth/register",
        json={"email": "newuser@example.com", "password": "hunter2hunter2", "name": "New User"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()

    resp = client.post(
        "/auth/login",
        data={"username": "newuser@example.com", "password": "hunter2hunter2"},
    )
    assert resp.status_code == 200


def test_register_duplicate_email_rejected(client):
    payload = {"email": "dupe@example.com", "password": "hunter2hunter2", "name": "Dupe"}
    client.post("/auth/register", json=payload)
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code == 400


def test_predict_live_requires_no_auth_and_persists(client, zero_features):
    resp = client.post("/predict/live", json={"features": zero_features, "src_ip": "9.9.9.9"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["processed"] == 1


def test_stats_requires_auth(client):
    resp = client.get("/stats")
    assert resp.status_code == 401


def test_stats_after_prediction(client, auth_headers, zero_features):
    client.post("/predict/live", json={"features": zero_features, "src_ip": "9.9.9.8"})
    resp = client.get("/stats", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_flows"] >= 1


def test_capture_status_reports_bpf_filter(client, auth_headers):
    resp = client.get("/capture/status", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "bpf_filter" in body
    assert "tcp port" in body["bpf_filter"]


def test_requests_log_records_http_traffic(client, auth_headers):
    client.get("/health")
    resp = client.get("/requests/logs", headers=auth_headers)
    assert resp.status_code == 200
    paths = [r["path"] for r in resp.json()]
    assert "/capture/status" in paths or "/auth/register" in paths
    # /health is intentionally excluded from request logging (noisy polling path)
    assert "/health" not in paths
