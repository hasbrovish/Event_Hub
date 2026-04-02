# Event Hub

Internal event discovery and governance platform: **React** UI (Vite, TypeScript, Tailwind), **FastAPI** API, **PostgreSQL** database. Optional **Electron** desktop shell.

Repository: [github.com/hasbrovish/Event_Hub](https://github.com/hasbrovish/Event_Hub)

**Docs:** **[`planning/FINAL_OPERATIONS_AND_PROMPTS_GUIDE.md`](planning/FINAL_OPERATIONS_AND_PROMPTS_GUIDE.md)** — **start here**: run stack, **Windows/macOS desktop builds**, Copilot prompting, doc map. **[`TECHNICAL_REFERENCE.md`](TECHNICAL_REFERENCE.md)** — architecture summary, **12-phase alignment vs `MASTER_IMPLEMENTATION_PLAN.md`**, and consolidated gaps (enterprise SSO, Zscaler, desktop hardening, testing). **[`planning/MASTER_FINAL_PLAN.md`](planning/MASTER_FINAL_PLAN.md)** — gap closure toward PS **~100%**, integration seams, phased F0–F8. **[`planning/IMPLEMENTED_FEATURES.md`](planning/IMPLEMENTED_FEATURES.md)** — route-by-route and schema reference for what is implemented today.

---

## Prerequisites

- **Node.js** + **npm** (npm 7+ for workspaces)
- **Python 3.10+**
- **PostgreSQL** 14+ (16 recommended) — either:
  - **Docker** (if allowed), or  
  - **Local install** (e.g. Homebrew / Postgres.app on Mac) — see [`planning/LOCAL_POSTGRES_SETUP.md`](planning/LOCAL_POSTGRES_SETUP.md)

---

## Quick start (web + API)

### 1. Clone and JS dependencies

```bash
cd /path/to/Event_Hub
npm install
```

### 2. Database

**Option A — Docker** (from repo root):

```bash
./scripts/docker-up.sh
```

**Option B — Local Postgres on Mac (Homebrew example)**:

```bash
brew install postgresql@16
brew services start postgresql@16
# Add postgresql@16 bin to PATH if needed (brew hints after install)

cd /path/to/Event_Hub
export PGUSER=$(whoami)   # Homebrew often uses your macOS user, not "postgres"
./scripts/setup-db.sh
```

This creates the `eventhub` user/database (if needed) and runs **`alembic upgrade head`**.

### 3. Backend

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp -n .env.example .env
# Edit .env if your Postgres host/port/user differ from defaults

.venv/bin/alembic upgrade head   # safe to re-run
.venv/bin/python -m scripts.seed_demo_events   # optional demo data
.venv/bin/python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Keep this terminal open. Check [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) — you want `"db":"connected"`.

### 4. Frontend

New terminal:

```bash
cd frontend
npm install
cp -n .env.example .env   # optional; default API is http://127.0.0.1:8000
npm run dev
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080). Use **Sign in (dev)** in the header, then browse events.

### One-shot helper (optional)

From repo root (tries Docker if available, then migrate + API + Vite):

```bash
./scripts/run-all.sh
```

If Docker is not allowed, start Postgres yourself first, then run **`./scripts/setup-db.sh`** and start backend/frontend as above.

---

## Repository layout

| Path | Role |
|------|------|
| `frontend/` | Vite + React + TypeScript (npm workspace) |
| `backend/` | FastAPI app; run `uvicorn` from **`backend/`** with `main:app` |
| `backend/app/` | Application package (routers, services, models) |
| `backend/static/swagger-ui/` | Bundled Swagger UI (offline `/docs`) |
| `electron/` | Electron main + preload (optional) |
| `scripts/` | `setup-db.sh`, `docker-up.sh`, `run-backend.sh`, `run-all.sh`, etc. |
| `planning/` | Implementation log, Docker/local DB guides, **implemented features** doc |

---

## Useful URLs (dev)

| URL | Description |
|-----|-------------|
| [http://127.0.0.1:8080](http://127.0.0.1:8080) | Web UI |
| [http://127.0.0.1:8000/](http://127.0.0.1:8000/) | API HTML index (browser) or JSON (curl) |
| [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Swagger UI (no external CDN) |
| [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) | Health + DB status |

---

## Desktop (Electron) development

From repo root (starts Vite on **8080** and may spawn the API if configured in your workflow):

```bash
npm run dev
```

Web UI only (no Electron):

```bash
npm run dev -w frontend
```

Production-style desktop build:

```bash
npm run build:desktop
npm run start:desktop
```

**Windows / macOS installers** (after `npm install` at repo root): `npm run dist:win` or `npm run dist:mac` — outputs under `dist-electron/`. Full steps: [`planning/FINAL_OPERATIONS_AND_PROMPTS_GUIDE.md`](planning/FINAL_OPERATIONS_AND_PROMPTS_GUIDE.md).

---

## Frontend quality scripts

```bash
npm run lint -w frontend
npm run build -w frontend
npm test -w frontend
```

---

## Documentation index

| Document | Contents |
|----------|----------|
| [`planning/FINAL_OPERATIONS_AND_PROMPTS_GUIDE.md`](planning/FINAL_OPERATIONS_AND_PROMPTS_GUIDE.md) | **Operations hub**: Windows desktop build, run order, Copilot, doc map |
| [`TECHNICAL_REFERENCE.md`](TECHNICAL_REFERENCE.md) | **Master plan gap analysis**, architecture, backlog themes, file map |
| [`planning/PS_AND_APIS_CROSSWALK.md`](planning/PS_AND_APIS_CROSSWALK.md) | **PS.md × `apis.json`**: five LEX/InfyMe surfaces, personas, workflows, gaps |
| [`planning/MASTER_FINAL_PLAN.md`](planning/MASTER_FINAL_PLAN.md) | **PS ~100% roadmap**, Copilot integration index, F0–F8 phases |
| [`planning/COPILOT_MASTER_PROMPTS.md`](planning/COPILOT_MASTER_PROMPTS.md) | **Copy-paste prompts** for Copilot on corporate laptops (F1–F8 + verification) |
| [`MASTER_IMPLEMENTATION_PLAN.md`](MASTER_IMPLEMENTATION_PLAN.md) | Full phased blueprint (workflows, API catalog, testing, Zscaler, packaging) |
| [`planning/IMPLEMENTED_FEATURES.md`](planning/IMPLEMENTED_FEATURES.md) | **Implemented** API routes, models, UI, deferred §6 |
| [`planning/DESKTOP_APP_AND_INFOSYS_REMOTE_RUNBOOK.md`](planning/DESKTOP_APP_AND_INFOSYS_REMOTE_RUNBOOK.md) | Continuous desktop app, Infosys integration steps, remote deploy |
| [`planning/IMPLEMENTATION_LOG.md`](planning/IMPLEMENTATION_LOG.md) | Decisions, changelog, reviewer checklist |
| [`planning/SYNTHESIS_AND_GAPS.md`](planning/SYNTHESIS_AND_GAPS.md) | Short plan-vs-code synthesis |
| [`planning/LOCAL_POSTGRES_SETUP.md`](planning/LOCAL_POSTGRES_SETUP.md) | Postgres without Docker |
| [`planning/DOCKER_SETUP.md`](planning/DOCKER_SETUP.md) | Docker Postgres + persistence |
| [`CONTEXT.md`](CONTEXT.md) | Product context, routes, mock vs real |

---

## Security note (dev)

`ALLOW_DEV_LOGIN` and a default `JWT_SECRET` are for **local development only**. Use strong secrets and disable dev login in any shared or production deployment.
