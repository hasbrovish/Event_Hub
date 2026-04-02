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
| Schemas | `app/schemas/registration.py` | Registration action + my-registrations DTOs. |
| Schemas | `app/schemas/auth.py`, `app/schemas/event.py` | Login, me, CRUD + list/detail shapes. |
| Routers | `app/routers/auth.py` | `POST /auth/login`, `POST /auth/login/sso` (501), `GET /auth/me`. |
| Routers | `app/routers/events.py` | Full CRUD subset + submit + `POST`/`DELETE /events/{id}/register`. |
| App | `app/main.py` | Registers `auth` + `events` + `registrations`. |
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

### Not implemented yet (master plan backlog)

- Refresh tokens, SSO exchange, Infosys API proxy, campaigns, notifications, admin routers, RBAC tests, Playwright E2E against API.

---

## 3. Frontend — files added or materially changed

| Path | Notes |
| --- | --- |
| `src/contexts/AuthContext.tsx` | JWT storage (`localStorage`), `/auth/me`, dev login mutation, `useRole` shim + `RoleProvider` alias. |
| `src/lib/api.ts` | Bearer injection, 204 handling, token helpers. |
| `src/types/api.ts` | API DTOs (snake_case). |
| `src/lib/eventMap.ts` | Maps API → existing `EventData` for cards. |
| `src/hooks/useEvents.ts` | `GET /events`, `GET /events/{id}`. |
| `src/hooks/useRegistrations.ts` | `GET /registrations/me`, register / unregister mutations + query invalidation. |
| `src/components/EventCard.tsx` | Register from card (auth + toast). |
| `src/pages/CalendarPage.tsx` | Month navigation; grid + sidebar from `GET /registrations/me`. |
| `src/App.tsx` | Wraps tree with `AuthProvider`. |
| `src/components/AppLayout.tsx` | Dev sign-in / sign-out, initials from `/auth/me`. |
| `src/components/AppSidebar.tsx` | Role dropdown filtered by `availableRoles`. |
| `src/pages/Dashboard.tsx` | Live data + empty state + seed hint. |
| `src/pages/EventDetail.tsx` | Live detail + sessions; register/cancel/leave waitlist; calendar export still stubbed. |
| `src/pages/CreateEvent.tsx` | `POST /events` + optional `submit`. |
| `frontend/.env.example` | `VITE_API_BASE` |

### Removed

- `src/contexts/RoleContext.tsx` — replaced by `AuthContext`.

---

## 4. How to run (reviewer checklist)

1. `docker compose up -d` (Postgres).
2. `cd backend && pip install -r requirements.txt && alembic upgrade head`
3. Optional: `python -m scripts.seed_demo_events`
4. `uvicorn main:app --reload --port 8000`
5. `cd frontend && npm run dev` → **Sign in (dev)** in header → browse events / create event.

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

---

*Append new dated sections below as features land.*
