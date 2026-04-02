# Event Hub — synthesis and gaps (CONTEXT + master plan + reference_docs)

This document consolidates findings from `CONTEXT.md`, `MASTER_IMPLEMENTATION_PLAN.md`, `reference_docs/db_design.md`, `reference_docs/PS.md`, and `reference_docs/apis.json`. Use it before large refactors or when reconciling product, schema, and implementation choices.

---

## 1. Single narrative (what we are building)

- **Problem (PS.md):** Org-wide events are lost in email noise; need one hub for discovery, registration, calendar, campaigning, and preference-driven notifications; background-capable client; multiple personas (admin, organizer, governance, speaker, audience).
- **Product direction (CONTEXT.md):** Event Hub as Infosys-internal desktop + web hybrid: Electron + React + FastAPI; pillars are **event management** and **campaign management**; governance (unit → org → HR), RBAC at API level, SSO / zero manual registration, pluggable integrations (InfyMe, Viva, Teams, Outlook) with mocks where needed.
- **Execution blueprint (MASTER_IMPLEMENTATION_PLAN.md):** Twelve phased delivery from PostgreSQL + auth foundation through registrations, campaigns, notifications, Electron hardening, external proxies, admin, recommendations, and production hardening; **52** catalogued HTTP endpoints; six documented end-to-end workflows.

---

## 2. Alignment matrix

| Theme | CONTEXT.md | MASTER plan | db_design.md | PS.md |
| --- | --- | --- | --- | --- |
| Personas / RBAC | Four roles + routes | `employee_roles`, RBAC per endpoint, admin matrix | SQL `CHECK` on roles; `group_admins` bridge | Five stakeholder groups (governance separate) |
| Data store | Mongo hackathon / Postgres prod | **PostgreSQL primary** (governance + FKs) | Full PostgreSQL DDL + Mongo alternative | N/A |
| Auth | SSO, session APIs | JWT + Infosys session proxy, refresh | N/A | N/A |
| Campaigns | Teams, Viva, InfyMe | Phases 5 & 8, mock/real config | `campaigns` table | Organizer + governance campaigning |
| Calendar / Outlook | Add to calendar | `.ics` Phase 4; Graph optional Phase 8 | N/A | Outlook calendar |
| Desktop | Continuous Electron | Phase 7 tray, notifications, health | N/A | Background run |
| AI / SLM | Good-to-have pointers | Phase 11 heuristic scoring | N/A | SLM suggested in “software required” |

---

## 3. Conflicts and decisions to lock explicitly

### 3.1 Database: PostgreSQL vs MongoDB

- **CONTEXT.md** suggests MongoDB for hackathon speed and PostgreSQL for production.
- **db_design.md** comparison table labels PostgreSQL for “presentation / production pitch” and MongoDB for “actual hackathon build.”
- **MASTER_IMPLEMENTATION_PLAN.md** argues for **PostgreSQL from day one** because governance, FK integrity, and audit trails are top priority; Alembic initial migration from `db_design.md` DDL.

**Finding:** Three stances exist. For any sprint, pick one **authoritative** line (recommended: follow **MASTER_IMPLEMENTATION_PLAN** if the goal is enterprise governance and one migration path; follow **CONTEXT/db_design hackathon note** only if the team explicitly prioritizes schema-free speed over DB-level constraints).

### 3.2 Stack: MERN vs current repo

- **PS.md** mentions MERN + SLM.
- **Codebase** is **React + Electron + FastAPI** (not Node backend).

**Finding:** Acceptable deviation; document in README or pitch as “equivalent capabilities, org-friendly Python API layer.” SLM can still sit behind Phase 11-style recommendation endpoints.

### 3.3 Governance persona vs roles in code

- **PS.md** distinguishes **Governance team** from **Organizer**.
- **CONTEXT.md** maps `organizer` to group-mapped admin including approvals and campaigns; **db_design** has `organizer` / `admin` / `platform_admin` but no separate `governance` role enum.

**Finding:** Either map governance to **`organizer`** with group scoping + policy, or add a **`governance`** value to `employee_roles` and extend RBAC in Phase 3. The master plan’s RBAC tables do not yet name governance separately—this is a **schema + product gap** to close before build.

### 3.4 `reference_docs/apis.json` format

