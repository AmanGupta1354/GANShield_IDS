const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function getToken() {
  return localStorage.getItem("ganshield_token");
}

function authHeaders() {
  const token = getToken();
  if (!token) throw new Error("Not authenticated");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
async function handleResponse(res) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Auth ──────────────────────────────────────────────────────
export async function loginUser(email, password) {
  const form = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const data = await handleResponse(res);
  localStorage.setItem("ganshield_token", data.access_token);
  return data;
}

export async function registerUser(name, email, password) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await handleResponse(res);
  localStorage.setItem("ganshield_token", data.access_token);
  return data;
}

export function logoutUser() {
  localStorage.removeItem("ganshield_token");
}

export async function getMe() {
  const res = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders() });
  return handleResponse(res);
}

// ─── Stats ─────────────────────────────────────────────────────
export async function fetchStats() {
  const res = await fetch(`${BASE_URL}/stats`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function fetchLogs(limit = 100, attackOnly = false) {
  const params = new URLSearchParams({ limit, attack_only: attackOnly });
  const res = await fetch(`${BASE_URL}/logs?${params}`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function fetchGeoBatch(ips) {
  const res = await fetch(`${BASE_URL}/geo/batch`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ips }),
  });
  return handleResponse(res);
}

export async function resetBenignLogs() {
  const res = await fetch(`${BASE_URL}/logs/benign`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

// ─── Prediction ────────────────────────────────────────────────
export async function predictSingle(features) {
  const res = await fetch(`${BASE_URL}/predict/single`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(features),
  });
  return handleResponse(res);
}

// ─── Capture Control ───────────────────────────────────────────
export async function startCapture(networkInterface = null) {
  const params = networkInterface ? `?interface=${networkInterface}` : "";
  const res = await fetch(`${BASE_URL}/capture/start${params}`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function stopCapture() {
  const res = await fetch(`${BASE_URL}/capture/stop`, {
    method: "POST",
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getCaptureStatus() {
  const res = await fetch(`${BASE_URL}/capture/status`, { headers: authHeaders() });
  return handleResponse(res);
}

export async function healthCheck() {
  const res = await fetch(`${BASE_URL}/health`);
  return handleResponse(res);
}