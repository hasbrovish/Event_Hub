# Event Hub — master Copilot prompt pack (corporate laptop)

**Entry point:** [`planning/FINAL_OPERATIONS_AND_PROMPTS_GUIDE.md`](FINAL_OPERATIONS_AND_PROMPTS_GUIDE.md) (doc map, Windows desktop, verification order).

Use this file **on a corporate machine** with **GitHub Copilot Chat**, **Copilot in VS Code / Cursor**, or similar. It aligns work with **`planning/MASTER_FINAL_PLAN.md`** and the code seams in **`backend/app/integrations/corporate_stubs.py`**.

---

## How to use (recommended order)

1. **Open the repo** and keep these docs available locally (offline-friendly):  
   `planning/MASTER_FINAL_PLAN.md`, `planning/COPILOT_MASTER_PROMPTS.md` (this file), `TECHNICAL_REFERENCE.md`, `planning/IMPLEMENTED_FEATURES.md`.
2. **Paste §2 “Pinned context”** once per Copilot session (or add to your workspace `.github/copilot-instructions.md` if policy allows).
3. For each gap, paste the **matching phase prompt** from §4 (F1–F8). Add §3 **Security & compliance** when touching auth or TLS.
4. After changes, run **§5 Verification** commands (adjust if your IT blocks scripts).

**Do not paste** production secrets, client IDs, or real employee PII into Copilot. Use placeholders like `YOUR_TENANT_ID`, `***`.

---

## 1. Pinned context (paste at start of every new chat)

```text
You are assisting on the Event Hub monorepo: FastAPI + SQLAlchemy async + PostgreSQL backend (backend/), React + Vite + TanStack Query frontend (frontend/), optional Electron (electron/).

Rules:
- Preserve existing patterns: snake_case JSON from API; types in frontend/src/types/api.ts.
- Never remove INTEGRATION_POINT or CORPORATE integration comment blocks; extend or replace implementations beside them.
- Single source for corporate mocks / replacement map: backend/app/integrations/corporate_stubs.py
- Campaign outbound posts must go through backend/app/services/campaign_delivery.py (deliver_campaign_channels).
- Auth: real SSO replaces POST /auth/login/sso when INTEGRATION_MOCK_SSO_LOGIN is false; mock path documented in corporate_stubs.parse_mock_sso_bootstrap.
- Read planning/MASTER_FINAL_PLAN.md for phased gaps F1–F8 before large changes.

If unsure, list files you will edit and ask for confirmation only when the change is security-critical (secrets, disabling auth).
```

---

## 2. Security & compliance block (paste when touching auth, TLS, or PII)

```text
Constraints:
- Do not hardcode secrets, certificates, or passwords. Use environment variables (see backend/.env.example) and corporate secret store in production.
- Do not log full JWTs, session cookies, or employee personal data.
- Zscaler / corporate TLS: load CA via settings.zscaler_ca_path or approved OS trust; document in code comments only—no PEM contents in repo.
- Follow least privilege for Graph / LEX scopes; comment required OAuth scopes next to new httpx calls.
```

---

## 3. Mandatory file read order (tell Copilot explicitly)

Paste when starting integration work:

```text
Before writing code, open and skim in this order:
1) backend/app/integrations/corporate_stubs.py — all INTEGRATION_POINT_* sections
2) backend/app/services/campaign_delivery.py — INTEGRATION_POINT_CAMPAIGN_POST
3) backend/app/routers/auth.py — login_sso and INTEGRATION_POINT_INFOSYS_SSO
4) frontend/src/lib/corporateIntegrationPoints.ts — UI map
5) electron/main.cjs — EVENT_HUB_INTEGRATION_MAP header
6) planning/MASTER_FINAL_PLAN.md — phase F1–F8 for the task
```

---

## 4. Phase prompts (copy one block per task)

### F1 — Real Infosys SSO + employee profile

```text
Task: Implement production path for POST /auth/login/sso (planning/MASTER_FINAL_PLAN.md F1).

Requirements:
- Add backend/app/services/sso_service.py (or integrations/sso_service.py) that validates the corporate session mechanism our IdP uses (cookie or bearer token)—use placeholders for exact header names and document them in docstrings.
- If validation succeeds, upsert Employee + EmployeeRole using the same patterns as auth_service.ensure_dev_employee but driven by directory fields from Infosys user API.
- Call a new infosys_directory.fetch_user_profile(httpx_client, ...) stub in integrations/; keep mock in tests.
- Wire httpx client factory in integrations/http_client_corporate.py using settings.zscaler_ca_path when set.
- Keep INTEGRATION_MOCK_SSO_LOGIN path working for demos.
- Update planning/IMPLEMENTED_FEATURES.md auth row if behavior changes.

Acceptance: With mock off and corporate env configured, SSO login returns LoginResponse and GET /auth/me matches directory user.
```

### F2 — LEX master data (units / sub-units)

```text
Task: Replace mock LEX data (MASTER_FINAL_PLAN F2).

Requirements:
- Implement integrations/lex_client.py with async functions get_units(), get_sub_units(unit) using corporate-approved base URL and auth (service identity or OBO—document choice in module docstring).
- Add in-memory TTL cache (~1 hour) in integrations/cache_ttl.py or small helper.
- Delegate from corporate_stubs.fetch_units_for_master_data and fetch_sub_units_for_master_data when settings.integration_mode == "live", else keep current mock.
- Do not break GET /master-data/units and /master-data/sub-units response schemas.

Acceptance: integration_mode=live hits LEX in non-prod; mock still works when integration_mode=mock.
```

### F3 — Teams / Viva / InfyMe campaign delivery

