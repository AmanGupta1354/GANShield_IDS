<div align="center">

<img src="https://img.shields.io/badge/GANShield-IDS%20Intelligence%20Platform-e78a53?style=for-the-badge&logo=shield&logoColor=white" alt="GANShield Banner"/>

# 🛡️ GANShield IDS

### AI-Powered Intrusion Detection System with Live Network Monitoring

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![JavaScript](https://img.shields.io/badge/JavaScript-JSX-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Vite](https://img.shields.io/badge/Vite-7.3.1-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1.18-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12.34.0-FF0055?style=flat-square&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-ML%20Model-FF6600?style=flat-square&logo=python&logoColor=white)](https://xgboost.readthedocs.io/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Scapy](https://img.shields.io/badge/Scapy-Packet%20Capture-4B8BBE?style=flat-square&logo=python&logoColor=white)](https://scapy.net/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## 📌 Overview

**GANShield IDS** is a full-stack AI-powered Intrusion Detection System built as part of the GANShield research project at **DJSCE, Mumbai University**. It combines a trained XGBoost ML model with a modern React dashboard to detect and visualize attacks against **this application's own traffic** in real time.

Packets destined for the app's own port(s) are captured via **Scapy** (scoped with a BPF filter — see below), converted to CICFlowMeter-style flow features in pure Python, classified by the **XGBoost model** inside **FastAPI**, and streamed to the React dashboard over **WebSocket** — all in real time, in a single process.

> 🔐 Built for network security analysts and researchers working with the CICIDS2018 dataset.

### 🎯 What's being monitored

GANShield monitors **traffic entering this website/application**, not the whole network. Capture is scoped with a BPF filter to the app's own listening port(s) (`settings.MONITORED_PORTS`, e.g. `tcp port 8000`), so only connections to/from this service are ever sniffed or classified — arbitrary traffic elsewhere on the NIC never reaches the pipeline.

This is deliberately a **network-flow-level** capture rather than a TLS-terminating proxy: flow statistics (packet sizes, timing, TCP flags, window size) are visible on the wire regardless of whether the payload is HTTPS-encrypted, so scoping the *existing* packet-capture pipeline by port gets "traffic entering the app" without decrypting anything, adding a proxy hop, or changing a single feature the ML model expects. The trade-off: this sees connection metadata, not HTTP payload content — it won't catch e.g. a SQL injection string in a request body. A complementary, lightweight ASGI middleware (`request_logging_middleware` in `Backend/main.py`) logs per-HTTP-request metadata (method, path, status, latency, client IP) to a separate `request_logs` table and WebSocket channel for application-layer visibility, independent of the ML classifier.

---

## ✨ Features

- 🌑 **Dark Mode UI** with orange/amber neon accent palette
- 🎞️ **Smooth Animations** powered by Framer Motion
- 🔐 **JWT Auth Flow** — Login & Sign-up with secure token storage
- 📊 **Analytics Dashboard** with real-time charts (Recharts)
- 🌐 **Landing Page** with hero section, feature grid, social proof & footer
- 💫 **Micro-animations** — Spinning Shield, Glowing Effects, Display Cards, Text Scramble
- 🤖 **XGBoost ML Model** trained on CICIDS2018 dataset (12 attack classes)
- 🔴 **Live Network Detection** via Scapy → pure-Python pcap_to_csv → FastAPI WebSocket
- 🗄️ **Persistent Logging & Storage Optimization** — All flows saved to SQLite; CSVs/PCAPs auto-rotated (maintaining last 5) & auto-archived on attack
- 🎛️ **Capture Control API** — Start/stop packet capture directly from the dashboard
- ⚡ **Blazing Fast** — Vite dev server with HMR
- 📱 **Fully Responsive** layout

---

## 🧰 Tech Stack

| Category | Technology | Version |
|---|---|---|
| **Framework** | React | `^19.2.0` |
| **Language** | JavaScript (JSX) | ES2022 |
| **Build Tool** | Vite | `^7.3.1` |
| **Styling** | TailwindCSS | `^4.1.18` |
| **Animations** | Framer Motion | `^12.34.0` |
| **Routing** | React Router DOM | `^7.13.0` |
| **Charts** | Recharts | `^3.7.0` |
| **Icons** | Lucide React | `^0.564.0` |
| **Utilities** | clsx + tailwind-merge | `^2.1.1` / `^3.5.0` |
| **ML Model** | XGBoost | `2.0.3` |
| **Backend** | FastAPI + Uvicorn | `0.115.0` |
| **Auth** | JWT (python-jose + passlib) | latest |
| **Database** | SQLite + SQLAlchemy | `2.0.30` |
| **Packet Capture** | Scapy | `2.5.0` |
| **Flow Export** | pcap_to_csv (Python) | CICIDS2018 |
| **File Watcher** | Watchdog | `4.0.1` |

---

## 📁 Project Structure

```
GANShield-IDS/
├── public/                          # Static assets
├── src/
│   ├── components/                  # Reusable UI components
│   │   ├── ui/                      # Low-level UI primitives
│   │   │   ├── display-cards.jsx
│   │   │   ├── flow-field-background.jsx
│   │   │   ├── glowing-effect.jsx
│   │   │   ├── material-design-3-ripple.jsx
│   │   │   └── text-scramble.jsx
│   │   ├── AuthForm.jsx
│   │   ├── Background.jsx
│   │   ├── ClickSpark.jsx
│   │   ├── DisplayCardsSection.jsx
│   │   ├── FeaturesGrid.jsx
│   │   ├── Footer.jsx
│   │   ├── GridFloor.jsx
│   │   ├── HeroSection.jsx
│   │   ├── Input.jsx
│   │   ├── Navbar.jsx
│   │   ├── SocialProof.jsx
│   │   └── SpinningShield.jsx
│   ├── hooks/
│   │   ├── useWebSocket.js          # WebSocket connection hook
│   │   └── useLiveDetection.js      # Live detection state + capture control
│   ├── services/
│   │   ├── api.js                   # REST API client (auth, stats, logs, capture)
│   │   └── websocket.js             # WebSocket client with auto-reconnect
│   ├── lib/
│   │   └── utils.js                 # Shared utility functions
│   ├── pages/
│   │   ├── AuthPage.jsx             # Auth page (login/signup)
│   │   ├── Dashboard.jsx            # Main analytics dashboard (live data)
│   │   └── LandingPage.jsx          # Public landing page
│   ├── App.jsx                      # Root component + routing
│   ├── App.css
│   ├── index.css                    # Global styles + CSS variables
│   └── main.jsx                     # Entry point
├── backend/
│   ├── main.py                      # FastAPI app — routes, WebSocket, request-log middleware
│   ├── pipeline.py                  # Shared ingest: predict + persist + broadcast (no HTTP hop)
│   ├── watcher.py                   # Manual CLI: backfill archived CSVs (not required to run live)
│   ├── predictor.py                 # XGBoost model loader + inference engine (unchanged)
│   ├── packet_capture.py            # Scapy capture, BPF-scoped to this app's port(s)
│   ├── pcap_to_csv.py               # Pure-Python PCAP → flow rows (+ CSV writer)
│   ├── pcap_watcher.py              # Watches PCAP dir, calls pipeline in-process, rotates files
│   ├── auth.py                      # JWT creation, validation, password hashing
│   ├── database.py                  # SQLAlchemy models + session setup (SQLite)
│   ├── models.py                    # Pydantic request/response schemas
│   ├── config.py                    # Centralised settings incl. CAPTURE_BPF_FILTER
│   ├── tests/                       # pytest suite (pipeline, config, capture, API)
│   ├── requirements.txt
│   └── model/
│       ├── xgb_IDS_model.json       # Trained XGBoost model
│       └── label_encoder.pkl        # LabelEncoder (12 classes)
├── ml/
│   ├── train.py                     # Model training script
│   ├── test.py                      # Model evaluation script
│   └── check_model.py               # Model inspection utility
├── .env                             # Frontend env vars (VITE_API_URL, VITE_WS_URL)
├── index.html
├── vite.config.js
└── package.json
```

---

## 🔴 Live Detection Architecture

Everything below runs **inside one FastAPI process** — no second process to remember to start, no HTTP call back into the same server.

```
NIC, filtered to THIS app's port(s)   ← BPF filter: settings.CAPTURE_BPF_FILTER
        │                                (e.g. "tcp port 8000") — scopes
        ▼                                capture to "traffic entering the app"
 packet_capture.py          ← Scapy sniffs, flushes a PCAP every N seconds
        │
        ▼
  pcap_output/*.pcap
        │
        ▼  (watchdog, in-process)
pcap_watcher.py             ← pcap_to_csv.pcap_to_flows() → in-memory rows
        │                       (CSV also written to flow_output/ for audit)
        ▼
  pipeline.ingest_rows()    ← predictor.predict_batch() [UNCHANGED XGBoost model]
        │                       + persists FlowLog rows + rotates/archives files
        ▼
manager.broadcast()         ← scheduled onto the FastAPI event loop from the
        │                       capture thread via run_coroutine_threadsafe
        ▼
WebSocket /ws/live          ← Broadcasts prediction to all clients
        │
        ▼
React Dashboard             ← Live table + charts update in real time
```

Application-layer visibility (separate, non-ML channel):

```
Any HTTP request → request_logging_middleware (Backend/main.py)
        │
        ▼
  request_logs table  +  WS broadcast {"type": "request", ...}
        │
        ▼
GET /requests/logs   ← method, path, status, latency, client IP, UA
```

Previously, a packet reaching the model required: PCAP flush → watchdog →
CSV write → **a second, separately-run `watcher.py` process** polling that
CSV → an HTTP POST back to this same server. That's now collapsed to a
single in-process call (`pipeline.ingest_rows`) — one process, one hop,
no self-referential HTTP round-trip. `watcher.py` still exists, but only as
a manual CLI for reprocessing archived CSVs (`python watcher.py <dir>`) —
it is not required for the live pipeline.

---

## 🎯 Attack Classes Detected

| Class | Description |
|---|---|
| Benign | Normal traffic |
| Bot | Botnet activity |
| DDoS attacks-LOIC-HTTP | HTTP flood attack |
| DoS attacks-GoldenEye | GoldenEye DoS |
| DoS attacks-Hulk | Hulk DoS |
| DoS attacks-SlowHTTPTest | Slow HTTP Test |
| DoS attacks-Slowloris | Slowloris DoS |
| FTP-BruteForce | FTP brute force |
| Infilteration | Network infiltration |
| SFTP-BruteForce | SFTP brute force |
| SQL Injection | SQLi attacks |
| SSH-Bruteforce | SSH brute force |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** `>= 18.x` — [Download](https://nodejs.org/)
- **npm** `>= 9.x` *(comes with Node.js)*
- **Python** `>= 3.9`
- **Git** — [Download](https://git-scm.com/)
- **Npcap** — [Download](https://npcap.com/) *(Required for Windows packet capture)*

> ⚠️ **Windows users:** Run this once if `npm` fails in PowerShell:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
> ```

> ⚠️ **Packet capture requires root/admin** privileges (Scapy needs raw socket access).

---

### 🔧 Frontend Setup

```bash
# 1. Clone
git clone https://github.com/AmanGupta1354/GANShield-IDS.git
cd GANShield-IDS

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Configure env
echo "VITE_API_URL=http://localhost:8000" >> .env
echo "VITE_WS_URL=ws://localhost:8000/ws/live" >> .env

# 4. Start dev server
npm run dev
# → http://localhost:5173
```

---

### 🐍 Backend Setup

```bash
cd Backend

# Install Python dependencies
pip install -r requirements.txt

# (Optional) scope capture to a different port/set of ports — defaults to
# MONITORED_PORTS=[8000]. Add to Backend/.env or set as an env var:
echo "MONITORED_PORTS=[8000]" >> .env

# Start FastAPI server — this is the ONLY process you need to run.
# The old separate `python watcher.py` step is gone: pcap_watcher now
# calls the prediction pipeline directly, in-process.
uvicorn main:app --port 8000
```

---

### 📡 Live Capture Setup

Start live packet capture (scoped to this app's own port via a BPF filter — see `settings.CAPTURE_BPF_FILTER`) directly from the dashboard UI or via API:

```bash
# Start capture (Linux/macOS — requires sudo; Windows — run as Administrator + Npcap)
curl -X POST http://localhost:8000/capture/start \
  -H "Authorization: Bearer <your_token>"

# Stop capture
curl -X POST http://localhost:8000/capture/stop \
  -H "Authorization: Bearer <your_token>"

# Check status — includes the active bpf_filter and monitored_ports
curl http://localhost:8000/capture/status \
  -H "Authorization: Bearer <your_token>"
```

---

### ✅ Running Tests

```bash
cd Backend
pip install -r requirements.txt   # includes pytest, pytest-cov, httpx
pytest tests/ -v
```

The suite covers: BPF filter construction (`test_config.py`), the CICFlowMeter-style
column mapping and end-to-end predict-and-persist pipeline (`test_pipeline.py`),
PCAP → flow-row extraction and port scoping (`test_pcap_to_csv.py`), and the
FastAPI routes including auth, `/predict/live`, `/stats`, `/capture/status`,
and `/requests/logs` (`test_main.py`). Tests use a temp SQLite file and the
real bundled model — no mocking of the ML pipeline.

**To validate the new traffic source manually:**
1. Start the server (`uvicorn main:app --port 8000`) and log in via the dashboard.
2. Hit `POST /capture/start` — confirm the response's `bpf_filter` reads
   `tcp port 8000` (or whatever `MONITORED_PORTS` you set).
3. Generate some traffic against the app itself (e.g. refresh the dashboard,
   hammer `curl http://localhost:8000/health` a few times).
4. After one flush interval (`PCAP_FLUSH_INTERVAL_S`, default 10s), check
   `GET /logs` — new `FlowLog` rows should appear with `dst_port` matching
   your app's port, sourced entirely from this app's own traffic.
5. Check `GET /requests/logs` for the application-layer view of the same
   window — per-request method/path/status/latency.

---

### 🤖 ML Model

```bash
cd ml

python check_model.py   # Inspect model structure
python test.py          # Evaluate on test dataset
python train.py         # Retrain from scratch (if needed)
```

---

## 🌐 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Register new user |
| `POST` | `/auth/login` | ❌ | Login, returns JWT |
| `GET` | `/auth/me` | ✅ | Current user info |
| `POST` | `/predict/live` | ❌ | Predict single flow (called in-process by pipeline/pcap_watcher) |
| `POST` | `/predict/live/batch` | ❌ | Predict a batch of flows |
| `POST` | `/predict/single` | ✅ | Manual single prediction |
| `POST` | `/predict/batch` | ✅ | Batch prediction |
| `GET` | `/stats` | ✅ | Dashboard stats + top attacks (SQL-aggregated) |
| `GET` | `/logs` | ✅ | Flow history (filterable) |
| `GET` | `/requests/logs` | ✅ | Application-layer HTTP request log |
| `POST` | `/capture/start` | ✅ | Start port-scoped Scapy capture + pipeline |
| `POST` | `/capture/stop` | ✅ | Stop capture pipeline |
| `GET` | `/capture/status` | ✅ | Capture status, BPF filter, monitored ports |
| `WS` | `/ws/live` | ❌ | Real-time prediction + request-log stream |
| `GET` | `/health` | ❌ | Server + model health check |

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| **Dev Server** | `npm run dev` | Start local dev server with HMR |
| **Build** | `npm run build` | Bundle for production |
| **Preview** | `npm run preview` | Preview production build |
| **Lint** | `npm run lint` | Run ESLint checks |

---

## 🏗️ Production Build

```bash
npm run build
# Output → dist/
```

Deploy the `dist/` folder to any static host. The FastAPI backend can be deployed separately on Railway, Render, or a VPS.

---

## 🌐 Deployment

| Platform | Frontend | Backend |
|---|---|---|
| [Vercel](https://vercel.com) | ✅ Import repo, zero config | ❌ |
| [Netlify](https://netlify.com) | ✅ Build cmd: `npm run build` | ❌ |
| [Render](https://render.com) | ✅ Static site | ✅ Python web service |
| [Railway](https://railway.app) | ✅ | ✅ |
| VPS / Docker | ✅ nginx | ✅ uvicorn + systemd |

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

⭐ Star this repo if you find it useful!

</div>