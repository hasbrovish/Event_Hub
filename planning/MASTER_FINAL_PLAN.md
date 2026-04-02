# Event Hub — master final plan (gap closure toward ~100% PS completion)

This document is the **execution blueprint** to close gaps against **`reference_docs/PS.md`** (Makeathon Event Hub problem statement) and **`CONTEXT.md`** pointers, while keeping **corporate integrations pluggable**. It extends `MASTER_IMPLEMENTATION_PLAN.md` with **file-level hooks** and **acceptance criteria**.

**Copilot / IDE integration index (single entry point in code):**  
→ `backend/app/integrations/corporate_stubs.py` (module docstring + `INTEGRATION_POINT` blocks)  
→ `frontend/src/lib/corporateIntegrationPoints.ts` (UI and Electron)  
→ `electron/main.cjs` (top-of-file `EVENT_HUB_INTEGRATION_MAP`)

**Ready-made Copilot prompts (paste into Copilot Chat):**  
→ [`planning/COPILOT_MASTER_PROMPTS.md`](COPILOT_MASTER_PROMPTS.md)

**Run stack, Windows/macOS installers, doc map:**  
→ [`planning/FINAL_OPERATIONS_AND_PROMPTS_GUIDE.md`](FINAL_OPERATIONS_AND_PROMPTS_GUIDE.md)

---

## 1. Current gap summary (vs PS must-haves)

| PS must-have theme | Gap (before this plan’s code hooks) | Target state |
|--------------------|--------------------------------------|--------------|
| Background app for all employees | Tray only; no native notifications, idle popup, auto-start | Electron + optional polling → native bridge; document MDM rollout |
| Five personas including **Governance** | Governance not a first-class role | **`governance` role** in API; UI maps to organizer menu for campaign surfaces |
| Audience: notification **mechanisms** | Mostly in-app; email/Teams DM not wired | Stub interfaces + preference fields; real channels in `corporate_stubs` successors |
| Audience: Outlook add | `.ics` only | Keep `.ics`; add **Graph stub** + deep-link mock in stubs |
| Audience: calendar 1d / multi / week | Partial UX | Persist view mode in preferences + Calendar page |
| Organizer: **real** Teams/Viva auto post | Mock logger | **Single `campaign_delivery` module** — mock now; replace body per channel |
| App Admin: performance monitoring | None | **`/health` integrations block** + optional `/admin/metrics` stub |
| Zero-touch SSO | 501 on `/auth/login/sso` | **`INTEGRATION_MOCK_SSO_LOGIN`** path for demo; real SSO replaces one function |
| Slot / clash validation | Not enforced | Stub **`check_schedule_conflicts_stub`** — wire into `review_approval` when ready |

**Scoring note:** “~100%” here means **all must-have *behaviors* are either implemented or have a named, commented integration seam** that enterprise engineers can swap without hunting the codebase. External systems (LEX, Graph, Zscaler) still require network + credentials in production.

---

## 2. Phase F0 — Integration seams (done in repo as scaffolding)

**Goal:** One mental model for “where Infosys / Microsoft code goes.”

| Deliverable | Location | Done when |
|-------------|----------|-----------|
| Corporate stub registry + LEX/Graph/SSO comments | `backend/app/integrations/corporate_stubs.py` | All `INTEGRATION_POINT` blocks present |
| Master data uses stubs | `backend/app/routers/master_data.py` | Calls `fetch_units_mock_or_proxy`, `fetch_sub_units_mock_or_proxy` |
| Integrations UI feed uses stubs | `backend/app/routers/integrations.py` | Calls stub fetchers |
| Campaign post uses delivery layer | `backend/app/services/campaign_delivery.py` | `deliver_campaign_channels` logs + comments |
| Mock SSO (optional) | `POST /auth/login/sso` + `Settings.integration_mock_sso_login` | Demo login without 501 when flag on |
| Health reports integration mode | `GET /health` | Includes `integrations` object |
| Frontend pointer file | `frontend/src/lib/corporateIntegrationPoints.ts` | Lists files to edit |
| Electron pointer block | `electron/main.cjs` | Header comment map |

---

## 3. Phase F1 — SSO and employee profile (real ~100%)

| Step | Task | Primary files |
|------|------|----------------|
| 1.1 | Implement `POST /auth/login/sso`: validate Infosys session cookie or token exchange | `auth.py`, new `services/sso_service.py` |
| 1.2 | Call **`GET .../me/users/view`** (or current gateway); map to `Employee` upsert | `integrations/corporate_stubs.py` → real `infosys_user_client.py` |
| 1.3 | Zscaler-aware `httpx` client | `integrations/http_client_corporate.py` (new), `config.py` `ZSCALER_CA_PATH` |
| 1.4 | Turn off `INTEGRATION_MOCK_SSO_LOGIN` and `ALLOW_DEV_LOGIN` in prod | env / secrets |

**Acceptance:** User signs in with corporate identity; no manual email entry; `/auth/me` matches directory.

