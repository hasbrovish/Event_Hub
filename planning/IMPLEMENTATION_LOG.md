# Implementation log — Event Hub

Single place for **what shipped**, **architectural decisions**, and **follow-ups** for code review.  
Aligned with `CONTEXT.md`, `MASTER_IMPLEMENTATION_PLAN.md`, `reference_docs/db_design.md`, and `planning/SYNTHESIS_AND_GAPS.md`.

---

## 1. Decisions (locked for this iteration)

| Topic | Decision | Rationale |
| --- | --- | --- |
| **Database** | **PostgreSQL** only | Governance (FKs, CHECKs, approvals) per synthesis + master plan; one Alembic path. |
| **ORM / API** | SQLAlchemy 2 async + Pydantic v2 | Standard FastAPI stack; models mirror `db_design.md` DDL. |
| **Auth (now)** | **JWT + `POST /auth/login` (dev profile)** | Unblocks UI and RBAC without Infosys SSO. Stable WID per dev email (`uuid5`). |
| **Auth (later)** | `POST /auth/login/sso` + Infosys session cookie | Returns **501** until `infosys_api` + Zscaler work is done. |
| **Dev login safety** | `ALLOW_DEV_LOGIN` / `allow_dev_login` in settings | Disable in production; set `JWT_SECRET` to a strong value. |
| **JSON field names** | **snake_case** in API | FastAPI/Pydantic default; frontend maps in `src/lib/eventMap.ts`. |
| **UI persona** | `AuthContext`: JWT roles → `availableRoles`; active tab is **UI-only** switch | Matches product “switch role” without trusting the client for authorization. |
| **platform_admin** | Mapped to **admin** in the sidebar | DB allows `platform_admin`; UI has four nav personas. |
| **Governance persona (PS.md)** | **Not** a separate DB enum yet | Map to `organizer` + group scope until product confirms (`SYNTHESIS_AND_GAPS.md`). |
| **Transactions** | `get_db` **commits** after successful request | Simple MVP; consider per-route transaction policy later. |
| **Initial migration** | Alembic revision uses `metadata.create_all()` | Fast bootstrap; later revisions can use explicit `op.*` for reviewability. |
| **Event category filter** | Explicit slug → `event_type` map | Avoid reversing a dict where multiple DB types map to one slug (`Others` vs `Technology`). |

---

## 2. Backend — files added or materially changed

| Area | Path | Notes |
| --- | --- | --- |
| Config | `app/config.py` | JWT + dev login flags. |
| DB session | `app/database.py` | `get_db` now commits on success / rolls back on error. |
| Auth deps | `app/dependencies.py` | `HTTPBearer`, `get_current_user`, `require_roles`. |
| Auth service | `app/services/auth_service.py` | JWT create/decode, dev employee upsert, default `Preference` row. |
| Events service | `app/services/event_service.py` | List/detail DTOs, create/update/delete, submit → `ApprovalRequest`, registration counts, `my_registration_status` on detail. |
| Registrations service | `app/services/registration_service.py` | Register (slots vs waitlist, re-register from `cancelled`), cancel + waitlist promote, `list_my_registrations`. |
| Registrations router | `app/routers/registrations.py` | `GET /registrations/me`. |
| Approvals service | `app/services/approval_service.py` | List pending; review → Active / Rejected / Draft + modification. |
| Approvals router | `app/routers/approvals.py` | `GET /approvals/pending`, `PATCH /approvals/{id}`. |
| Schemas | `app/schemas/auth.py`, `event.py`, `registration.py`, `approval.py` | Auth, events, registrations, approvals DTOs. |
| Routers | `app/routers/auth.py` | `POST /auth/login`, `POST /auth/login/sso` (501), `GET /auth/me`. |
| Routers | `app/routers/events.py` | Full CRUD subset + submit + `POST`/`DELETE /events/{id}/register`. |
| App | `app/main.py` | Registers `auth` + `events` + `registrations` + `approvals`. |
| Entry | `main.py` | Still `uvicorn main:app`. |
| Deps | `requirements.txt` | `python-jose[cryptography]`, `email-validator`. |
| Env template | `.env.example` | DB URLs + JWT + `ALLOW_DEV_LOGIN`. |
| Seed | `scripts/seed_demo_events.py` | Demo employee + 2 **Active** events if table empty. |

### API summary (implemented)

- `GET /health` — `db`: `connected` \| `unreachable`
- `POST /auth/login` — body `DevLoginRequest` (`mode`, `email`, `first_name`, `last_name`, `roles`)
- `POST /auth/login/sso` — **501** (stub)
- `GET /auth/me` — Bearer JWT
- `GET /events` — optional `category`, `status` (UI), `page`, `page_size`
- `GET /events/{id}`
- `POST /events` — requires role in `speaker|organizer|admin|platform_admin`
- `PATCH /events/{id}`, `DELETE /events/{id}` (draft-only delete)
- `POST /events/{id}/submit` — Draft → Pending Approval + approval row
- `POST /events/{id}/register`, `DELETE /events/{id}/register` — register / cancel (waitlist promote on seated cancel)
- `GET /registrations/me` — current user’s registered + waitlisted events as `EventListItem`
- `GET /approvals/pending` — organizer / admin / platform_admin inbox
- `PATCH /approvals/{id}` — body `decision`: `approve` \| `reject` \| `request_modification` (+ optional `review_comment`)

### Not implemented yet (master plan backlog)

- Refresh tokens, SSO exchange, Infosys API proxy, campaigns, notifications, admin routers, RBAC tests, Playwright E2E against API.

---

## 3. Frontend — files added or materially changed

