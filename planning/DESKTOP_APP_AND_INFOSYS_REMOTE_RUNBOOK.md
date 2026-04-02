# Desktop app (continuous) + Infosys integrations + remote machine runbook

This document is **separate** from `CONTEXT.md` and `IMPLEMENTED_FEATURES.md`. It describes **what to build and operate** for:

1. A **continuous-running desktop shell** (Electron-style “always on” hub).
2. **Infosys-specific** enterprise integration steps (auth, APIs, TLS, campaigns).
3. **Running the stack on a remote machine** (server, VM, or hybrid with laptops).

Use it as a checklist for architecture discussions, security review, and environment setup—not as guaranteed production runbooks until your Infosys security and platform teams sign off.

---

## Part A — Continuous-running desktop app

### A.1 What “continuous” usually means

| Capability | Purpose |
|------------|---------|
| **Starts with OS login** | User gets notifications without manually opening a browser tab. |
| **Runs in background** | Window can close while process stays alive (tray icon). |
| **Single instance** | Avoid duplicate windows and conflicting local state. |
| **Reconnects to API** | Polls or streams notifications when network returns (VPN on/off). |
| **Sane updates** | Packaged builds + optional auto-update channel (e.g. `electron-updater`). |

**In this repo today:** Electron has a **tray** and **close-to-tray** behavior (`electron/main.cjs`). **Not yet:** native OS notifications from the main process, idle detection, backend health watchdog + auto-restart, or auto-update hardening (see `planning/IMPLEMENTED_FEATURES.md` §6.5).

### A.2 Recommended implementation phases (desktop)

1. **Configuration**
   - **API base URL** from env or config file (e.g. `EVENT_HUB_API_URL`), not hard-coded `localhost`, so the same build talks to a **remote** API.
   - For Electron + Vite, align with `VITE_*` variables and document them for packagers.

2. **Background lifecycle**
   - Confirm **single instance** (`app.requestSingleInstanceLock()`).
   - **Minimize / close → tray** (already directionally present); document “Quit” vs “Hide”.
   - Optional: **Windows** startup shortcut / **macOS** Login Items (installer or MDM policy).

3. **Notification path**
   - **Short term:** poll `GET /notifications` + `GET /notifications/unread-count` on an interval (respect battery / user prefs).
   - **Better UX:** **native notifications** (`Notification` in main process or `electron-windows-notifications` / macOS `node-notifier`) with click-to-open deep link (`eventhub://event/<id>` or hash route).
   - **Enterprise:** some orgs block arbitrary notification APIs; validate with desktop platform team.

4. **Resilience**
   - Poll **`GET /health`**; if API is down, show tray state + backoff (avoid tight loops).
   - Optional: if API is **bundled** as a child process on the same machine, watch PID and restart (not applicable when API is remote-only).

5. **Packaging**
   - **electron-builder** (or equivalent): targets **Windows x64** (primary for many Infosys desks) and optionally macOS.
   - **Code signing** (Windows Authenticode, Apple notarization) per org policy.
   - **Channels:** “dev”, “pilot”, “prod” update manifests if using `electron-updater`.

6. **Security**
   - **Preload** only exposes narrow IPC; no `nodeIntegration` in renderer.
   - **TLS:** trust store must include **corporate roots** (see Part B — Zscaler).
   - **Token storage:** OS keychain / DPAPI-backed secret store instead of plain localStorage where policy requires it.

### A.3 Commands relevant to this repo (reference)

From repo root (see `README.md`):

- **Dev (Electron + Vite):** `npm run dev`
- **Web only:** `npm run dev -w frontend`
- **Production-style desktop build:** `npm run build:desktop` then `npm run start:desktop`

Adjust scripts if your remote API URL must be baked at build time vs runtime.

---

## Part B — Infosys-specific integration steps

These align with product intent in `CONTEXT.md` (“External APIs (Infosys Internal)”) and gaps noted in `planning/SYNTHESIS_AND_GAPS.md`. Treat URLs and paths as **examples** until your integration catalog is confirmed.

### B.1 Network and TLS (do this first on any remote machine)

