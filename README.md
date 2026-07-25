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

**GANShield IDS** is a full-stack AI-powered Intrusion Detection System built as part of the GANShield research project at **DJSCE, Mumbai University**. It combines a trained XGBoost ML model with a modern React dashboard to detect and visualize network attacks in real time.

Live packets are captured from the NIC via **Scapy**, converted to flow features by **CICFlowMeter**, classified by the **XGBoost model** inside **FastAPI**, and streamed to the React dashboard over **WebSocket** — all in real time.

> 🔐 Built for network security analysts and researchers working with the CICIDS2018 dataset.

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
│   ├── main.py                      # FastAPI app — all routes + WebSocket
│   ├── watcher.py                   # Watchdog CSV watcher → POST /predict/live
│   ├── predictor.py                 # XGBoost model loader + inference engine
│   ├── packet_capture.py            # Scapy-based live packet capture → PCAP
│   ├── pcap_to_csv.py               # Pure-Python PCAP → CSV flow converter
│   ├── pcap_watcher.py              # Watches PCAP & converts using pcap_to_csv
│   ├── auth.py                      # JWT creation, validation, password hashing
│   ├── database.py                  # SQLAlchemy models + session setup (SQLite)
│   ├── models.py                    # Pydantic request/response schemas
│   ├── config.py                    # Centralised settings (env-aware)
│   ├── requirements.txt
│   └── model/
│       ├── xgb_IDS_model_fixed.json # Trained XGBoost model
│       ├── scaler.pkl               # StandardScaler
│       └── encoder.pkl              # LabelEncoder (12 classes)
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

```
Network Interface (NIC)
        │
        ▼
 packet_capture.py          ← Scapy sniffs packets every N seconds
        │
        ▼
  pcap_output/*.pcap
        │
        ▼
pcap_watcher.py             ← Converts PCAP to CSV using pcap_to_csv.py
        │
        ▼
 flow_output/*.csv
        │
        ▼
   watcher.py               ← Watchdog detects new CSV rows (Auto-rotates & archives)
        │
        ▼
 POST /predict/live         ← Sends features to FastAPI
        │
        ▼
  predictor.py              ← Scales features → XGBoost inference
        │
        ▼
  database.py               ← Logs result to SQLite
        │
        ▼
WebSocket /ws/live          ← Broadcasts prediction to all clients
        │
        ▼
React Dashboard             ← Live table + charts update in real time
```

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
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start FastAPI server
uvicorn main:app --port 8000

# In a separate terminal — start CSV watcher
python watcher.py
```

---

### 📡 Live Capture Setup

Start live network packet capture directly from the dashboard UI or via API:

```bash
# Start capture (Linux/macOS — requires sudo)
curl -X POST http://localhost:8000/capture/start \
  -H "Authorization: Bearer <your_token>"

# Stop capture
curl -X POST http://localhost:8000/capture/stop \
  -H "Authorization: Bearer <your_token>"

# Check status
curl http://localhost:8000/capture/status \
  -H "Authorization: Bearer <your_token>"
```

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
| `POST` | `/predict/live` | ❌ | Predict single flow (called by watcher) |
| `POST` | `/predict/single` | ✅ | Manual single prediction |
| `POST` | `/predict/batch` | ✅ | Batch prediction |
| `GET` | `/stats` | ✅ | Dashboard stats + top attacks |
| `GET` | `/logs` | ✅ | Flow history (filterable) |
| `POST` | `/capture/start` | ✅ | Start Scapy + CICFlowMeter |
| `POST` | `/capture/stop` | ✅ | Stop capture pipeline |
| `GET` | `/capture/status` | ✅ | Capture + interface status |
| `WS` | `/ws/live` | ❌ | Real-time prediction stream |
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