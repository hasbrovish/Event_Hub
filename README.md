# EVENT-HUB

Desktop application shell built with **Electron**, a **React** UI (Vite, TypeScript, Tailwind, shadcn-style components), and a **FastAPI** backend.

## Prerequisites

- **Node.js** and **npm** (use **npm 7+** for workspaces)
- **Python 3.10+** for the `backend/` API

Install JavaScript dependencies from the **repository root** only (`npm install`). The root `package.json` defines an npm workspace for `frontend/`.

## Repository layout

| Path | Role |
|------|------|
| `frontend/` | Vite + React + TypeScript UI (npm workspace package) |
| `backend/` | FastAPI app (`main.py`, `requirements.txt`); use a local `.venv` here |
| `electron/` | Electron main process (`main.cjs`) and preload (`preload.cjs`) |
| `scripts/` | Root tooling (e.g. `ensure-electron.cjs`, run from `postinstall` to finish Electron binary download if needed) |

## Setup

### 1. JavaScript (root)

```bash
cd /path/to/EVENT-HUB
npm install
```

On Windows (PowerShell), from the repo root:

```powershell
cd C:\path\to\EVENT-HUB
npm install
```

### 2. Python backend

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:

- **Windows (PowerShell):** `.\.venv\Scripts\Activate.ps1`
- **macOS / Linux:** `source .venv/bin/activate`

Then install dependencies:

```bash
pip install -r requirements.txt
```

## Running the app

Run these from the **repository root** unless noted.

### Desktop (development)

Starts the Vite dev server on **port 8080**, opens Electron at `http://127.0.0.1:8080`, and (when the app is not packaged) spawns **uvicorn** for FastAPI on **port 8000** if `backend/.venv` exists.

```bash
npm run dev
```

### Web UI only (no Electron)

```bash
npm run dev -w frontend
```

Then open the URL Vite prints (e.g. `http://localhost:8080`).

### Backend only (optional)

With the venv activated and working directory `backend/`:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Production-style desktop (static UI)

Builds the frontend for Electron (`vite build --mode electron`), then runs Electron loading `frontend/dist/`:

```bash
npm run build:desktop
npm run start:desktop
```

## API

- **Health:** `GET http://127.0.0.1:8000/health`
- **Interactive docs:** `http://127.0.0.1:8000/docs` (when the server is running)

CORS for local development is configured in `backend/main.py` (localhost / `127.0.0.1` dev origins).

## Frontend scripts (workspace)

From the repo root:

```bash
npm run lint -w frontend
npm run build -w frontend
npm test -w frontend
```

## Distribution note

End-user installers that bundle Python are not covered here; this setup is aimed at **local development** (Node + a `backend/.venv` + Electron).