```text
Task: Real campaign posting (MASTER_FINAL_PLAN F3).

Requirements:
- Extend backend/app/services/campaign_delivery.py deliver_campaign_channels:
  - Teams: support incoming webhook URL list OR Graph post—choose one for pilot and comment the other as TODO.
  - Viva: integrate via approved internal API or Graph beta as allowed by tenant.
  - InfyMe: integrate banner endpoint shape from reference_docs/apis.json only as a template—use env for base URL.
- On hard failure set campaign.failure_reason and avoid marking Posted if post failed (adjust campaign_service.send_campaign_now accordingly).
- Add unit tests with httpx_mock or respx if available.

Acceptance: Scheduled campaign in non-prod shows a message or banner in at least one real channel when env vars are set.
```

### F4 — Outlook / Graph calendar (beyond .ics)

```text
Task: Optional Graph calendar create (MASTER_FINAL_PLAN F4).

Requirements:
- Add integrations/graph_calendar.py with create_event_for_user(...) using MS Graph; document required app registration scopes.
- Expose a guarded API route or extend existing registration flow behind feature flag GRAPH_CALENDAR_ENABLED.
- Keep .ics download as fallback; frontend Event detail: button "Add to Outlook (Graph)" when web_link returned.

Acceptance: Pilot user gets calendar item in Outlook; .ics still works if flag off.
```

### F5 — Electron continuous hub

```text
Task: Desktop background behavior (MASTER_FINAL_PLAN F5, PS must-have).

Requirements:
- In electron/main.cjs and preload.cjs: poll GET /notifications/unread-count with configurable API base URL (env).
- Use Electron Notification API when count increases; click opens deep link to /notifications or event.
- Add powerMonitor logic: if user idle/locked > 1 hour and preferences.notify_on_login (fetch GET /preferences with stored token), show main window once.
- app.requestSingleInstanceLock(); second instance focuses first.
- Document EVENT_HUB_API_URL usage in electron/main.cjs comments.

Acceptance: Tray app shows native toast on new notification in dev build; no tight polling loop (<30s interval minimum configurable).
```

### F6 — Governance workflow depth

```text
Task: Governance vs organizer rules (MASTER_FINAL_PLAN F6).

Requirements:
- Review PS.md stakeholders: governance campaigns; clarify if governance may approve events—if not, ensure require_roles on approvals router excludes governance only if product confirms.
- Implement real check_schedule_conflicts_stub replacement querying overlapping Active events or Graph free-busy—return list of conflict strings; approval_service already raises on non-empty list.
- Optional: organizer broadcast notification route for approved events using notification_service.

Acceptance: Role matrix documented in TECHNICAL_REFERENCE or IMPLEMENTED_FEATURES; conflicts block approve when data says so.
```

### F7 — Admin metrics / performance

```text
Task: Admin observability (MASTER_FINAL_PLAN F7).

Requirements:
- Replace admin_metrics_stub in GET /health with optional pool stats (SQLAlchemy pool if exposed safely) or simple counters; OR add GET /admin/metrics for admin role only.
- No sensitive data; comment integration with App Insights / Prometheus for production.

Acceptance: Admin can see non-empty metrics object in dev; 403 for non-admin on /admin/metrics if added.
```

### F8 — Tests and hardening

```text
Task: Test and security baseline (MASTER_FINAL_PLAN F8).

Requirements:
- Add pytest integration tests: auth (dev + mock SSO), events list, registration, approval happy path using TestClient.
- Add slowapi rate limit on POST /auth/login and /auth/login/sso.
- Document commands in README or planning doc.

Acceptance: pytest passes locally; rate limit returns 429 when abused in test.
```

---

## 5. Verification checklist (run locally after Copilot edits)

```bash
# Backend
cd backend
.venv/bin/python -c "from app.main import app; print('import ok')"
.venv/bin/pytest -q

# Frontend
cd ../frontend
npm run build
npm run lint
```

If IT blocks `npm`, at least run `npm run build` on an allowed machine before merge.

---

## 6. “Small fix” prompts (integration-adjacent)

### Find all integration seams

```text
Search the repo for INTEGRATION_POINT_ and list each file and responsibility. Propose no code changes—summary only.
```

### Add a new mock channel type

```text
Add a new mock integration list endpoint GET /integrations/example-channels mirroring teams-channels pattern, backed by corporate_stubs with INTEGRATION_POINT_EXAMPLE comment block, and document in corporateIntegrationPoints.ts.
```

### Wire Create Event to master data

```text
Ensure CreateEvent page uses GET /master-data/units and GET /master-data/sub-units?unit=... with TanStack Query hooks; match existing UI patterns; handle loading and error states.
```

---

## 7. Document index (keep in repo; do not paste secrets into Copilot)

| Document | Use |
|----------|-----|
| `planning/MASTER_FINAL_PLAN.md` | Phases F0–F8, gap table |
| `planning/DESKTOP_APP_AND_INFOSYS_REMOTE_RUNBOOK.md` | Zscaler, remote VM, desktop ops |
| `TECHNICAL_REFERENCE.md` | Master plan phase 1–12 vs code |
| `planning/IMPLEMENTED_FEATURES.md` | What routes exist today |
| `reference_docs/PS.md` | Problem statement source |

---

## 8. Optional: workspace Copilot instructions (if permitted)

If your org allows `.github/copilot-instructions.md` in the repo, symlink or duplicate **§1 Pinned context** and **§3 Mandatory file read order** there so Copilot loads them automatically—**without** embedding any secrets.

---

*This prompt pack is meant to be safe for corporate laptops: it references local files and placeholders, not live credentials.*
