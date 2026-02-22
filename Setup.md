# Setup Guide

This guide covers everything needed to run Figma NN locally from scratch.

---

## Prerequisites

| Dependency | Minimum Version | Notes |
|---|---|---|
| Python | 3.10+ | 3.13 recommended |
| Node.js | 18+ | Required for the frontend |
| pnpm | 8+ | Frontend package manager |

If you do not have pnpm installed:
```bash
npm install -g pnpm
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/your-org/Figma-NN.git
cd Figma-NN
```

---

## 2. Backend Setup

### Create a virtual environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # macOS / Linux
# venv\Scripts\activate         # Windows
```

### Install dependencies

```bash
pip install -r requirements.txt
```

This installs Flask, Flask-SocketIO, PyTorch, torchvision, and the AI provider SDKs (OpenAI, Anthropic, Google Gemini).

### Configure the AI assistant

The AI assistant (Neuron) supports three providers. Set the relevant environment variable before starting the backend:

**Option A: Anthropic Claude (default model: `claude-3-5-haiku-20241022`)**
```bash
export PROVIDER=anthropic
export ANTHROPIC_API_KEY=your_key_here
```

**Option B: OpenAI (default model: `gpt-4o`)**
```bash
export PROVIDER=openai
export OPENAI_API_KEY=your_key_here
```

**Option C: Google Gemini (default model: `gemini-2.0-flash-lite`)**
```bash
export PROVIDER=google
export GOOGLE_API_KEY=your_key_here
```

If no provider is configured, the chat endpoint will return an error when the AI assistant is used. Everything else in the app (training, marketplace, collaboration) works without an API key.

### Start the backend

```bash
python3 api.py
```

The backend runs on `http://localhost:8080`.

On first run, PyTorch will automatically download the MNIST and EMNIST datasets into `backend/services/data/` and `backend/data/`. This is a one-time download of approximately 500 MB and may take a few minutes depending on your connection.

---

## 3. Frontend Setup

Open a new terminal window.

### Install dependencies

```bash
cd frontend
pnpm install
```

### Start the dev server

```bash
pnpm dev
```

The frontend runs on `http://localhost:5173`.

All `/api/*` requests and Socket.IO connections are proxied to the backend at port 8080. No additional configuration is needed.

---

## 4. Verify Everything is Working

Open `http://localhost:5173` in your browser.

**Canvas (Playground)**
- The drag-and-drop canvas should load with a blank state.
- Drag a layer from the left sidebar onto the canvas and confirm it appears.

**Training**
- Build a minimal architecture: Input -> Flatten -> Output
- Open the bottom drawer, go to the Config tab, set epochs to 1
- Click Train; the progress bar should fill and charts should update in real time

**Collaboration**
- Open `http://localhost:5173` in a second browser tab
- Any layer you add in one tab should appear in the other within a second

**AI Assistant**
- Click the Neuron tab in the right inspector panel
- Send a message; if the provider is configured correctly, a response should stream back

---

## 5. Project Ports Summary

| Service | Port | URL |
|---|---|---|
| Frontend (Vite dev server) | 5173 | http://localhost:5173 |
| Backend (Flask) | 8080 | http://localhost:8080 |
| Socket.IO | 8080 | (same as backend, via `/socket.io`) |

---

## 6. Common Issues

**Dataset download hangs or fails**

MNIST and EMNIST are downloaded from Yann LeCun's and NIST's servers. If the download times out, delete the partial files in `backend/services/data/` and `backend/data/`, then restart the backend.

**Port 8080 already in use**

Find and stop the conflicting process:
```bash
lsof -ti :8080 | xargs kill
```

**PyTorch not found after installing requirements**

Ensure you activated the virtual environment before installing:
```bash
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

**Socket.IO connection fails in the browser**

Confirm the backend is running on port 8080. The Vite proxy handles `/socket.io` automatically; no manual CORS configuration is needed when running through the dev server.

**Marketplace models not loading after backend restart**

Training run metadata (not weights) is stored in memory and lost on restart. The marketplace database (`backend/controllers/marketplace.db`) and trained weight files (`backend/saved_models/`) survive restarts. If a model page shows missing data, it was not saved before the restart.

---

## 7. Production Build (Optional)

To build a static frontend bundle:

```bash
cd frontend
pnpm build
```

Output goes to `frontend/dist/`. Serve it with any static file server, and point `/api` and `/socket.io` routes to the Flask backend.

Note: the backend is not production-hardened. Flask's built-in server is used directly. For a production deployment, run the backend behind Gunicorn with eventlet or gevent for Socket.IO support.
