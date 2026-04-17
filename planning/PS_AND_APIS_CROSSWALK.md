# PS.md × `reference_docs/apis.json` — persona, workflow, and integration crosswalk

This document **extracts** requirements from **`reference_docs/PS.md`** and **catalogs** every API surface captured in **`reference_docs/apis.json`**, then **maps** them to **Event Hub personas**, **workflows**, and **current code** (as of `db-changes` / main docs).

**Use it for:** integration design, Copilot prompts, and gap reviews — not as a live API contract (paths and methods must be validated on the corporate gateway).

---

## 1. What `apis.json` contains (full inventory)

The file is a **single reference bundle** (sample requests/responses, not OpenAPI). It defines **five** distinct HTTP surfaces:

| # | URL (from `apis.json`) | Domain | Typical verb* | Purpose |
|---|------------------------|--------|---------------|---------|
| 1 | `https://lex.infosysapps.com/api-gw/wn-apis/Infosys/master-data/master-data/get/unit` | LEX | POST (JSON body) | List **units** (service lines / org slices) for dropdowns |
| 2 | `https://lex.infosysapps.com/api-gw/wn-apis/Infosys/master-data/master-data/get/sub_unit` | LEX | POST | List **sub-units** under a unit; includes `meta_values.admin` (emails) and `related_values.unit` |
| 3 | `https://lex.infosysapps.com/api-gw/wn-apis/Infosys/schedulo-search/v1/event-search` | LEX Schedulo | POST | **Search/index** of events: filters, aggs, `stats` (registered/attended/waitlist), speakers, LEX `event_id` |
| 4 | `https://lex.infosysapps.com/api-gw/wn-apis/Infosys/infy-user-management-service/v2/me/users/view` | LEX | GET | **Current user profile**: `wid`, `email`, `job_title`, `unit_name`, `department_name`, `manager_*`, etc. |
| 5 | `https://infyme.infosysapps.com/myinfy/infydigital/hmyconsv/api/EmployeeOfficialInfo/GetEmployeeOffcialInfoNew?IsMobile=false` | InfyMe | GET | **Rich “official info”** UI model (`labelView` sections) — phone, emp no, etc. |

\*Gateway patterns are usually POST for JSON bodies; confirm with Infosys API gateway documentation.

**Not in `apis.json` (but in PS.md / CONTEXT):** Microsoft **Teams**, **Viva Engage**, **Outlook/Graph**, **InfyMe banner push** — those are separate (Graph, internal IS integrations).

---

## 2. Knowledge extracted from PS.md

### 2.1 Problem core

- Email noise → **single hub** for published events, preferences, calendar, campaigning.
- Later: **intelligence** (interests, workload, learning goals) — aligns with “good to have” and `event-search` aggregations as a future data source.

### 2.2 Stakeholders → product personas (five + IS)

| PS stakeholder | Maps to `employee_roles.role` (Event Hub) | Primary jobs in PS |
|------------------|-------------------------------------------|---------------------|
| **App Admin** | `admin`, `platform_admin` | Access matrix for **Organizers + Governance**, app config, logs, performance, full power user |
| **Event Organizer** | `organizer` (+ `group_admins` scope) | Create/approve events, **slot/venue clash** judgment, bridge/reminders, **campaigns** |
| **Governance team** | `governance` | **Campaigning** support (Teams/Viva-style channels per PS); not the primary approval owner in PS wording |
| **Event Speakers** | `speaker` | Propose events, **session metadata** (topic, brief, schedule, speaker profile fields), pick **group/chapter** |
| **Event Audience** | `audience` | Discover, filter, preferences, calendar, notification modes, timed/idle popup (desktop) |
| **IS team** | ops / service accounts | InfyMe banners, Viva announcements, InfyMe notifications — **integration owners** |

PS also says **“4 personas”** in one bullet but the table lists **five** stakeholder rows — implementation treats **Admin, Organizer, Governance, Speaker, Audience** as five, with **platform_admin** as technical super-admin.

### 2.3 Must-have capabilities (PS) vs primary data source

| PS must-have | Natural API anchor (`apis.json` or other) | Event Hub today |
|--------------|-------------------------------------------|-----------------|
| Audience: event types, frequency, notification mechanism | N/A (local `preferences`) | `GET/PATCH /preferences` |
| Audience: Outlook calendar | Graph or `.ics` | `.ics` implemented; Graph stub in integration plan |
| Audience: list by time, 1d/multi/week views | N/A UI | Dashboard + calendar pages (partial vs PS calendar modes) |
| Desktop background + popup rules | N/A | Electron partial (tray); idle/native TBD |
| Speaker: propose + session metadata | N/A (app CRUD) | `POST /events`, sessions, submit |
| Speaker: group/chapter | `sub_unit` + **internal `groups`** | `group_id` on events; master-data mock |
| Organizer: approve/dismiss/modify | N/A | `/approvals/*` |
| Organizer + Governance: campaigns | Teams/Viva (not in json) | `/campaigns` + mocks; **governance** allowed |
| Admin: matrix for organizers **and governance** | N/A | `/admin/*`, `/groups/*/admins`; **governance role** assign via `POST /admin/users/{wid}/roles` |
| Zero-touch identity | `me/users/view` (+ SSO) | Dev JWT; mock SSO optional; real SSO TBD |

---

## 3. Per-API deep view (from `apis.json` samples)

### 3.1 `get/unit`

