# Event Hub — final operations, prompting, and Windows desktop guide

**Start here** when you want to **run the stack**, **build a Windows desktop app**, **use Copilot effectively**, or **prioritize improvements**. This file **does not replace** detailed specs; it **points** to them and gives **ordered checklists**.

---

## 1. Document map (what to read when)

| Goal | Read first | Then |
|------|------------|------|
| **Run web + API locally** | [`README.md`](../README.md) | [`planning/DOCKER_SETUP.md`](DOCKER_SETUP.md) or [`planning/LOCAL_POSTGRES_SETUP.md`](LOCAL_POSTGRES_SETUP.md) |
| **Run Electron (dev or packaged)** | **§3–4 below** | [`planning/DESKTOP_APP_AND_INFOSYS_REMOTE_RUNBOOK.md`](DESKTOP_APP_AND_INFOSYS_REMOTE_RUNBOOK.md) |
| **Corporate / Infosys / remote API** | [`planning/DESKTOP_APP_AND_INFOSYS_REMOTE_RUNBOOK.md`](DESKTOP_APP_AND_INFOSYS_REMOTE_RUNBOOK.md) | [`CONTEXT.md`](../CONTEXT.md), [`TECHNICAL_REFERENCE.md`](../TECHNICAL_REFERENCE.md) |
| **What is implemented vs stub** | [`planning/IMPLEMENTED_FEATURES.md`](IMPLEMENTED_FEATURES.md) | [`planning/SYNTHESIS_AND_GAPS.md`](SYNTHESIS_AND_GAPS.md) |
| **Close gaps to problem statement (PS)** | [`planning/MASTER_FINAL_PLAN.md`](MASTER_FINAL_PLAN.md) | [`planning/PS_AND_APIS_CROSSWALK.md`](PS_AND_APIS_CROSSWALK.md) |
| **Copilot / AI prompts** | **§5 below** | [`planning/COPILOT_MASTER_PROMPTS.md`](COPILOT_MASTER_PROMPTS.md) |
| **Full historical blueprint** | [`MASTER_IMPLEMENTATION_PLAN.md`](../MASTER_IMPLEMENTATION_PLAN.md) | (reference only if you need depth) |

---

## 2. Improve the app (recommended order)

1. **Truth check** — [`planning/IMPLEMENTED_FEATURES.md`](IMPLEMENTED_FEATURES.md) (routes, UI, deferred §6).  
2. **Product + integration gaps** — [`planning/MASTER_FINAL_PLAN.md`](MASTER_FINAL_PLAN.md) phases **F0–F8** (SSO, LEX master data, campaigns, desktop hardening).  
3. **PS vs APIs** — [`planning/PS_AND_APIS_CROSSWALK.md`](PS_AND_APIS_CROSSWALK.md) (five `apis.json` surfaces + personas).  
4. **Architecture / security themes** — [`TECHNICAL_REFERENCE.md`](../TECHNICAL_REFERENCE.md).  
5. **Implementation history** — [`planning/IMPLEMENTATION_LOG.md`](IMPLEMENTATION_LOG.md).

Use **§5** (Copilot) for day-to-day coding; keep **MASTER_FINAL_PLAN** open for phase boundaries.

---

## 3. Windows machine — run web + API + Electron (development)

### 3.1 Install prerequisites

| Tool | Notes |
|------|--------|
| **Git** | Clone the repo. |
| **Node.js 18+** (LTS) | Includes `npm`. Verify: `node -v`, `npm -v`. |
| **Python 3.10+** | Verify: `py -3 --version` or `python --version`. Use **64-bit**. |
| **PostgreSQL 14+** | Native Windows install *or* **Docker Desktop** (if allowed). Default port **5432**. |

Optional: **Visual Studio Build Tools** — only if some native npm module fails to compile (uncommon for this repo).

### 3.2 Database on Windows

**Option A — Docker Desktop**  
Follow [`planning/DOCKER_SETUP.md`](DOCKER_SETUP.md) from repo root (PowerShell or cmd with Docker in PATH).