- File is a **capture log** (URLs as section headers, embedded JSON samples), **not** a single parseable JSON document.
- URLs identified: `master-data/get/unit`, `master-data/get/sub_unit`, `schedulo-search/v1/event-search`, `infy-user-management-service/v2/me/users/view`, InfyMe `GetEmployeeOffcialInfoNew` (typo in path as captured).

**Finding:** Treat as **reference samples**; implement clients against documented shapes and validate on corporate network / Zscaler (see MASTER plan §7).

### 3.5 `PS.md` file quality

- Includes converter chrome (“Word to Markdown”, “Submit”, footer links). The substantive content is the **Makeathon Event Hub** problem statement and evaluation weights.

**Finding:** Safe to ignore boilerplate when quoting requirements; prefer **CONTEXT.md** for dev structure and **MASTER_IMPLEMENTATION_PLAN** for phased tasks.

---

## 4. Schema and API anchors

- **Authoritative DDL:** `reference_docs/db_design.md` § “SQL — Full DDL (PostgreSQL)” (tables: `employees`, `employee_roles`, `preferences`, `groups`, `group_admins`, `events`, `sessions`, `approval_requests`, `registrations`, `campaigns`, `notifications` + indexes).
- **Authoritative route list:** `MASTER_IMPLEMENTATION_PLAN.md` §4 (52 endpoints) plus per-phase tables.
- **State machines:** `db_design.md` (event, approval, registration, campaign) — must match FastAPI service layer validation.

---

## 5. Current codebase vs documentation

| Area | Docs say | Repo state (see `planning/IMPLEMENTED_FEATURES.md` §2 + §7) |
| --- | --- | --- |
| Backend | MASTER **52**-style catalog | **Most catalog routes exist** (refresh, stats, my-sessions, `.ics`, registrations list, attend, approvals list + my-requests, groups, campaigns, notifications, preferences, master-data stubs, integrations mocks, recommendations, admin). **Still missing:** real SSO, Infosys proxies, persisted audit logs, production Zscaler. |
| Frontend | MASTER §5 migration | **Wired:** dashboard, detail (incl. ICS download), calendar, create, approvals, **notifications**, **preferences**, **campaigns**, **admin** panel, auth + unread badge. **Thin:** manage-events consolidation, digest scheduling UI. |
| Auth | SSO + JWT | **Dev JWT + refresh**; **`/auth/login/sso` → 501**. |
| `reference_docs/apis.json` | Corporate APIs | **Not proxied**; `/master-data/*` uses static dev payloads. |
| `reference_docs/PS.md` | Full product | **Gaps:** governance persona enum, real Teams/Viva/InfyMe posting, SLM recommendations, background client behavior, performance monitoring. |
| Electron | Phase 7 | **Tray + hide-on-close** added; **no** native notification bridge, idle detection, or backend health restart loop yet. |

**Finding:** Core **phases 1–6** backend + primary UI surfaces are largely in place; remaining work is **enterprise integration**, **Electron hardening**, **digest/reminder jobs**, **audit persistence**, and **group governance** polish.

---

## 6. Risk register (from synthesis)

| Risk | Mitigation (from docs) |
| --- | --- |
| Zscaler TLS MITM | `ZSCALER_CA_PATH`, httpx SSL context, Electron trust notes (MASTER §7) |
| Session cookie to backend | Secure handling, short JWT, refresh flow (MASTER Phase 1 & 12) |
| Organizer approves wrong group | `group_admins` checks on every approval (MASTER Phase 3) |
| Waitlist races | Registration service rules + tests (MASTER Phase 4) |
| Campaign scheduler reliability | Async loop / job; idempotent post + failure_reason (MASTER Phase 5) |

---

## 7. Recommended reading order for implementers

1. `CONTEXT.md` — product pointers and stack.
2. `planning/PLAN_MODE.md` — how to run a planning pass.
3. `MASTER_IMPLEMENTATION_PLAN.md` — phase for current sprint.
4. `reference_docs/db_design.md` — DDL and enums for models.
5. `reference_docs/PS.md` — stakeholder and must-have checklist for demos.
6. `reference_docs/apis.json` — sample payloads only (verify live).

---

*Generated to support structured planning; update this file when the team locks DB choice and governance role modeling.*