---

## 4. Phase F2 — Master data (LEX / units / sub-units)

| Step | Task | Primary files |
|------|------|----------------|
| 2.1 | Replace stub bodies with LEX POSTs; 1h TTL cache | `corporate_stubs.py` or parallel `lex_client.py` |
| 2.2 | Wire Create Event dropdowns (if not already using `/master-data/*`) | `frontend` create event page + `useMasterData` hook |

**Acceptance:** Units/sub-units match LEX non-prod/prod; offline graceful degradation.

---

## 5. Phase F3 — Campaigns: Teams, Viva, InfyMe

| Step | Task | Primary files |
|------|------|----------------|
| 3.1 | Implement `deliver_campaign_channels` branches: Teams webhook or Graph | `campaign_delivery.py` |
| 3.2 | Viva Engage API or approved internal proxy | same |
| 3.3 | InfyMe banner API | same |
| 3.4 | Store failure reason + retry policy | `campaign_service.py`, model already has `failure_reason` |

**Acceptance:** Scheduled campaign fires on tick; message visible in real channel / group (pilot tenant).

---

## 6. Phase F4 — Outlook / calendar

| Step | Task | Primary files |
|------|------|----------------|
| 4.1 | Keep **.ics** as universal fallback | `calendar_service.py` |
| 4.2 | Optional Graph `create event` | `corporate_stubs.py` → `graph_calendar.py` |
| 4.3 | “Add to Outlook” button opens `web_link` mock | `frontend` event detail |

**Acceptance:** User adds event to calendar in one click in pilot M365.

---

## 7. Phase F5 — Desktop “continuous hub” (PS: background, popup, idle)

| Step | Task | Primary files |
|------|------|----------------|
| 5.1 | Poll `/notifications/unread-count` in main process; `Notification` API | `electron/main.cjs`, `preload.cjs` |
| 5.2 | `powerMonitor` idle / unlock; show window if away > 1h and prefs | same + `GET /preferences` |
| 5.3 | Auto-start (OS-level or electron-store flag) | `electron/main.cjs` |
| 5.4 | Single instance lock | `electron/main.cjs` |
| 5.5 | Configurable API base URL for remote server | `frontend` `api.ts`, env |

**Acceptance:** App runs in tray; user gets native toast for new notification; matches PS popup rules as closely as OS allows.

---

## 8. Phase F6 — Governance & organizer workflow depth

| Step | Task | Primary files |
|------|------|----------------|
| 6.1 | **Governance** role: campaign CRUD (already allowed with role addition); restrict approvals if policy says IC/HR cannot approve | `dependencies.py`, `approvals.py`, `campaigns.py` |
| 6.2 | Slot clash / venue: call `check_schedule_conflicts_stub` before approve; replace with calendar/room API | `approval_service.py`, `corporate_stubs.py` |
| 6.3 | Organizer “send notification” for approved events | `notification_service.py` + small admin/organizer route |

**Acceptance:** PS stakeholder table satisfied in demo script (who approves vs who campaigns).

---

## 9. Phase F7 — Admin monitoring (PS: performance & logs)

| Step | Task | Primary files |
|------|------|----------------|
| 7.1 | Expose `GET /admin/metrics` or enrich `/health`: latency pool, queue depth | new router or `health.py` |
| 7.2 | Forward structured logs to corporate SIEM (optional) | ops, not app core |

**Acceptance:** Admin sees more than audit text (basic metrics stub acceptable for hackathon score).

---

## 10. Phase F8 — Quality (MASTER §6 / PS evaluation)

| Step | Task |
|------|------|
| 8.1 | pytest: auth, events, registrations, approvals, RBAC matrix |
| 8.2 | Playwright: login → create → submit → approve → register |
| 8.3 | Rate limit auth + expensive routes (`slowapi`) |

---

## 11. Mock SSO format (demo only)

When `INTEGRATION_MOCK_SSO_LOGIN=true`:

`POST /auth/login/sso` body:

```json
{ "session_cookie": "mock_sso|demo.governance@example.com|audience,governance,organizer|Gov|User" }
```

Format: `mock_sso|email|comma_separated_roles|first_name|last_name` (last name may contain `|`)

See `backend/app/integrations/corporate_stubs.py` → `parse_mock_sso_bootstrap`.

---

## 12. Document map

| Doc | Role |
|-----|------|
| `planning/MASTER_FINAL_PLAN.md` | **This file** — gap closure + phases F0–F8 |
| `TECHNICAL_REFERENCE.md` | Phase 1–12 vs master plan |
| `planning/IMPLEMENTED_FEATURES.md` | What ships today |
| `planning/DESKTOP_APP_AND_INFOSYS_REMOTE_RUNBOOK.md` | Remote + Zscaler + desktop ops |
| `reference_docs/PS.md` | Problem statement source |

---

*Maintain this file when integration seams move or new corporate APIs are onboarded.*