| Path | Notes |
| --- | --- |
| `src/contexts/AuthContext.tsx` | JWT storage (`localStorage`), `/auth/me`, dev login mutation, `useRole` shim + `RoleProvider` alias. |
| `src/lib/api.ts` | Bearer injection, 204 handling, token helpers. |
| `src/types/api.ts` | API DTOs (snake_case), incl. registrations + approvals. |
| `src/lib/eventMap.ts` | Maps API → existing `EventData` for cards. |
| `src/hooks/useEvents.ts` | `GET /events`, `GET /events/{id}`. |
| `src/hooks/useRegistrations.ts` | `GET /registrations/me`, register / unregister mutations + query invalidation. |
| `src/hooks/useApprovals.ts` | `GET /approvals/pending`, `PATCH /approvals/{id}` + invalidation. |
| `src/pages/PendingApprovals.tsx` | Reviewer queue: approve / reject / request changes (dialogs + toasts). |
| `src/components/EventCard.tsx` | Register from card (auth + toast). |
| `src/pages/CalendarPage.tsx` | Month navigation; grid + sidebar from `GET /registrations/me`. |
| `src/App.tsx` | `AuthProvider` + routes including `/approvals`. |
| `src/components/AppLayout.tsx` | Dev sign-in / sign-out, initials from `/auth/me`. |
| `src/components/AppSidebar.tsx` | Role dropdown; organizer + admin **Pending approvals** → `/approvals`. |
| `src/pages/Dashboard.tsx` | Live data + empty state + seed hint. |
| `src/pages/EventDetail.tsx` | Live detail + sessions; register/cancel/leave waitlist; calendar export still stubbed. |
| `src/pages/CreateEvent.tsx` | `POST /events` + optional `submit`. |
| `frontend/.env.example` | `VITE_API_BASE` |

### Removed

- `src/contexts/RoleContext.tsx` — replaced by `AuthContext`.

---

## 4. How to run (reviewer checklist)

1. **Docker + persistence:** see `planning/DOCKER_SETUP.md`. Data lives in volume `eventhub_pg_data` until `docker compose down -v`.
1b. **No Docker (corporate laptop):** see `planning/LOCAL_POSTGRES_SETUP.md` — local Postgres + `scripts/init_local_db.sql` + `backend/.env`.
2. **DB only:** `./scripts/docker-up.sh` (requires Docker daemon running).
3. **Full stack (DB + migrate + API + UI):** `./scripts/run-all.sh` from repo root (starts missing pieces; skips ports already in use).
4. **One-shot API + DB:** `./scripts/run-backend.sh` — `docker compose up -d postgres`, waits via `docker compose exec … pg_isready`, venv, `alembic upgrade`, uvicorn on **8000**.
5. Or manually: `docker compose up -d postgres` (from repo root).
6. `cd backend && pip install -r requirements.txt && alembic upgrade head`
7. Optional: `python -m scripts.seed_demo_events`
8. From **`backend/`**: `uvicorn main:app --reload --host 127.0.0.1 --port 8000` (must be this `main:app`, not a stub).
9. Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) — JSON; [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health) must show `"db":"connected"` for events/login to work.
10. `cd frontend && npm run dev` → **Sign in (dev)** → browse events.

---

## 5. Changelog by date

### 2026-04-02 (this log)

- Phase 1+2 slice: auth (dev JWT), events CRUD + submit, dashboard/detail/create wired to API.
- Decision log and file-level notes captured for PR review.
- Category filter bugfix: explicit slug → `event_type` mapping in `list_events`.
- `CONTEXT.md` updated to describe AuthContext and API-backed flows.

### 2026-04-02 (registrations slice)

- Backend: `registration_service`, register/cancel routes on events, `GET /registrations/me`, `EventDetailOut.my_registration_status`.
- Frontend: `useRegistrations`, Event detail + Event card + Calendar wired to API.

### 2026-04-02 (approvals review)

- `approval_service` + `PATCH /approvals/{id}`; `GET /approvals/pending` for reviewers.
- Re-submit after **modification requested** reopens the same `approval_requests` row instead of inserting a duplicate.

### 2026-04-02 (approvals UI)

- Frontend: `/approvals` **Pending approvals** page (`useApprovals`), sidebar links for organizer + admin roles.
- `Manage Events` tabs remain mock data; real review queue is `/approvals` until that page is consolidated.

### 2026-04-02 (local Postgres without Docker)

- `planning/LOCAL_POSTGRES_SETUP.md` for corporate laptops without Docker Desktop.
- `scripts/init_local_db.sql` to create `eventhub` role/DB; cross-links from `DOCKER_SETUP.md`, `.env.example`, run scripts.

### 2026-04-02 (offline Swagger /docs)

- `/docs` served **local** `swagger-ui-bundle.js` + `swagger-ui.css` under `backend/static/swagger-ui/` (no jsDelivr CDN — fixes blank white `/docs` behind firewalls).
- Browser `GET /` with `Accept: text/html` returns a small HTML index; `*/*` or API clients still get JSON.
- `scripts/fetch-swagger-ui.sh` to refresh vendored assets.

### 2026-04-02 (Docker persistence & portability)

- `docker-compose.yml`: `restart: unless-stopped`, configurable `POSTGRES_PORT`, `start_period` on healthcheck, comments on volume persistence.
- `docker-compose.env.example`, `scripts/docker-up.sh`, `planning/DOCKER_SETUP.md` for any machine; `run-backend.sh` waits via `docker compose exec … pg_isready`.
- `scripts/run-all.sh`: Docker (if available) + migrate + start API (8000) and Vite (8080) when ports are free.

---

*Append new dated sections below as features land.*
