# Event Hub — implemented features (technical reference)

This document describes **what is built and wired today** in code. It complements `CONTEXT.md`, `MASTER_IMPLEMENTATION_PLAN.md`, and `planning/IMPLEMENTATION_LOG.md` (decisions + changelog).

**Last aligned with branch work:** `db-changes` (PostgreSQL, JWT dev auth, events, registrations, approvals, Infy-style UI).

---

## 1. Stack

| Layer | Technology |
|-------|------------|
| API | Python 3.10+, FastAPI, Pydantic v2, Uvicorn |
| ORM / DB | SQLAlchemy 2 async, Alembic, PostgreSQL 14+ (16 recommended) |
| Auth (dev) | JWT (`python-jose`), `POST /auth/login` with configurable roles |
| UI | React 18, TypeScript, Vite 5, Tailwind, TanStack Query, React Router |
| Optional shell | Electron workspace (see root `package.json`) |

API JSON uses **snake_case**. The frontend maps to UI types in `frontend/src/lib/eventMap.ts` and `frontend/src/types/api.ts`.

---

## 2. Backend — implemented capabilities

### 2.1 HTTP routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Browser: HTML index with links. API clients (`Accept` not `text/html` first): JSON metadata. |
| GET | `/health` | Liveness + DB probe (`db`: `connected` \| `unreachable`). |
| GET | `/docs` | Swagger UI (**bundled** under `backend/static/swagger-ui/`, no CDN). |
| GET | `/openapi.json` | OpenAPI 3 schema. |
| POST | `/auth/login` | Dev login: upsert employee, issue JWT (`DevLoginRequest`). |
| POST | `/auth/login/sso` | Stub — **501 Not Implemented**. |
| GET | `/auth/me` | Current user from Bearer token. |
| GET | `/events` | Paginated list; query `category`, `status` (UI filter), `page`, `page_size`. |
| GET | `/events/{event_id}` | Detail + sessions + `my_registration_status` when authenticated. |
| POST | `/events` | Create event + sessions (roles: `speaker`, `organizer`, `admin`, `platform_admin`). |
| PATCH | `/events/{event_id}` | Update (owner or privileged roles). |
| DELETE | `/events/{event_id}` | Delete **draft** only. |
| POST | `/events/{event_id}/submit` | Draft → Pending Approval + `approval_requests` row. |
| POST | `/events/{event_id}/register` | Register or waitlist; handles re-register from `cancelled`. |
| DELETE | `/events/{event_id}/register` | Cancel registration; promotes oldest waitlist when a seated seat frees. |
| GET | `/registrations/me` | Current user’s `registered` / `waitlisted` rows as event list items. |
| GET | `/approvals/pending` | Inbox for `organizer`, `admin`, `platform_admin`. |
| PATCH | `/approvals/{approval_id}` | `decision`: `approve` \| `reject` \| `request_modification`; optional `review_comment`. |

### 2.2 Domain logic (high level)

- **Events:** CRUD subset, list filters with explicit slug → `event_type` mapping (avoids ambiguous “Others” vs “Technology” slug collision).
- **Approvals:** Approve → event `Active`; reject → `Rejected`; request modification → event `Draft`, approval `Modification Requested`. Re-submit reuses the same approval row when status was modification requested.
- **Registrations:** Capacity vs `slots`; overflow → `waitlisted`; cancel from `registered` may promote waitlist.
- **Auth:** `Employee` + `EmployeeRole`; stable WID from dev email (`uuid5`); default `Preference` row on first dev login.

### 2.3 Database models (tables created by Alembic initial migration)

Core tables used by the API: `employees`, `employee_roles`, `preferences`, `events`, `sessions`, `registrations`, `approval_requests`, plus `groups`, `group_admins`, `notifications`, `campaigns` (schema present; most APIs not built yet). See `reference_docs/db_design.md`.

---

## 3. Frontend — implemented capabilities

### 3.1 Routes (web)

| Path | Behavior |
|------|----------|
| `/` | Dashboard: live `GET /events`, category filter, grid/list. |
| `/event/:id` | Event detail, sessions, register / cancel / leave waitlist (API). |
| `/calendar` | Month navigation; registrations from `GET /registrations/me`. |
| `/create-event` | Multi-session create + optional submit. |
| `/approvals` | Pending approvals queue (`GET` / `PATCH`); organizer + admin nav. |
| `/preferences`, `/notifications`, `/manage-events`, `/campaigns`, `/admin/*` | Mostly **mock / placeholder** UI (not fully API-backed). |

### 3.2 Auth & layout

- **`AuthContext`:** JWT in `localStorage`, `GET /auth/me`, dev sign-in button, role switcher (UI-only; server enforces roles).
- **`BackendStatusPill`:** API/DB status from `GET /health` (visible from `sm` breakpoint + dot on xs).
- **Sidebar:** Persona menus (audience, speaker, organizer, admin); `platform_admin` maps to admin persona in UI.

### 3.3 Data hooks

- `useEvents`, `useEventDetail`, `useRegistrations`, `useApprovals`, `useBackendHealth`.

---

## 4. Tooling & operations

| Script / doc | Role |
|--------------|------|
| `scripts/setup-db.sh` | Local Postgres: run `init_local_db.sql` + `alembic upgrade` (set `PGUSER` on Mac Homebrew). |
| `scripts/init_local_db.sql` | Create `eventhub` role/DB. |
| `scripts/docker-up.sh` | Start Docker Compose Postgres only (when Docker allowed). |
| `scripts/run-backend.sh` | Docker (if any) + venv + migrate + uvicorn. |
| `scripts/run-all.sh` | Same + attempt frontend `npm run dev`. |
| `scripts/fetch-swagger-ui.sh` | Refresh vendored Swagger assets. |
| `planning/LOCAL_POSTGRES_SETUP.md` | No-Docker Postgres on Mac/Windows/Linux. |
| `planning/DOCKER_SETUP.md` | Docker volume persistence and portability. |

### 4.1 Configuration

- **`backend/.env`:** `DATABASE_URL` (asyncpg), `SYNC_DATABASE_URL` (psycopg2 for Alembic), `JWT_SECRET`, `ALLOW_DEV_LOGIN`.
- **`frontend/.env`:** `VITE_API_BASE` (default `http://127.0.0.1:8000`).
- **CORS:** `127.0.0.1:8080`, `localhost:8080`, `::1`, `null` (Electron file).

---

## 5. Seed data

- **`python -m scripts.seed_demo_events`** (from `backend/` with venv): demo employee `demo.seed@example.com` and two **Active** events if the events table is empty (or per script logic).

---

## 6. Not implemented (short list)

For detail see `planning/IMPLEMENTATION_LOG.md` § backlog:

- Refresh tokens, Infosys SSO exchange, Infosys API proxies.
- Notifications API, preferences API, campaigns, admin APIs.
- Full RBAC test suite, Playwright E2E against API.
- Manage Events / Notifications / Preferences pages as full API replacements.

---

## 7. Key file map

| Area | Paths |
|------|--------|
| API entry | `backend/main.py` → `app.main:app` |
| Routers | `backend/app/routers/*.py` |
| Services | `backend/app/services/*.py` |
| Models | `backend/app/models/*.py` |
| Migrations | `backend/alembic/versions/` |
| UI entry | `frontend/src/App.tsx`, `frontend/src/components/AppLayout.tsx` |
| API client | `frontend/src/lib/api.ts` |