**Option B — Native PostgreSQL**  
Install from [postgresql.org](https://www.postgresql.org/download/windows/). Add `bin` (e.g. `C:\Program Files\PostgreSQL\16\bin`) to **PATH** so `psql` works.

The repo script [`scripts/setup-db.sh`](../scripts/setup-db.sh) is **bash**. On Windows use one of:

- **Git Bash**: `export PGUSER=postgres` (or your superuser), then `./scripts/setup-db.sh`  
- **WSL**: clone inside WSL and run the same script  
- **Manual**: open `scripts/init_local_db.sql` in pgAdmin or run with `psql -U postgres -f scripts/init_local_db.sql`

Then from `backend\`:

```text
py -3 -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
REM Edit .env: DATABASE_URL for your Windows Postgres user/password
.venv\Scripts\alembic upgrade head
.venv\Scripts\python -m scripts.seed_demo_events
.venv\Scripts\python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Keep this terminal open. Check [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health).

### 3.3 Frontend (web)

New terminal, repo root:

```text
cd path\to\Event_Hub
npm install
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080).

### 3.4 Electron in dev (hot reload + tray)

From **repo root** (with API on **8000** and Vite on **8080**):

```text
npm install
npm run dev
```

This starts the frontend dev server and Electron with `ELECTRON_USE_DEV_SERVER=1`.

**If Electron fails immediately** with errors about `app.whenReady`, check that the environment variable **`ELECTRON_RUN_AS_NODE` is not set** to `1` (some IDEs or global envs set it). On PowerShell: `Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue` for the current session.

**Backend auto-spawn:** `electron/main.cjs` can spawn uvicorn **only if** `backend\.venv\Scripts\python.exe` exists. Prefer running **uvicorn manually** (§3.2) so ports and logs are predictable.

---

## 4. Windows machine — build a distributable desktop app

The packaged app embeds the **built static UI** (`frontend/dist`). It does **not** bundle Python; users still need a **reachable API** (your `VITE_API_URL` / app config story — see runbook Part A).

### 4.1 One-time build steps

**Prefer running `npm run dist:win` on a Windows PC** so NSIS/portable targets build without extra tools. (On macOS/Linux, Windows targets may require Wine or a CI runner.)

From **repo root** in PowerShell or cmd:

```text
cd path\to\Event_Hub
npm install
```

Ensure backend DB is optional for **UI-only build**; for a smoke test, point `frontend/.env` at your API.

```text
cd frontend
npm install
cd ..
npm run build:desktop
npm run dist:win
```

Artifacts appear under **`dist-electron/`**:

- **Portable:** `Event Hub *.exe` (no installer; good for quick testing).  
- **NSIS:** installer `.exe` (lets user pick folder; useful for pilots).

**Code signing:** Unsigned builds may trigger **Windows SmartScreen**. For production, your org supplies a certificate; configure `win.certificateFile` / `certificatePassword` in `electron-builder` (see [electron-builder code signing](https://www.electron.build/code-signing)).

### 4.2 Run the packaged app

- Double-click the **portable** exe or finish **NSIS** install and launch **Event Hub**.  
- Ensure the **API URL** baked into the build matches your deployment (see `frontend` `.env` / Vite `VITE_*` for **electron** mode before `npm run build:desktop`).  
- If the window is blank, confirm `loadFile` path: built assets must be under `frontend/dist` at pack time (see root `package.json` `build.files`).

### 4.3 macOS

On a Mac, use `npm run dist:mac` (same `dist-electron/` output pattern). **You cannot build a signed/notarized Mac `.app` from Windows** with standard tooling; use a Mac or CI.

---

## 5. Prompting (Copilot / Cursor / ChatGPT) — keep outputs aligned

### 5.1 Golden rule

Paste **repository-local context** from [`planning/COPILOT_MASTER_PROMPTS.md`](COPILOT_MASTER_PROMPTS.md): **§1 Pinned context** at the start of a session, and **§2 Security** when touching auth, TLS, or PII. Do **not** paste real secrets or employee data.

### 5.2 File order for integration work

Use **§3 Mandatory file read order** in `COPILOT_MASTER_PROMPTS.md` (corporate_stubs, campaign_delivery, auth router, `corporateIntegrationPoints.ts`, `electron/main.cjs`, MASTER_FINAL_PLAN).

### 5.3 Phase prompts

Use **§4** in `COPILOT_MASTER_PROMPTS.md` (**F1–F8**) for scoped tasks; verify with **§5** commands after edits.

### 5.4 Optional: workspace instructions

If policy allows, mirror the pinned context into **`.github/copilot-instructions.md`** or **Cursor rules** so every agent session inherits the same constraints.

---

## 6. Quick reference — ports and scripts

| Port | Service |
|------|---------|
| 8000 | FastAPI (uvicorn) |
| 8080 | Vite dev server |

| Command (repo root) | Purpose |
|---------------------|---------|
| `npm run dev` | Vite + Electron dev |
| `npm run dev -w frontend` | Web only |
| `npm run build:desktop` | Production UI build for Electron (`frontend/dist`) |
| `npm run start:desktop` | Electron loading `frontend/dist` (no Vite) |
| `npm run dist:win` | **Windows** portable + NSIS under `dist-electron/` |
| `npm run dist:mac` | **macOS** dmg/zip (on macOS) |

---

## 7. Related docs (synced index)

| Document | Role |
|----------|------|
| [`README.md`](../README.md) | Default quick start; doc index |
| [`planning/DESKTOP_APP_AND_INFOSYS_REMOTE_RUNBOOK.md`](DESKTOP_APP_AND_INFOSYS_REMOTE_RUNBOOK.md) | Tray, TLS, SSO, remote deploy |
| [`planning/COPILOT_MASTER_PROMPTS.md`](COPILOT_MASTER_PROMPTS.md) | Pasteable prompts |
| [`planning/IMPLEMENTED_FEATURES.md`](IMPLEMENTED_FEATURES.md) | Current feature truth |
| [`planning/MASTER_FINAL_PLAN.md`](MASTER_FINAL_PLAN.md) | F0–F8 roadmap |

---

*This guide is the **single entry** for operations + prompting + Windows desktop builds. Update it when scripts or `build` targets change.*