| Step | Action |
|------|--------|
| 1 | Confirm whether traffic goes through **Zscaler** (or similar TLS inspection). |
| 2 | Obtain the **corporate root CA** bundle approved for server-side Python (`httpx` / `requests`) and document path (e.g. `ZSCALER_CA_PATH` or OS trust store sync). |
| 3 | For **Electron/Chromium**, ensure the **OS trust store** includes the same roots (users often hit TLS errors in packaged apps before curl works). |
| 4 | If the API runs **on a remote server**, open firewall paths from **user devices → API** (HTTPS) and from **API → Infosys gateways** (often only from specific datacenter egress IPs). |

### B.2 Authentication / zero manual registration

| Step | Action |
|------|--------|
| 1 | Choose pattern: **SP-initiated SSO**, **reverse proxy + session cookie**, or **token exchange** with Infosys identity platform (name varies by program). |
| 2 | Implement **`POST /auth/login/sso`** (currently stub **501**): validate incoming assertion or service token, map to `Employee`, issue **JWT** (+ refresh) consistent with existing middleware. |
| 3 | **Provision employee profile:** call **`GET .../me/users/view`** (or successor API) once per login or on schedule; upsert `employees` + roles per governance rules. |
| 4 | **Disable dev login** (`ALLOW_DEV_LOGIN`) in any shared or production environment; rotate **`JWT_SECRET`**. |

### B.3 Master data (units, sub-units, org hierarchy)

| Step | Action |
|------|--------|
| 1 | Replace static **`GET /master-data/*`** with HTTP clients to LEX (or current gateway) endpoints such as **get unit** / **get sub_unit** (see `CONTEXT.md` table). |
| 2 | Add **caching** (e.g. 1-hour TTL) and structured errors when LEX is unavailable. |
| 3 | Ensure outbound calls use **service identity** or **on-behalf-of** pattern per Infosys API gateway rules—not end-user cookies on the server unless explicitly supported. |

### B.4 Extended employee / org attributes (optional)

| Step | Action |
|------|--------|
| 1 | Integrate **`GetEmployeeOfficialInfoNew`** (or current equivalent on InfyMe / HR APIs) if the product needs fields beyond `/me/users/view`. |
| 2 | Map fields into `employees` columns and **PIA** / retention policy (minimize storage). |

### B.5 Campaigns and Microsoft 365 (Teams, Viva, Outlook)

| Step | Action |
|------|--------|
| 1 | Register an **Azure AD app** (or use an existing corporate app) with admin consent for required Graph scopes (channels, chat, calendar—exact scopes depend on design). |
| 2 | Replace **`/integrations/*` mocks** with Graph or approved internal proxies; store tokens or use **managed identity** on the API tier if hosted in Azure. |
| 3 | Implement real **send-now** and **scheduled** posting with idempotency and failure rows (`campaigns.failure_reason` already exists). |
| 4 | For **Outlook**, decide: **.ics only** (already present) vs **Graph calendar** create/update. |

### B.6 Operational checklist (Infosys program office)

- [ ] Integration contact for **API gateway** (LEX / InfosysApps) and **rate limits**.  
- [ ] **Non-prod** vs **prod** base URLs and credentials rotation.  
- [ ] **SIEM** / audit: who can read `audit_logs` and notification content.  
- [ ] **MDM** distribution path for Electron installers (Intune, SCCM, etc.).

---

## Part C — Running everything on a remote machine

“Remote machine” can mean: **(1) cloud VM hosting API+DB**, **(2) jump-server style dev box**, or **(3) full RDP session where you also run Electron**. Pick a model and keep boundaries clear.

### C.1 Recommended deployment model (typical)

| Tier | Where it runs | Notes |
|------|----------------|-------|
| **PostgreSQL** | Remote VM or managed DB | Private network; TLS to API if required. |
| **FastAPI (Uvicorn)** | Remote VM or container platform | Behind **reverse proxy** (nginx, Traefik, App Gateway); **HTTPS** public or VPN-only. |
| **React** | Static files on CDN or same origin as API | Or served by reverse proxy as `/`. |
| **Electron** | **User laptop** | Points to `https://<your-api>/` via config—not usually on the server unless you RDP for testing. |