- **Request (sample):** `{ "source_fields": ["value", "related_values", "meta_values"] }`
- **Response:** `unit[]` with `value` (display string), `id`, `related_values`, `meta_values`.
- **PS link:** Unit-level org context for speakers “select groups/chapter” and admin matrix language (Org/Geo/Unit/Subunit/Location).
- **Event Hub mapping:** `GET /master-data/units` — **mock** list today; replace with LEX client + TTL cache.

### 3.2 `get/sub_unit`

- **Response:** `sub_unit[]` with `value`, `related_values.unit`, **`meta_values.admin` (email list)**, `meta_values.head`.
- **PS link:** “Admin of that group/chapter” for approval routing — **strong signal** to map `admin[]` to **organizer candidates** or **notification targets** when syncing groups.
- **Event Hub mapping:** `GET /master-data/sub-units?unit=...` — mock; real implementation should preserve **admin emails** for matrix sync jobs (see `planning/MASTER_FINAL_PLAN.md` F2).

### 3.3 `event-search` (schedulo-search)

- **Request highlights:** `pageNo`, `pageSize`, date range, `wid[]`, `requiredSources` (title, description, slots, speaker, stats, venue, …), `filters.status`, `mustNot.status`, `sort`, `query`, aggregations.
- **Response highlights:** LEX-shaped events: `event_id`, `start_date`/`end_date`, `stats.*`, `speaker[]`, `delivery_method`, `event_url`, thumbnails, etc.
- **PS link:** **Audience discovery** and “single hub” could **merge** internal `GET /events` with **LEX search** (federated) or **migrate** after parity.
- **Event Hub mapping:** No first-class **`/proxy/event-search`** in app yet; **integration point** for dashboard “discover all company events” vs hub-owned events only — **product decision required**.

### 3.4 `me/users/view`

- **Response:** `wid`, `email`, `first_name`, `last_name`, `source_id`, org tree fields (`unit_name`, `department_name`, `job_title`, `manager_*`, …).
- **PS link:** **Zero registration** — auto profile on login; basis for **RBAC** if roles come from another system later.
- **Event Hub mapping:** `POST /auth/login/sso` (real) should upsert `employees` from this payload; **mock SSO** for demos.

### 3.5 `GetEmployeeOfficialInfoNew` (InfyMe)

- **Response:** Nested `labelView` / `fields` UI-oriented JSON (not flat employee row).
- **PS link:** Extended org card; optional for v1.
- **Event Hub mapping:** Parse selected fields into `employees` extensions or read-only profile endpoint — **lower priority** than `me/users/view`.

---

## 4. Persona × workflow × implementation matrix

Legend: **✓** wired to product intent · **~** partial · **✗** not done / mock only · **API** needs `apis.json` or M365

| Workflow (PS) | Audience | Speaker | Organizer | Governance | App Admin | Key APIs |
|---------------|----------|---------|-------------|------------|-----------|----------|
| Discover & filter events | ✓ UI+API | ✓ | ✓ | ✓ (dashboard) | ✓ | `event-search` optional federation |
| Preferences & notifications | ✓ | ✓ | ✓ | ✓ | ~ | — |
| Register / waitlist / calendar | ✓ | ✓ | — | — | — | `.ics` ✓ |
| Propose event + sessions | — | ✓ | — | — | — | `sub_unit` for chapter |
| Submit for approval | — | ✓ | — | — | — | — |
| **Approve / reject / modify** | — | — | ✓ | ✗ (by design) | ✓ | — |
| **Campaigns** (Teams/Viva) | — | — | ✓ | ✓ | ✓ | M365 / mocks |
| Access matrix | — | — | ~ groups | ~ roles | ✓ | `sub_unit.meta_values.admin` sync candidate |
| Logs / config / metrics | — | — | — | — | ✓ | — |
| SSO profile | ✓ | ✓ | ✓ | ✓ | ✓ | **`me/users/view`** |
| Desktop background / popup | ~ | ~ | ~ | ~ | — | — |

**Governance vs Organizer (enforced in code):**  
- **API:** `governance` on `/campaigns`, `/integrations/*`; **not** on `/approvals` reviewer dependency.  
- **UI:** separate **Governance team** persona (sidebar: campaigns focus, no approval queue).

---

## 5. Gaps and recommended build order (apis.json–aware)

1. **`me/users/view` + SSO** — unlocks real personas tied to directory.  
2. **`get/unit` / `get/sub_unit` + cache** — unlocks PS “group/chapter” and admin matrix alignment.  
3. **Optional `event-search` proxy** — if product wants LEX-wide discovery inside Hub.  
4. **Teams/Viva/InfyMe** — not in json; follow `campaign_delivery.py` + Graph program.  
5. **`GetEmployeeOfficialInfoNew`** — profile enrichment when needed.  
6. **Slot/clash** — PS organizer obligation; bridge to calendar/room APIs (not in json).

---

## 6. Related documents

| Doc | Role |
|-----|------|
| `planning/FINAL_OPERATIONS_AND_PROMPTS_GUIDE.md` | Run, desktop packaging, Copilot entry |
| `CONTEXT.md` | Product context; update External APIs row with pointers here |
| `planning/MASTER_FINAL_PLAN.md` | Phased integration F1–F8 |
| `backend/app/integrations/corporate_stubs.py` | Mock seam names |
| `planning/COPILOT_MASTER_PROMPTS.md` | Pasteable tasks |
| `planning/IMPLEMENTED_FEATURES.md` | Route-level truth |

---

*Generated from `reference_docs/PS.md` and structural review of `reference_docs/apis.json` (5 URL blocks). Re-run review if apis.json is replaced with OpenAPI or split files.*
