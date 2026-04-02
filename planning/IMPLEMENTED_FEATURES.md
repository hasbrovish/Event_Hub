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

### 2.3 Database models

Physical schema is defined by **SQLAlchemy models** under `backend/app/models/` and applied by Alembic revision `20250402_0001_initial_schema` (`metadata.create_all`). A **full table-by-table design** is in **[§ 7](#7-database-schema-design-postgresql)** below. Product-level ER notes: `reference_docs/db_design.md`.

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

## 7. Database schema design (PostgreSQL)

### 7.1 Principles

- **PK types:** `employees.wid` and all employee FKs use **UUID**. `events.id` is **UUID** with default `gen_random_uuid()` (requires PostgreSQL crypto/pgcrypto availability as per server defaults).
- **Strings for enums:** Status and role-like fields are **varchar** in DB (e.g. `events.status`, `registrations.status`, `approval_requests.status`); application code enforces allowed values.
- **Timestamps:** Important columns use `TIMESTAMPTZ` (`DateTime(timezone=True)`).
- **Arrays:** PostgreSQL `ARRAY` for tags, preferences, campaign channel lists, etc.

### 7.2 Entity relationships (overview)

```mermaid
erDiagram
  employees ||--o{ employee_roles : has
  employees ||--o| preferences : has
  employees ||--o{ registrations : registers
  employees ||--o{ group_admins : admin_of
  groups ||--o{ group_admins : has
  groups ||--o{ events : scopes_optional
  employees ||--o{ events : creates
  employees ||--o{ events : approves_optional
  events ||--o{ sessions : contains
  events ||--o{ approval_requests : governed_by
  events ||--o{ registrations : receives
  events ||--o{ notifications : optional_link
  events ||--o{ campaigns : optional_link
  employees ||--o{ notifications : receives
  employees ||--o{ campaigns : creates
```

### 7.3 Tables (columns & constraints)

**`employees`** — person; PK `wid` UUID. Columns: `source_id` (unique, nullable), `first_name`, `last_name`, `email` (unique), org fields (`job_title`, `job_role`, `department_name`, `unit_name`, `sub_department_name`, `region`, `current_location`, `base_location`), `is_manager`, `manager_wid` → `employees.wid` ON DELETE SET NULL, `is_active`, `created_at`, `updated_at`.  
**API:** auth / event ownership / registrations / approvals.

**`employee_roles`** — PK `id` serial. `employee_wid` → `employees.wid` ON DELETE CASCADE, `role` varchar(50). **Unique** `(employee_wid, role)`.  
**API:** JWT claims / `require_roles`.

**`preferences`** — PK `id` serial. `employee_wid` → `employees.wid` ON DELETE CASCADE **unique**. Arrays: `event_types`, `interests`, `notification_mechanisms`, `notification_times`, `followed_group_ids`; `notification_frequency`, `notify_on_login`, `updated_at`.  
**API:** row created on dev login; **no read/write API yet**.

**`groups`** — PK `id` serial. `name`, `description`, `org` (default Infosys), `geo`, `unit`, `subunit`, `location`, `dl_emails` array, `is_active`, `created_by` → `employees.wid`, `created_at`.  
**API:** optional `events.group_id`; **no group CRUD API yet**.

**`group_admins`** — composite PK `(group_id, employee_wid)` → `groups.id` / `employees.wid` ON DELETE CASCADE, `assigned_at`.  
**API:** **not used by routes yet**.

**`events`** — PK `id` UUID default `gen_random_uuid()`. `title`, `description`, `thumbnail_url`, `banner_url`, `event_type`, `tags` array, `delivery_method`, `instruction_medium`, `start_date`, `end_date`, `timezone`, `venue_code`, `venue_name`, `event_url`, `slots` (capacity), `status`, `visibility`, `group_id` → `groups.id` nullable, `created_by` / `approved_by` → `employees.wid`, `approved_at`, `created_at`, `updated_at`.  
**API:** full event lifecycle + list filters.

**`sessions`** (table name `sessions`) — PK `id` serial. `event_id` → `events.id` ON DELETE CASCADE, `session_order`, `topic`, `topic_brief`, `start_datetime`, `duration_minutes`, `speaker_wid` → `employees.wid`, denormalized `speaker_*` fields, `speaker_linkedin`, `speaker_headshot_url`, `session_url`, `created_at`.  
**API:** embedded in event detail / create.

**`registrations`** — PK `id` serial. `employee_wid` → `employees.wid` ON DELETE CASCADE, `event_id` → `events.id` ON DELETE CASCADE, `status` (e.g. registered / waitlisted / cancelled), `added_to_calendar`, `registered_at`. **Unique** `(employee_wid, event_id)`.  
**API:** register / cancel / my registrations.

**`approval_requests`** — PK `id` serial. `event_id` → `events.id` ON DELETE CASCADE, `requested_by` / `reviewed_by` → `employees.wid`, `status`, `request_note`, `review_comment`, `requested_at`, `reviewed_at`.  
**API:** submit + pending list + PATCH review.

**`notifications`** — PK `id` serial. `employee_wid` → `employees.wid` ON DELETE CASCADE, optional `event_id` → `events.id`, `type`, `title`, `body`, `is_read`, `created_at`.  
**API:** **not implemented** (table ready).

**`campaigns`** — PK `id` serial. `event_id` → `events.id` ON DELETE CASCADE, `created_by` → `employees.wid`, `message`, `teams_channel_ids` / `viva_group_ids` arrays, `infyme_banner`, `scheduled_at`, `status`, `posted_at`, `failure_reason`, `created_at`.  
**API:** **not implemented** (table ready).

### 7.4 Migration

- **Revision:** `backend/alembic/versions/20250402_0001_initial_schema.py` — `upgrade()` calls `Base.metadata.create_all(bind)` for all models imported on `Base.metadata`.

---

## 8. Key file map

| Area | Paths |
|------|--------|
| API entry | `backend/main.py` → `app.main:app` |
| Routers | `backend/app/routers/*.py` |
| Services | `backend/app/services/*.py` |
| Models | `backend/app/models/*.py` |
| Migrations | `backend/alembic/versions/` |
| UI entry | `frontend/src/App.tsx`, `frontend/src/components/AppLayout.tsx` |
| API client | `frontend/src/lib/api.ts` |