This gives you **one stable API URL** for all desktops while the database never exposes publicly.

### C.2 Remote server setup (high level)

1. **Provision OS** (Linux or Windows Server) in the approved subscription / VPC.  
2. **Install PostgreSQL** (or use RDS/Azure Database) and run migrations: `alembic upgrade head` from `backend/` with correct `DATABASE_URL`.  
3. **Configure environment** (see `docker-compose.env.example`, `backend` `.env`):  
   - `DATABASE_URL`, `JWT_SECRET`, feature flags, **`ALLOW_DEV_LOGIN=false`**.  
   - Infosys client secrets via **Key Vault** / **Secrets Manager**, not plain files on disk.  
4. **Run API** under **systemd**, **supervisor**, or **Kubernetes**; bind to localhost and let the reverse proxy terminate TLS.  
5. **Reverse proxy:** TLS cert (corp PKI or public CA), HTTP/2, gzip, WebSocket if you add them later, **`proxy_set_header`** for real client IP.  
6. **CORS:** update FastAPI `CORSMiddleware` allowlist from localhost-only to your **real UI origins** (and Electron custom protocol if used).  
7. **Health monitoring:** scrape **`GET /health`**; alert on `db: unreachable`.  
8. **Backups:** PostgreSQL PITR or nightly dumps; test restore.

### C.3 Remote machine as **your** dev/test workstation (RDP/SSH)

1. Clone repo on the remote VM; install **Node**, **Python venv**, **Postgres client**.  
2. Run **Docker Compose** only for Postgres if allowed (`planning/DOCKER_SETUP.md`), or point to a shared dev database.  
3. Run backend: `uvicorn` on `0.0.0.0:8000` **only if** the security group is locked to your IP or VPN; otherwise keep **SSH tunnel**:
   - `ssh -L 8000:127.0.0.1:8000 user@remote`  
4. Run frontend with `VITE_*` API URL pointing through tunnel or internal DNS.  
5. **Electron on the VM:** only useful inside **interactive RDP**; for real users, build the desktop app on a CI agent and install on physical machines.

### C.4 Firewall / connectivity matrix (fill in for your tenant)

| From | To | Port | Purpose |
|------|----|------|---------|
| User browser / Electron | API load balancer | 443 | UI + REST |
| API VM | PostgreSQL | 5432 (or 6432 pooler) | DB |
| API VM | Infosys LEX / Graph | 443 | Integrations |
| CI/CD | Container registry | 443 | Deploy |

### C.5 What **not** to do on a shared remote host

- Do not expose **PostgreSQL** to the public internet.  
- Do not commit **`.env`** with secrets (repo `.gitignore` already excludes common cases).  
- Do not rely on **dev JWT login** for pilot users if SSO is the target—parity matters for governance sign-off.

---

## Part D — Suggested order of execution (single checklist)

Use this as a **program-level** sequence:

1. **Remote API + DB** reachable over HTTPS from a test client (curl/browser).  
2. **Corporate TLS** fixed for both Python outbound calls and Electron.  
3. **SSO** implemented on `/auth/login/sso` + employee upsert from Infosys directory API.  
4. **Master-data** proxies live; groups/events use real org keys.  
5. **Desktop**: configurable API URL, tray + polling notifications, then native notifications.  
6. **Campaigns** real channels behind approved Graph/app permissions.  
7. **Hardening**: signing, auto-update, RBAC tests, monitoring, backup/restore drill.

---

## Related docs in this repo

| Document | Use for |
|----------|---------|
| `README.md` | Local dev, Electron scripts, ports |
| `CONTEXT.md` | Product scope, Infosys API table (illustrative URLs) |
| `planning/IMPLEMENTED_FEATURES.md` | What is implemented vs stubbed today |
| `planning/DOCKER_SETUP.md` | Postgres via Docker |
| `planning/LOCAL_POSTGRES_SETUP.md` | Postgres without Docker |
| `MASTER_IMPLEMENTATION_PLAN.md` | Phased delivery detail (including TLS/SSO notes) |

---

*Last updated: aligned with Event Hub repo layout and planning docs; adjust URLs and service names with your Infosys integration team.*
