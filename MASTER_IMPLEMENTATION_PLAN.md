I have thoroughly explored the entire codebase. Since the Write tool is not available in this read-only mode, I will present the complete master implementation plan directly below.

---

# EVENT HUB -- MASTER IMPLEMENTATION PLAN

## TABLE OF CONTENTS

1. Database Recommendation
2. Phased Implementation (12 Phases)
3. Workflow Documentation (6 Workflows)
4. API Design (Complete Endpoint Catalog)
5. Frontend Migration Plan
6. Testing Strategy
7. Networking and Zscaler
8. Deployment and Packaging

---

## 1. DATABASE RECOMMENDATION

### Comparison for This Specific Application

| Factor | PostgreSQL | MongoDB |
|---|---|---|
| Governance audit trail | Native FK constraints, CASCADE, CHECK constraints enforce referential integrity at DB level | Application-level enforcement only; orphaned references possible |
| Role enforcement | CHECK constraints on `employee_roles.role` prevent invalid values | Application-level enum validation; no DB-level guard |
| Approval workflow integrity | FK from `approval_requests.event_id` to `events.id` guarantees no approval without a real event | Manual ref integrity; possible to approve a deleted event |
| Event-Session relationship | JOIN required but guarantees session always belongs to an existing event | Embedded sessions: one read, but no independent lifecycle |
| Hackathon speed | Slightly slower schema migration but SQLAlchemy+Alembic is well-automated | Schema-free means faster iteration |
| Desktop app (SQLite fallback) | Can run SQLite locally for offline caching while PostgreSQL runs on server | Needs full MongoDB driver; no simple local fallback |
| Stats/analytics queries | SQL GROUP BY, window functions, CTEs for admin dashboards | Aggregation pipeline is powerful but more verbose |
| Full-text search | `tsvector` + GIN index; no external service needed | `$text` index or Atlas Search |
| Production scalability | Horizontal read replicas; vertical for writes; proven at enterprise scale | Sharding built-in but overkill for this use case |

### Recommendation: PostgreSQL (Primary) with consideration for MongoDB as secondary cache

**Reasoning:**

1. **Governance is the number-one priority** (pointers 6, 7, 12, 16a, 16b, 16c). Every approval action, every role assignment, every event state transition needs an auditable, referentially-integer trail. PostgreSQL's CHECK constraints, FK constraints, and trigger capabilities enforce this at the database level, not just the application level. This is non-negotiable for an enterprise governance platform.

2. **The 11-entity schema is inherently relational.** The ER diagram in `db_design.md` shows classic relational patterns: M:M bridge tables (`group_admins`), 1:M with foreign keys (`events.group_id`, `events.created_by`), and status-driven state machines that benefit from CHECK constraints.

3. **Hackathon speed is not meaningfully different.** With SQLAlchemy models and Alembic migrations (both already standard FastAPI patterns), schema creation is a single `alembic upgrade head` command. The DDL is already fully written in `db_design.md`.

4. **Desktop app advantage.** PostgreSQL on the server + optional SQLite for offline event caching on the Electron client gives a clean architecture. MongoDB would require a full MongoDB driver in both contexts.

5. **The MongoDB embedded document advantages (sessions in events, preferences in employees) can be replicated** through SQLAlchemy relationship loading (`joinedload`) with negligible performance difference at Infosys's scale (thousands, not millions of concurrent users).

**Setup:** Use PostgreSQL via Docker locally (`docker run -d --name eventhub-pg -e POSTGRES_DB=eventhub -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16`). For production, use a managed PostgreSQL instance (Azure Database for PostgreSQL or an internal Infosys-hosted instance).

---

## 2. PHASED IMPLEMENTATION

### PHASE 1: Foundation (DB, Project Structure, Auth)

**Deliverable:** Backend boots with real DB, user auto-login via SSO proxy, JWT issued, frontend can make authenticated requests.

**Pointers addressed:** 13 (auto-login SSO), 12 (role-based personas foundation), 5 (centralized data source)

#### Backend Files to Create

```
backend/
  app/
    __init__.py
    main.py                          # New FastAPI app factory (replace current main.py)
    config.py                        # Settings via pydantic-settings (DB URL, JWT secret, API keys)
    database.py                      # SQLAlchemy async engine + sessionmaker
    dependencies.py                  # get_db, get_current_user, require_role() dependency
    models/
      __init__.py
      employee.py                    # Employee, EmployeeRole SQLAlchemy models
      group.py                       # Group, GroupAdmin models
      event.py                       # Event, Session models
      approval.py                    # ApprovalRequest model
      registration.py                # Registration model
      campaign.py                    # Campaign model
      notification.py                # Notification model
      preference.py                  # Preference model
    schemas/
      __init__.py
      employee.py                    # Pydantic request/response schemas
      auth.py                        # TokenResponse, LoginRequest schemas
    routers/
      __init__.py
      auth.py                        # POST /auth/login, GET /auth/me
      health.py                      # GET /health (migrated)
    services/
      __init__.py
      auth_service.py                # SSO proxy logic, JWT creation
      infosys_api.py                 # HTTP client for all 5 Infosys APIs
    middleware/
      __init__.py
      proxy_aware.py                 # Zscaler-aware httpx client factory
  alembic/
    env.py
    versions/                        # Migration files
  alembic.ini
  requirements.txt                   # Add: sqlalchemy[asyncio], asyncpg, alembic, pydantic-settings, python-jose, httpx, passlib
```

#### Backend API Endpoints (Phase 1)

| Method | Path | Request | Response | Auth | Role |
|---|---|---|---|---|---|
| POST | `/auth/login` | `{ session_cookie: string }` (forwarded from Infosys SSO) | `{ access_token, user }` | None | Any |
| GET | `/auth/me` | - | `Employee` with roles | JWT | Any |
| GET | `/health` | - | `{ status, db, version }` | None | Any |

#### Frontend Changes

- Create `frontend/src/lib/api.ts` -- Axios/fetch wrapper with JWT injection, base URL detection (Electron vs web)
- Create `frontend/src/hooks/useAuth.ts` -- React Query hook for `/auth/me`, stores token in memory + localStorage
- Create `frontend/src/contexts/AuthContext.tsx` -- Replace `RoleContext.tsx` with real auth context that provides `user`, `roles[]`, `activeRole`, `setActiveRole`
- Modify `frontend/src/components/AppLayout.tsx` -- Replace hardcoded "JD" avatar with real user initials from auth context
- Modify `frontend/src/components/AppSidebar.tsx` -- Role switcher only shows roles the user actually has
- Create `frontend/src/pages/LoginPage.tsx` -- SSO redirect or session-based auto-login screen

#### Database Migration (Phase 1)

Run the full DDL from `db_design.md` lines 374-584 via Alembic initial migration. All 10 tables + 12 indexes created.

#### Testing (Phase 1)

- Unit tests: `test_auth_service.py` -- mock Infosys user API response, verify JWT creation
- Integration tests: `test_auth_router.py` -- real DB, verify login flow creates employee record
- Frontend: `useAuth.test.ts` -- mock API, verify token storage and role extraction

---

### PHASE 2: Core Event Management (CRUD + Workflows)

**Deliverable:** Events can be created, listed, filtered, searched, and viewed with real data. Speakers can propose events with sessions.

**Pointers addressed:** 1 (Event Management pillar), 9 (user-friendly event discovery), 4 (centralized updates)

#### Backend Files to Create

```
backend/app/
  routers/
    events.py                        # Full CRUD
    sessions.py                      # Session management within events
  services/
    event_service.py                 # Business logic: status transitions, validation
  schemas/
    event.py                         # EventCreate, EventUpdate, EventResponse, EventList, SessionCreate
    filters.py                       # EventFilters (category, date range, status, group)
```

#### Backend API Endpoints (Phase 2)

| Method | Path | Request | Response | Auth | Role | Page |
|---|---|---|---|---|---|---|
| GET | `/events` | Query params: `category, status, date_from, date_to, group_id, search, page, page_size` | Paginated `EventListResponse` | JWT | Any | Dashboard |
| POST | `/events` | `EventCreate` (title, description, event_type, sessions[], group_id, etc.) | `EventResponse` | JWT | speaker+ | CreateEvent |
| GET | `/events/{id}` | - | `EventDetailResponse` (includes sessions, speaker info, registration stats) | JWT | Any | EventDetail |
| PATCH | `/events/{id}` | `EventUpdate` (partial fields) | `EventResponse` | JWT | creator/organizer | ManageEvents |
| DELETE | `/events/{id}` | - | 204 | JWT | creator/admin | ManageEvents |
| POST | `/events/{id}/submit` | `{ note?: string }` | `ApprovalRequest` | JWT | creator | CreateEvent |
| GET | `/events/my-sessions` | - | `EventListResponse` filtered to speaker_wid = current user | JWT | speaker | MySessions |
| GET | `/events/stats` | - | `{ upcoming, live, registered_by_me, total }` | JWT | Any | Dashboard |

#### Frontend Changes

- Create `frontend/src/types/event.ts` -- TypeScript interfaces matching backend schemas (replace `EventData` in `mockEvents.ts`)
- Create `frontend/src/services/eventService.ts` -- API functions: `getEvents()`, `getEvent(id)`, `createEvent()`, etc.
- Create `frontend/src/hooks/useEvents.ts` -- `useEvents(filters)`, `useEvent(id)`, `useCreateEvent()`, `useMySession()`
- Modify `frontend/src/pages/Dashboard.tsx` -- Replace `mockEvents` import with `useEvents()` hook; wire category filter to query params
- Modify `frontend/src/pages/EventDetail.tsx` -- Replace `mockEvents.find()` with `useEvent(id)`; show real session list
- Modify `frontend/src/pages/CreateEvent.tsx` -- Wire form to `useCreateEvent()` mutation; add Zod validation schema for all fields; real session form state management with react-hook-form
- Modify `frontend/src/pages/MySessions.tsx` -- Replace mock data with `useMySession()` hook
- Modify `frontend/src/components/EventCard.tsx` -- Update to use new `Event` type
- Delete or deprecate `frontend/src/data/mockEvents.ts` once all pages migrated

#### Testing (Phase 2)

- Unit: `test_event_service.py` -- status transition validation, slot calculation
- Integration: `test_events_router.py` -- CRUD operations against real DB
- Frontend: `Dashboard.test.tsx` -- render with mocked React Query, verify filtering

---

### PHASE 3: Personas and Governance (Role Enforcement, Approval Chains)

**Deliverable:** Backend-enforced role checking on every endpoint. Approval workflow for events. Group-to-organizer mapping enforced.

**Pointers addressed:** 12 (robust role-based personas), 6 (strong internal governance), 7 (admin handling feature flow), 16a (robust personas), 16b (strong hierarchy), 16c (governance)

#### Backend Files to Create

```
backend/app/
  routers/
    groups.py                        # Group CRUD, admin mapping
    approvals.py                     # Approval workflow endpoints
  services/
    group_service.py                 # Group hierarchy logic
    approval_service.py              # Approval state machine, notification triggers
  middleware/
    rbac.py                          # Role-Based Access Control decorator/dependency
```

#### Backend API Endpoints (Phase 3)

| Method | Path | Request | Response | Auth | Role | Page |
|---|---|---|---|---|---|---|
| GET | `/groups` | Query: `org, unit, location` | `GroupListResponse` | JWT | organizer+ | ManageEvents |
| POST | `/groups` | `GroupCreate` | `GroupResponse` | JWT | admin | AdminPanel |
| PATCH | `/groups/{id}` | `GroupUpdate` | `GroupResponse` | JWT | admin | AdminPanel |
| POST | `/groups/{id}/admins` | `{ employee_wid }` | 201 | JWT | admin | AdminPanel |
| DELETE | `/groups/{id}/admins/{wid}` | - | 204 | JWT | admin | AdminPanel |
| GET | `/approvals` | Query: `status, group_id` | `ApprovalListResponse` | JWT | organizer+ | ManageEvents |
| PATCH | `/approvals/{id}` | `{ action: "approve"|"reject"|"request_modification", comment }` | `ApprovalResponse` | JWT | organizer for group | ManageEvents |
| GET | `/approvals/my-requests` | - | Approvals requested by current user | JWT | speaker | MySessions |

#### RBAC Enforcement Rules

The `require_role()` dependency will enforce:
- `audience`: Can only read events, manage own registrations and preferences
- `speaker`: Can create events (status=Draft), submit for approval, view own sessions
- `organizer`: Can approve/reject events for their mapped groups only, create campaigns, send notifications
- `admin` / `platform_admin`: Full access to all endpoints, can manage access matrix, groups, config

Every router will use `Depends(require_role("organizer"))` or similar. The dependency checks `employee_roles` table, not the frontend context.

#### Frontend Changes

- Create `frontend/src/hooks/useApprovals.ts` -- `usePendingApprovals()`, `useApproveEvent()`, `useRejectEvent()`
- Modify `frontend/src/pages/ManageEvents.tsx` -- Replace mock data with real approval queue; wire approve/reject buttons to mutations
- Create `frontend/src/components/ApprovalDialog.tsx` -- Modal for approve/reject with comment field
- Modify `frontend/src/components/AppSidebar.tsx` -- Disable/hide menu items based on real roles from AuthContext
- Add route guards: `frontend/src/components/ProtectedRoute.tsx` -- redirect if role insufficient

#### Testing (Phase 3)

- Unit: `test_rbac.py` -- verify each role can/cannot access specific endpoints
- Integration: `test_approval_workflow.py` -- full flow: create event -> submit -> approve -> status becomes Active
- Security: Test that speaker cannot approve own event; organizer cannot approve event outside their group

---

### PHASE 4: Registration and Calendar

**Deliverable:** Users can register for events, get waitlisted, cancel. Calendar page shows real registered events. Outlook .ics export works.

**Pointers addressed:** 15 (Outlook as trigger point), 9 (user-friendly registration), 3 (preference-based)

#### Backend Files to Create

```
backend/app/
  routers/
    registrations.py                 # Register, cancel, waitlist management
    calendar.py                      # .ics file generation
  services/
    registration_service.py          # Slot management, waitlist promotion
    calendar_service.py              # ICS generation using icalendar library
```

#### Backend API Endpoints (Phase 4)

| Method | Path | Request | Response | Auth | Role | Page |
|---|---|---|---|---|---|---|
| POST | `/events/{id}/register` | - | `RegistrationResponse` (status: registered or waitlisted) | JWT | Any | EventDetail |
| DELETE | `/events/{id}/register` | - | 204 (cancels registration; promotes waitlist) | JWT | Any | EventDetail |
| GET | `/registrations/me` | Query: `status, date_from, date_to` | `RegistrationListResponse` | JWT | Any | CalendarPage |
| PATCH | `/registrations/{id}/attend` | - | `RegistrationResponse` (status: attended) | JWT | organizer | ManageEvents |
| GET | `/events/{id}/calendar.ics` | - | ICS file download | JWT | Any | EventDetail |
| GET | `/registrations/me/calendar.ics` | - | ICS file with all registered events | JWT | Any | CalendarPage |
| GET | `/events/{id}/registrations` | Query: `status, page` | `RegistrationListResponse` with attendee details | JWT | organizer+ | ManageEvents |

#### Registration Business Logic

1. On `POST /events/{id}/register`:
   - Check event status is `Active`
   - Check user not already registered
   - If `event.slots` is null (unlimited) or `stats.registered < event.slots`: status = `registered`
   - Else: status = `waitlisted`
   - Update `event.stats` (registered/waitlisted counts)

2. On `DELETE /events/{id}/register` (cancel):
   - Set registration status to `cancelled`
   - If cancellation frees a slot and waitlist exists: promote oldest waitlisted to `registered`, trigger notification
   - Update `event.stats`

#### Frontend Changes

- Create `frontend/src/hooks/useRegistrations.ts` -- `useRegister(eventId)`, `useCancelRegistration(eventId)`, `useMyRegistrations()`
- Modify `frontend/src/pages/EventDetail.tsx` -- Register button calls real API; shows waitlist status; "Add to Calendar" triggers .ics download
- Modify `frontend/src/pages/CalendarPage.tsx` -- Replace mock with `useMyRegistrations()`; make calendar navigable (not hardcoded April 2026)
- Create `frontend/src/utils/calendar.ts` -- Helper for .ics download trigger

#### Testing (Phase 4)

- Unit: `test_registration_service.py` -- slot exhaustion, waitlist promotion, concurrent registration handling
- Integration: `test_registration_flow.py` -- register -> cancel -> waitlist promotion
- E2E: Playwright test for register button flow

---

### PHASE 5: Campaign Management

**Deliverable:** Organizers can create, schedule, and manage campaigns targeting MS Teams channels and Viva Engage groups. Campaign posting is mock-ready with pluggable integration layer.

**Pointers addressed:** 1 (Campaign Management pillar), 8 (InfyMe, Viva, Teams integration points), 14 (real where possible, mock the rest)

#### Backend Files to Create

```
backend/app/
  routers/
    campaigns.py                     # Campaign CRUD + scheduling
  services/
    campaign_service.py              # Campaign state machine
    integrations/
      __init__.py
      base.py                        # Abstract IntegrationChannel class
      teams_integration.py           # MS Teams webhook/Graph API (mock-ready)
      viva_integration.py            # Viva Engage API (mock-ready)
      infyme_integration.py          # InfyMe banner API (mock-ready)
  tasks/
    campaign_scheduler.py            # Background task: poll for scheduled campaigns, execute posting
```

#### Backend API Endpoints (Phase 5)

| Method | Path | Request | Response | Auth | Role | Page |
|---|---|---|---|---|---|---|
| GET | `/campaigns` | Query: `event_id, status, page` | `CampaignListResponse` | JWT | organizer+ | Campaigns |
| POST | `/campaigns` | `CampaignCreate` (event_id, message, channels, scheduled_at) | `CampaignResponse` | JWT | organizer | Campaigns |
| PATCH | `/campaigns/{id}` | `CampaignUpdate` | `CampaignResponse` | JWT | organizer | Campaigns |
| DELETE | `/campaigns/{id}` | - | 204 (only if Draft) | JWT | organizer | Campaigns |
| POST | `/campaigns/{id}/send-now` | - | `CampaignResponse` (status: Posted or Failed) | JWT | organizer | Campaigns |
| GET | `/integrations/teams-channels` | - | List of available Teams channels (mock or real) | JWT | organizer | Campaigns |
| GET | `/integrations/viva-groups` | - | List of available Viva groups (mock or real) | JWT | organizer | Campaigns |

#### Integration Layer Architecture

```python
# backend/app/services/integrations/base.py
class IntegrationChannel(ABC):
    @abstractmethod
    async def post(self, message: str, target_id: str) -> PostResult: ...
    @abstractmethod
    async def list_targets(self) -> list[ChannelTarget]: ...

class MockIntegration(IntegrationChannel):
    """Returns success with logged payload for demo."""
    async def post(self, message, target_id):
        logger.info(f"MOCK POST to {target_id}: {message}")
        return PostResult(success=True, mock=True)
```

Config-driven: `TEAMS_INTEGRATION=mock|real` in `config.py`. Switch to real by changing env var.

#### Background Campaign Scheduler

Use FastAPI's `on_startup` with `asyncio.create_task` running a loop every 60 seconds:
1. Query campaigns where `status='Scheduled'` and `scheduled_at <= now()`
2. For each, call the appropriate `IntegrationChannel.post()`
3. Update status to `Posted` or `Failed` with `failure_reason`

#### Frontend Changes

- Create `frontend/src/hooks/useCampaigns.ts` -- `useCampaigns()`, `useCreateCampaign()`, `useSendCampaign()`
- Modify `frontend/src/pages/Campaigns.tsx` -- Replace mock data; full campaign creation form with event selector, channel multi-select, message editor, date/time picker
- Create `frontend/src/components/CampaignForm.tsx` -- Reusable campaign creation/edit form

#### Testing (Phase 5)

- Unit: `test_campaign_service.py` -- state machine transitions, scheduling validation
- Integration: `test_campaign_scheduler.py` -- verify mock integration fires correctly
- Frontend: `Campaigns.test.tsx` -- form submission, validation

---

### PHASE 6: Notification System

**Deliverable:** In-app notifications with preference-based filtering. Real-time delivery via polling (WebSocket optional). Notification triggers for all key events.

**Pointers addressed:** 3 (preference-based notifications), 9 (user perspective), 10 (configurable)

#### Backend Files to Create

```
backend/app/
  routers/
    notifications.py                 # Notification CRUD + mark read
    preferences.py                   # User preference CRUD
  services/
    notification_service.py          # Create, filter by preferences, batch
    preference_service.py            # Preference CRUD logic
```

#### Backend API Endpoints (Phase 6)

| Method | Path | Request | Response | Auth | Role | Page |
|---|---|---|---|---|---|---|
| GET | `/notifications` | Query: `is_read, type, page` | `NotificationListResponse` | JWT | Any | Notifications |
| GET | `/notifications/unread-count` | - | `{ count: number }` | JWT | Any | AppLayout (header bell) |
| PATCH | `/notifications/{id}/read` | - | 204 | JWT | Any | Notifications |
| PATCH | `/notifications/read-all` | - | 204 | JWT | Any | Notifications |
| GET | `/preferences` | - | `PreferenceResponse` | JWT | Any | Preferences |
| PATCH | `/preferences` | `PreferenceUpdate` | `PreferenceResponse` | JWT | Any | Preferences |

#### Notification Triggers (Automatic)

These are fired by services, not by API calls:

| Trigger | Recipients | Type | When |
|---|---|---|---|
| Event approved | Event creator | `approved` | Approval status -> Approved |
| Event rejected | Event creator | `rejected` | Approval status -> Rejected |
| New event in followed group | Users following that group | `new_event` | Event status -> Active |
| New event matching interests | Users with matching `preferences.event_types` | `new_event` | Event status -> Active |
| Registration confirmed | Registrant | `registration` | Registration created |
| Waitlist promoted | Promoted user | `registration` | Waitlist -> Registered |
| Event reminder | All registered users | `reminder` | 1 hour before event start |
| Campaign posted | Target audience | `campaign` | Campaign status -> Posted |

#### Preference-Based Filtering

When creating a `new_event` notification:
1. Query users whose `preferences.event_types` includes the event's `event_type`
2. OR users whose `preferences.followed_group_ids` includes the event's `group_id`
3. For each qualifying user, check `notification_frequency`:
   - `immediate`: Create notification record + push to Electron if online
   - `daily_digest`: Queue for digest batch (run at user's configured `notification_times`)
   - `weekly`: Queue for weekly batch

#### Frontend Changes

- Create `frontend/src/hooks/useNotifications.ts` -- `useNotifications()`, `useUnreadCount()`, `useMarkRead()`
- Create `frontend/src/hooks/usePreferences.ts` -- `usePreferences()`, `useUpdatePreferences()`
- Modify `frontend/src/pages/Notifications.tsx` -- Replace mock with real data; mark-read on click
- Modify `frontend/src/pages/Preferences.tsx` -- Wire form to real PATCH endpoint with react-hook-form + Zod
- Modify `frontend/src/components/AppLayout.tsx` -- Bell icon shows real `unreadCount`; poll every 30 seconds
- Create `frontend/src/schemas/preferences.ts` -- Zod schema for preference form validation

#### Testing (Phase 6)

- Unit: `test_notification_service.py` -- preference filtering, batch creation
- Integration: `test_notification_triggers.py` -- approve event -> verify notification created for event creator
- Frontend: `Preferences.test.tsx` -- form validation, submit

---

### PHASE 7: Desktop App (Electron Tray, Notifications, Auto-Start)

**Deliverable:** Electron app runs in system tray, shows native notifications, auto-starts on login, health-checks backend, auto-restarts on crash.

**Pointers addressed:** 3 (continuous-running desktop app), 16d (desktop app)

#### Electron Files to Create/Modify

```
electron/
  main.cjs                          # MODIFY: add tray, notification, auto-start, health check
  preload.cjs                       # MODIFY: expose notification API, tray controls
  tray.cjs                          # NEW: System tray management
  notifications.cjs                 # NEW: Native notification bridge
  updater.cjs                       # NEW: Auto-update logic (electron-updater)
  health.cjs                        # NEW: Backend health monitoring + restart
```

#### Electron main.cjs Changes

```
Key additions to electron/main.cjs:

1. System Tray:
   - Create Tray with EventHub icon
   - Context menu: Show/Hide, Notifications, Preferences, Quit
   - Click tray icon: toggle main window visibility
   - Badge count: show unread notification count

2. Window Behavior:
   - Close button minimizes to tray (don't quit)
   - app.on('before-quit') actually quits
   - BrowserWindow.hide() on close, not destroy

3. Auto-Start:
   - Use electron auto-launch package
   - Configurable via preferences (stored in electron-store)

4. Backend Health Monitor:
   - Every 10 seconds: GET http://127.0.0.1:8000/health
   - If 3 consecutive failures: restart backend child process
   - Show tray icon indicator (green/red)

5. Native Notifications:
   - Poll /notifications/unread-count every 30 seconds
   - If new notifications: show Electron Notification
   - Click notification: open app to relevant page

6. Idle Detection:
   - Use powerMonitor.on('unlock-screen') and 'resume'
   - If user was away > 1 hour AND preferences.notifyOnLogin: show EventHub window
```

#### preload.cjs Additions

```javascript
contextBridge.exposeInMainWorld("electronAPI", {
  isElectron: true,
  apiBase: "http://127.0.0.1:8000",
  // New:
  showNotification: (title, body) => ipcRenderer.invoke("show-notification", title, body),
  onNotificationClick: (callback) => ipcRenderer.on("notification-clicked", callback),
  setAutoStart: (enabled) => ipcRenderer.invoke("set-auto-start", enabled),
  getAutoStart: () => ipcRenderer.invoke("get-auto-start"),
  minimizeToTray: () => ipcRenderer.invoke("minimize-to-tray"),
  setBadgeCount: (count) => ipcRenderer.invoke("set-badge-count", count),
});
```

#### Frontend Changes

- Create `frontend/src/hooks/useElectron.ts` -- detect Electron, wrap `window.electronAPI` calls
- Modify `frontend/src/hooks/useNotifications.ts` -- if Electron, trigger native notification on new items
- Modify `frontend/src/pages/Preferences.tsx` -- add auto-start toggle (only visible in Electron)

#### Dependencies to Add

- Root `package.json`: `electron-store`, `auto-launch`, `electron-updater`

#### Testing (Phase 7)

- Manual: tray icon behavior, notification display, auto-start toggle
- Script: health check restart logic (kill backend manually, verify auto-restart)

---

### PHASE 8: External Integrations (Outlook, Teams, Viva, InfyMe)

**Deliverable:** Real Infosys API proxy working through Zscaler. Calendar add via Outlook. Teams/Viva campaign posting. InfyMe profile data.

**Pointers addressed:** 4 (inhouse integrations), 8 (InfyMe, Viva, Teams, Outlook), 14 (real where possible), 15 (Outlook + Teams trigger points), 16e (Outlook/Teams)

#### Backend Files to Create/Modify

```
backend/app/
  routers/
    proxy.py                         # Proxy endpoints for external Infosys APIs
    master_data.py                   # Units, sub-units with caching
  services/
    infosys_api.py                   # MODIFY: implement all 5 API calls
    cache.py                         # In-memory TTL cache for master data
    integrations/
      outlook_integration.py         # .ics generation + optional MS Graph calendar event
      teams_integration.py           # MODIFY: implement real webhook posting
      viva_integration.py            # MODIFY: implement real Viva API posting
      infyme_integration.py          # MODIFY: implement real InfyMe banner API
```

#### Backend API Endpoints (Phase 8)

| Method | Path | Request | Response | Auth | Role | Page |
|---|---|---|---|---|---|---|
| GET | `/master-data/units` | - | `UnitListResponse` (cached 1hr) | JWT | Any | CreateEvent |
| GET | `/master-data/sub-units` | Query: `unit` | `SubUnitListResponse` (cached 1hr) | JWT | Any | CreateEvent |
| POST | `/proxy/event-search` | EventSearch payload | Proxied LEX response | JWT | Any | Dashboard (optional) |
| GET | `/proxy/user/{wid}` | - | Proxied user view | JWT | admin | AdminPanel |
| GET | `/proxy/employee-info` | - | Proxied InfyMe response | JWT | Any | Profile |

#### Infosys API Proxy Implementation

All external calls go through `infosys_api.py` which uses `httpx.AsyncClient` configured with:
1. Zscaler CA cert trust (see Phase 12 networking section)
2. Session cookie forwarding from the authenticated user
3. Timeout: 10 seconds
4. Retry: 2 attempts with exponential backoff

#### Outlook Integration

Two tiers:
- **Tier 1 (Immediate):** `.ics` file download (already in Phase 4). Works everywhere, no API needed.
- **Tier 2 (If MS Graph available):** Direct calendar event creation via MS Graph API. Requires Azure AD app registration. This is "real where possible."

#### Teams Integration

Two tiers:
- **Tier 1 (Immediate):** Incoming Webhook URL per Teams channel. Organizer configures webhook URL when setting up campaign. Message posted as adaptive card.
- **Tier 2 (If Graph available):** MS Graph API channel message posting. Requires application permissions.

#### Frontend Changes

- Modify `frontend/src/pages/CreateEvent.tsx` -- Unit/sub-unit dropdowns fetched from `/master-data/units` and `/master-data/sub-units`
- Create `frontend/src/hooks/useMasterData.ts` -- `useUnits()`, `useSubUnits(unitName)`
- Modify `frontend/src/pages/Campaigns.tsx` -- Teams channel selector, Viva group selector from real or mock endpoints

#### Testing (Phase 8)

- Unit: `test_infosys_api.py` -- mock external responses, verify parsing
- Integration: `test_proxy_routes.py` -- verify caching, error handling
- Manual: test with real Infosys session cookie on corporate network

---

### PHASE 9: User Preferences and Dashboard Customization

**Deliverable:** Users can fully customize their dashboard view: which event categories appear, calendar view mode, followed groups, notification timing.

**Pointers addressed:** 10 (user chooses dashboard content), 9 (user perspective), 3 (preference-based notifications)

#### Frontend Files to Create

```
frontend/src/
  components/
    DashboardCustomizer.tsx          # Widget reorder/toggle panel
    EventFilterBar.tsx               # Persistent filter bar with saved state
    QuickPreferences.tsx             # Inline preference toggle (on dashboard)
  hooks/
    useDashboardConfig.ts            # Local storage + server sync for dashboard layout
```

#### Dashboard Customization Features

1. **Category Filters:** Based on `preferences.event_types`. Dashboard defaults to showing only preferred categories.
2. **Followed Groups:** Events from followed groups appear prominently.
3. **View Mode:** Grid vs list vs timeline, persisted per user.
4. **Calendar View:** 1 day / 3 days / week, stored in preferences.
5. **Notification Time:** Configured notification delivery windows.
6. **Widget Layout:** Reorderable dashboard sections (stats, live banner, event grid, calendar mini-view).

#### Frontend Changes

- Modify `frontend/src/pages/Dashboard.tsx` -- Load preferences to set default filters; add customizer panel
- Modify `frontend/src/pages/Preferences.tsx` -- All preference fields now save to real backend
- Modify `frontend/src/pages/CalendarPage.tsx` -- Respect default calendar view from preferences

#### Testing (Phase 9)

- Frontend: `DashboardCustomizer.test.tsx` -- toggle categories, verify filter persistence
- E2E: Playwright test for preference save -> dashboard reflects change

---

### PHASE 10: Admin Panel

**Deliverable:** Full admin panel with access matrix management, system logs, app configuration, and monitoring.

**Pointers addressed:** 7 (admin handling feature flow), 6 (governance), 12 (platform_admin role)

#### Backend Files to Create

```
backend/app/
  routers/
    admin.py                         # Admin-only endpoints
  services/
    admin_service.py                 # Access matrix, config, logs
    audit_log.py                     # Audit logging middleware
  models/
    config.py                        # AppConfig model (key-value store)
    audit_log.py                     # AuditLog model
```

#### Backend API Endpoints (Phase 10)

| Method | Path | Request | Response | Auth | Role | Page |
|---|---|---|---|---|---|---|
| GET | `/admin/users` | Query: `search, role, page` | `UserListResponse` with roles | JWT | admin | AdminPanel |
| POST | `/admin/users/{wid}/roles` | `{ role: string }` | 201 | JWT | platform_admin | AdminPanel |
| DELETE | `/admin/users/{wid}/roles/{role}` | - | 204 | JWT | platform_admin | AdminPanel |
| GET | `/admin/access-matrix` | - | Full group-to-organizer mapping | JWT | admin | AdminPanel |
| POST | `/admin/groups/{id}/organizers` | `{ employee_wid }` | 201 | JWT | admin | AdminPanel |
| GET | `/admin/logs` | Query: `action, user, date_from, date_to, page` | `AuditLogListResponse` | JWT | admin | AdminPanel |
| GET | `/admin/config` | - | `AppConfigResponse` | JWT | admin | AdminPanel |
| PATCH | `/admin/config` | `{ key, value }[]` | `AppConfigResponse` | JWT | platform_admin | AdminPanel |
| GET | `/admin/stats` | - | `{ total_users, total_events, total_registrations, ... }` | JWT | admin | AdminPanel |

#### Audit Log Implementation

Middleware that logs every state-changing action:
```
AuditLog: { timestamp, user_wid, action, resource_type, resource_id, details_json }
```

Captured actions: event_created, event_approved, event_rejected, role_assigned, role_removed, config_changed, campaign_sent, registration_created

#### Frontend Changes

- Modify `frontend/src/pages/AdminPanel.tsx` -- Replace all mock data with real API calls
- Create `frontend/src/hooks/useAdmin.ts` -- `useAccessMatrix()`, `useAssignRole()`, `useAuditLogs()`, `useAppConfig()`
- Create `frontend/src/components/admin/AccessMatrixEditor.tsx` -- Table with add/remove organizer per group
- Create `frontend/src/components/admin/AuditLogViewer.tsx` -- Filterable, paginated log viewer
- Create `frontend/src/components/admin/ConfigEditor.tsx` -- Key-value config editor with validation

#### Testing (Phase 10)

- Integration: `test_admin_router.py` -- verify admin-only access, role assignment
- Security: verify non-admin users get 403 on all admin endpoints

---

### PHASE 11: AI/Intelligence Features (Good-to-Have)

**Deliverable:** Smart event recommendations based on user interests, calendar bandwidth, past attendance, and trending events.

**Pointers addressed:** 11 (AI features: calendar bandwidth, interests, learning, past events)

#### Backend Files to Create

```
backend/app/
  routers/
    recommendations.py               # AI recommendation endpoint
  services/
    recommendation_service.py        # Recommendation engine
    analytics_service.py             # User behavior analytics
```

#### Backend API Endpoints (Phase 11)

| Method | Path | Request | Response | Auth | Role | Page |
|---|---|---|---|---|---|---|
| GET | `/recommendations` | - | `RecommendationListResponse` (ranked events) | JWT | Any | Dashboard |
| GET | `/recommendations/trending` | - | `EventListResponse` (most registered this week) | JWT | Any | Dashboard |
| GET | `/analytics/my-history` | - | `{ attended_categories, attendance_rate, topics }` | JWT | Any | Preferences |

#### Recommendation Algorithm

Score each active event for a user:

```
score = (
    0.30 * interest_match       # event_type in user preferences
  + 0.20 * group_match          # event in followed group
  + 0.15 * trending_score       # registration velocity this week
  + 0.15 * calendar_fit         # no overlap with registered events
  + 0.10 * past_attendance      # attended similar category before
  + 0.10 * experience_match     # event difficulty vs user level
)
```

This is a heuristic, not a trained model. For the hackathon this is sufficient. A production version could use a lightweight SLM for natural language interest matching.

#### Frontend Changes

- Create `frontend/src/components/RecommendationPanel.tsx` -- "Recommended for You" section on Dashboard
- Create `frontend/src/components/TrendingEvents.tsx` -- "Trending This Week" section
- Modify `frontend/src/pages/Dashboard.tsx` -- Add recommendation and trending sections above event grid

#### Testing (Phase 11)

- Unit: `test_recommendation_service.py` -- scoring algorithm with known inputs
- Integration: verify recommendations change when preferences change

---

### PHASE 12: Testing, Security, and Production Hardening

**Deliverable:** Full test suite, security hardened, production-ready build.

**Pointers addressed:** All -- this phase hardens everything built in phases 1-11.

#### Security Hardening

1. **JWT:** Short-lived access tokens (15 min) + refresh tokens (7 days). Rotate on each use.
2. **CORS:** Restrict to exact origins, not wildcard.
3. **Rate Limiting:** Add `slowapi` to FastAPI. 100 req/min per user, 10 req/min for auth.
4. **Input Validation:** Pydantic models on every endpoint; SQL injection impossible with SQLAlchemy ORM.
5. **XSS Prevention:** React auto-escapes. CSP headers in Electron.
6. **CSRF:** Not applicable for JWT-based API, but add SameSite cookies if using session auth.
7. **Audit Trail:** Every state change logged (Phase 10).
8. **Secrets Management:** All secrets in environment variables, never in code.

#### Test Files to Create

```
backend/tests/
  conftest.py                        # Shared fixtures: test DB, test client, auth headers
  test_auth.py
  test_events.py
  test_registrations.py
  test_approvals.py
  test_campaigns.py
  test_notifications.py
  test_admin.py
  test_rbac.py                       # Cross-cutting role enforcement tests
  test_workflows.py                  # End-to-end workflow tests

frontend/src/test/
  setup.ts                           # MODIFY: add MSW handlers
  mocks/
    handlers.ts                      # MSW request handlers for all endpoints
    server.ts                        # MSW server setup
  components/
    EventCard.test.tsx
    AppSidebar.test.tsx
  pages/
    Dashboard.test.tsx
    CreateEvent.test.tsx
    ManageEvents.test.tsx

frontend/e2e/
  auth.spec.ts                       # Login flow
  event-lifecycle.spec.ts            # Create -> approve -> register -> attend
  campaign.spec.ts                   # Campaign creation and scheduling
  admin.spec.ts                      # Access matrix management
  preferences.spec.ts                # Preference save and dashboard reflection
```

#### Performance Testing

- Use `locust` for backend load testing: 100 concurrent users, all major endpoints
- Frontend: Lighthouse CI for Core Web Vitals
- Electron: Memory profiling for long-running desktop usage

---

## 3. WORKFLOW DOCUMENTATION

### Workflow 1: Event Proposal -> Approval -> Active

```
Step 1: Speaker opens /create-event
Step 2: Fills event form (title, description, event_type, delivery_method, sessions[])
Step 3: Selects target group (determines which organizer approves)
Step 4: Clicks "Save as Draft" -> POST /events (status=Draft)
Step 5: Clicks "Submit for Approval" -> POST /events/{id}/submit
   - Backend: status changes to "Pending Approval"
   - Backend: ApprovalRequest created (status=Pending)
   - Backend: Notification sent to all organizers of the target group
Step 6: Organizer sees event in /manage-events Pending tab
Step 7a: Organizer clicks "Approve" -> PATCH /approvals/{id} {action:"approve"}
   - Backend: ApprovalRequest.status = Approved
   - Backend: Event.status = Active, Event.approved_by = organizer_wid
   - Backend: Notification sent to event creator ("Your event was approved!")
   - Backend: Notifications sent to users whose preferences match event
Step 7b: Organizer clicks "Reject" -> PATCH /approvals/{id} {action:"reject", comment:"..."}
   - Backend: ApprovalRequest.status = Rejected
   - Backend: Event.status = Rejected
   - Backend: Notification sent to event creator with review comment
Step 7c: Organizer clicks "Request Modification" -> PATCH /approvals/{id} {action:"request_modification", comment:"..."}
   - Backend: ApprovalRequest.status = Modification Requested
   - Backend: Notification sent to event creator with modification details
   - Creator edits event -> re-submits -> new ApprovalRequest created -> back to Step 6
```

### Workflow 2: Registration -> Waitlist -> Attend -> Cancel

```
Step 1: User views /event/{id}
Step 2: Clicks "Register Now" -> POST /events/{id}/register
   - If slots available: status = "registered"
     - Notification: "You're registered for {event.title}"
   - If slots full: status = "waitlisted"
     - Notification: "You're on the waitlist for {event.title}"
Step 3: Calendar add -> GET /events/{id}/calendar.ics -> browser downloads .ics
Step 4a: User attends event
   - Organizer marks attendance -> PATCH /registrations/{id}/attend
   - Status: attended
Step 4b: User cancels -> DELETE /events/{id}/register
   - Status: cancelled
   - If waitlist exists: oldest waitlisted user promoted to "registered"
     - Notification to promoted user: "A spot opened up! You're now registered."
Step 5: Event ends
   - All "registered" (not attended) registrations remain as-is for records
```

### Workflow 3: Campaign Create -> Schedule -> Post -> Track

```
Step 1: Organizer opens /campaigns
Step 2: Clicks "New Campaign"
Step 3: Selects event from dropdown (only Active events they organize)
Step 4: Composes message (rich text)
Step 5: Selects channels:
   - MS Teams channels (from /integrations/teams-channels)
   - Viva Engage groups (from /integrations/viva-groups)
   - InfyMe banner (toggle)
Step 6: Sets schedule date/time
Step 7: Clicks "Schedule" -> POST /campaigns (status=Scheduled)
Step 8: Background scheduler fires at scheduled_at:
   - For each channel: call IntegrationChannel.post()
   - All succeed: status = Posted, posted_at = now()
   - Any fail: status = Failed, failure_reason = error message
Step 9: Organizer sees campaign status in list (Posted/Failed)
Step 10: If Failed: organizer can edit message -> re-schedule
```

### Workflow 4: User Login (SSO) -> Profile Sync -> Role Assignment

```
Step 1: User opens EventHub (Electron app starts, or navigates to web URL)
Step 2: App detects no JWT token in storage
Step 3: Redirect to Infosys SSO login page (or use existing session cookie)
Step 4: SSO returns session cookie
Step 5: Frontend calls POST /auth/login with session cookie
Step 6: Backend:
   a. Calls GET /me/users/view with session cookie (proxied through Zscaler)
   b. Extracts: wid, first_name, last_name, email, job_title, unit_name, etc.
   c. Upserts employee record in DB (create if first login, update if returning)
   d. If first login: assign role ["audience"] by default; create default preferences
   e. Generates JWT with {wid, email, roles[]}
   f. Returns {access_token, user} to frontend
Step 7: Frontend stores JWT in memory (AuthContext) + localStorage (persistence)
Step 8: Frontend calls GET /auth/me to load full profile
Step 9: Sidebar shows menu items based on user's actual roles
Step 10: If user has multiple roles (e.g., audience + speaker): role switcher shown in sidebar footer
```

### Workflow 5: Notification Trigger -> Preference Filter -> Delivery

```
Step 1: Triggering action occurs (event approved, new event active, reminder due, etc.)
Step 2: notification_service.create_notification() called with:
   - trigger_type: "new_event" | "approved" | "rejected" | "reminder" | "registration" | "campaign"
   - event_id
   - target: "creator" | "registered" | "preference_match" | "group_followers" | specific wid
Step 3: Resolve target to list of employee_wids:
   - "creator": [event.created_by]
   - "registered": all registrations for event where status != cancelled
   - "preference_match": query preferences where event_types contains event.event_type
   - "group_followers": query preferences where followed_group_ids contains event.group_id
Step 4: For each target employee, check notification preferences:
   - If notification_frequency = "immediate":
     a. Create Notification record in DB
     b. If user is online (connected to WebSocket or polling): push immediately
     c. If Electron app running: trigger native desktop notification
   - If notification_frequency = "daily_digest":
     a. Queue notification in batch table
     b. Daily digest job runs at user's configured notification_time
     c. Batch creates all queued notifications at once
   - If notification_frequency = "weekly":
     a. Queue notification in weekly batch
Step 5: User opens Notifications page -> GET /notifications -> sees all notifications
Step 6: User clicks notification -> PATCH /notifications/{id}/read -> navigates to event
```

### Workflow 6: Admin Role Assignment -> Group Mapping -> Permission Enforcement

```
Step 1: Platform admin opens /admin/access
Step 2: Sees access matrix: all users with organizer/admin roles, their group mappings
Step 3: Clicks "Add User"
Step 4: Searches employee by name/email (calls /admin/users?search=...)
Step 5: Selects role to assign (organizer, admin)
Step 6: If organizer: selects group(s) to map -> POST /admin/groups/{id}/organizers
Step 7: POST /admin/users/{wid}/roles {role: "organizer"}
   - Backend: inserts into employee_roles table
   - Backend: inserts into group_admins table for each selected group
   - Backend: audit log entry created
Step 8: Notification sent to the user: "You've been assigned the Organizer role for {group.name}"
Step 9: Next time user logs in or refreshes: their JWT reflects new role
Step 10: Enforcement:
   - User's sidebar now shows organizer menu items
   - User can access /manage-events, /campaigns
   - Backend: every organizer endpoint checks group_admins to verify this user is organizer for the relevant group
   - If user tries to approve event for a group they don't manage: 403 Forbidden
Step 11: Admin revokes role -> DELETE /admin/users/{wid}/roles/organizer
   - Backend: removes from employee_roles and group_admins
   - Audit log entry
   - User's next token refresh removes the role
```

---

## 4. API DESIGN -- COMPLETE ENDPOINT CATALOG

### Authentication

| # | Method | Path | Body | Response | Auth | Role | Consumer |
|---|---|---|---|---|---|---|---|
| 1 | POST | `/auth/login` | `{ session_cookie }` | `{ access_token, refresh_token, user }` | None | Any | LoginPage |
| 2 | POST | `/auth/refresh` | `{ refresh_token }` | `{ access_token }` | None | Any | api.ts interceptor |
| 3 | GET | `/auth/me` | - | `Employee` with roles, preferences | JWT | Any | AuthContext |

### Events

| # | Method | Path | Body | Response | Auth | Role | Consumer |
|---|---|---|---|---|---|---|---|
| 4 | GET | `/events` | Query: category, status, date_from, date_to, group_id, search, page, page_size, sort | `{ items: Event[], total, page }` | JWT | Any | Dashboard |
| 5 | POST | `/events` | `{ title, description, event_type, tags[], delivery_method, start_date, end_date, timezone, venue_name, event_url, slots, visibility, group_id, sessions[] }` | `Event` | JWT | speaker+ | CreateEvent |
| 6 | GET | `/events/{id}` | - | `EventDetail` (includes sessions, registration count, user's registration status) | JWT | Any | EventDetail |
| 7 | PATCH | `/events/{id}` | Partial fields | `Event` | JWT | creator/organizer | ManageEvents |
| 8 | DELETE | `/events/{id}` | - | 204 | JWT | creator(draft only)/admin | ManageEvents |
| 9 | POST | `/events/{id}/submit` | `{ note? }` | `ApprovalRequest` | JWT | creator | CreateEvent, MySessions |
| 10 | GET | `/events/my-sessions` | Query: status | `{ items: Event[] }` | JWT | speaker | MySessions |
| 11 | GET | `/events/stats` | - | `{ upcoming, live, registered_by_me, total_active }` | JWT | Any | Dashboard |

### Registrations

| # | Method | Path | Body | Response | Auth | Role | Consumer |
|---|---|---|---|---|---|---|---|
| 12 | POST | `/events/{id}/register` | - | `Registration` | JWT | Any | EventDetail |
| 13 | DELETE | `/events/{id}/register` | - | 204 | JWT | Any | EventDetail |
| 14 | GET | `/registrations/me` | Query: status, date_from, date_to | `{ items: Registration[] }` | JWT | Any | CalendarPage |
| 15 | GET | `/events/{id}/registrations` | Query: status, page | `{ items: RegistrationWithUser[] }` | JWT | organizer+ | ManageEvents |
| 16 | PATCH | `/registrations/{id}/attend` | - | `Registration` | JWT | organizer | ManageEvents |
| 17 | GET | `/events/{id}/calendar.ics` | - | ICS file | JWT | Any | EventDetail |
| 18 | GET | `/registrations/me/calendar.ics` | - | ICS file (all events) | JWT | Any | CalendarPage |

### Approvals

| # | Method | Path | Body | Response | Auth | Role | Consumer |
|---|---|---|---|---|---|---|---|
| 19 | GET | `/approvals` | Query: status, group_id, page | `{ items: ApprovalRequest[] }` | JWT | organizer+ | ManageEvents |
| 20 | PATCH | `/approvals/{id}` | `{ action, comment? }` | `ApprovalRequest` | JWT | organizer(for group) | ManageEvents |
| 21 | GET | `/approvals/my-requests` | - | `{ items: ApprovalRequest[] }` | JWT | speaker | MySessions |

### Groups

| # | Method | Path | Body | Response | Auth | Role | Consumer |
|---|---|---|---|---|---|---|---|
| 22 | GET | `/groups` | Query: org, unit, location, search | `{ items: Group[] }` | JWT | Any | CreateEvent, ManageEvents |
| 23 | POST | `/groups` | `{ name, description, org, geo, unit, subunit, location, dl_emails[] }` | `Group` | JWT | admin | AdminPanel |
| 24 | PATCH | `/groups/{id}` | Partial fields | `Group` | JWT | admin | AdminPanel |
| 25 | POST | `/groups/{id}/admins` | `{ employee_wid }` | 201 | JWT | admin | AdminPanel |
| 26 | DELETE | `/groups/{id}/admins/{wid}` | - | 204 | JWT | admin | AdminPanel |

### Campaigns

| # | Method | Path | Body | Response | Auth | Role | Consumer |
|---|---|---|---|---|---|---|---|
| 27 | GET | `/campaigns` | Query: event_id, status, page | `{ items: Campaign[] }` | JWT | organizer+ | Campaigns |
| 28 | POST | `/campaigns` | `{ event_id, message, teams_channel_ids[], viva_group_ids[], infyme_banner, scheduled_at }` | `Campaign` | JWT | organizer | Campaigns |
| 29 | PATCH | `/campaigns/{id}` | Partial fields | `Campaign` | JWT | organizer | Campaigns |
| 30 | DELETE | `/campaigns/{id}` | - | 204 (draft only) | JWT | organizer | Campaigns |
| 31 | POST | `/campaigns/{id}/send-now` | - | `Campaign` | JWT | organizer | Campaigns |

### Notifications

| # | Method | Path | Body | Response | Auth | Role | Consumer |
|---|---|---|---|---|---|---|---|
| 32 | GET | `/notifications` | Query: is_read, type, page | `{ items: Notification[], total }` | JWT | Any | Notifications |
| 33 | GET | `/notifications/unread-count` | - | `{ count }` | JWT | Any | AppLayout |
| 34 | PATCH | `/notifications/{id}/read` | - | 204 | JWT | Any | Notifications |
| 35 | PATCH | `/notifications/read-all` | - | 204 | JWT | Any | Notifications |

### Preferences

| # | Method | Path | Body | Response | Auth | Role | Consumer |
|---|---|---|---|---|---|---|---|
| 36 | GET | `/preferences` | - | `Preference` | JWT | Any | Preferences |
| 37 | PATCH | `/preferences` | `{ event_types[], interests[], notification_frequency, notification_mechanisms[], notification_times[], notify_on_login, followed_group_ids[] }` | `Preference` | JWT | Any | Preferences |

### Master Data (Proxy)

| # | Method | Path | Body | Response | Auth | Role | Consumer |
|---|---|---|---|---|---|---|---|
| 38 | GET | `/master-data/units` | - | `{ units: string[] }` | JWT | Any | CreateEvent |
| 39 | GET | `/master-data/sub-units` | Query: unit | `{ sub_units: SubUnit[] }` | JWT | Any | CreateEvent |

### Integrations

| # | Method | Path | Body | Response | Auth | Role | Consumer |
|---|---|---|---|---|---|---|---|
| 40 | GET | `/integrations/teams-channels` | - | `{ channels: Channel[] }` | JWT | organizer | Campaigns |
| 41 | GET | `/integrations/viva-groups` | - | `{ groups: VivaGroup[] }` | JWT | organizer | Campaigns |

### Recommendations

| # | Method | Path | Body | Response | Auth | Role | Consumer |
|---|---|---|---|---|---|---|---|
| 42 | GET | `/recommendations` | - | `{ items: Event[] }` (scored, ranked) | JWT | Any | Dashboard |
| 43 | GET | `/recommendations/trending` | - | `{ items: Event[] }` | JWT | Any | Dashboard |

### Admin

| # | Method | Path | Body | Response | Auth | Role | Consumer |
|---|---|---|---|---|---|---|---|
| 44 | GET | `/admin/users` | Query: search, role, page | `{ items: UserWithRoles[] }` | JWT | admin | AdminPanel |
| 45 | POST | `/admin/users/{wid}/roles` | `{ role }` | 201 | JWT | platform_admin | AdminPanel |
| 46 | DELETE | `/admin/users/{wid}/roles/{role}` | - | 204 | JWT | platform_admin | AdminPanel |
| 47 | GET | `/admin/access-matrix` | - | `{ items: GroupWithOrganizers[] }` | JWT | admin | AdminPanel |
| 48 | GET | `/admin/logs` | Query: action, user, date_from, date_to, page | `{ items: AuditLog[] }` | JWT | admin | AdminPanel |
| 49 | GET | `/admin/config` | - | `{ items: ConfigEntry[] }` | JWT | admin | AdminPanel |
| 50 | PATCH | `/admin/config` | `{ entries: {key, value}[] }` | `{ items: ConfigEntry[] }` | JWT | platform_admin | AdminPanel |
| 51 | GET | `/admin/stats` | - | `{ total_users, organizers, events_this_month, pending_approvals }` | JWT | admin | AdminPanel |

### Health

| # | Method | Path | Body | Response | Auth | Role | Consumer |
|---|---|---|---|---|---|---|---|
| 52 | GET | `/health` | - | `{ status, db, uptime, version }` | None | Any | Electron health monitor |

**Total: 52 endpoints**

---

## 5. FRONTEND MIGRATION PLAN

### Step 1: API Service Layer Setup

Create `frontend/src/lib/api.ts`:

```typescript
// Key design decisions:
// 1. Use fetch (not axios) to reduce dependencies
// 2. Base URL detection: window.electronAPI?.apiBase ?? import.meta.env.VITE_API_BASE ?? "http://localhost:8000"
// 3. JWT injection via interceptor pattern
// 4. Automatic refresh token on 401
// 5. Error normalization: all errors become { status, message, details? }
```

Create service modules per domain:
- `frontend/src/services/authService.ts`
- `frontend/src/services/eventService.ts`
- `frontend/src/services/registrationService.ts`
- `frontend/src/services/campaignService.ts`
- `frontend/src/services/notificationService.ts`
- `frontend/src/services/preferenceService.ts`
- `frontend/src/services/adminService.ts`
- `frontend/src/services/masterDataService.ts`

### Step 2: React Query Hooks

Configure `QueryClient` in `App.tsx` with:
```
defaultOptions: {
  queries: { staleTime: 30_000, retry: 1 },
  mutations: { onError: globalErrorHandler }
}
```

Hook naming convention: `use{Entity}` for queries, `use{Action}{Entity}` for mutations.

Hooks per service:
- `useEvents(filters)`, `useEvent(id)`, `useCreateEvent()`, `useUpdateEvent()`, `useDeleteEvent()`
- `useRegister(eventId)`, `useCancelRegistration(eventId)`, `useMyRegistrations()`
- `useApprovals(filters)`, `useApproveEvent()`, `useRejectEvent()`
- `useCampaigns()`, `useCreateCampaign()`, `useSendCampaign()`
- `useNotifications()`, `useUnreadCount()`, `useMarkRead()`, `useMarkAllRead()`
- `usePreferences()`, `useUpdatePreferences()`
- `useUnits()`, `useSubUnits(unit)`

### Step 3: Zod Validation Schemas

Create `frontend/src/schemas/`:
- `event.schema.ts` -- EventCreateSchema, EventUpdateSchema
- `campaign.schema.ts` -- CampaignCreateSchema
- `preferences.schema.ts` -- PreferencesSchema
- `auth.schema.ts` -- LoginSchema

These are used with `@hookform/resolvers/zod` in all form pages.

### Step 4: Page-by-Page Migration

| Page | Current State | Migration Steps |
|---|---|---|
| Dashboard | `mockEvents` import, local filter state | Replace with `useEvents(filters)` + `useEventStats()`; wire category badges to query params |
| EventDetail | `mockEvents.find(id)` | Replace with `useEvent(id)`; wire Register button to `useRegister()`; wire Add to Calendar to .ics download |
| CalendarPage | `mockEvents.filter(isRegistered)`, hardcoded April 2026 | Replace with `useMyRegistrations()`; make date navigable with react-day-picker |
| CreateEvent | No state management, toast on submit | Full react-hook-form + Zod; `useCreateEvent()` mutation; unit/sub-unit dropdowns from `useMasterData()` |
| MySessions | Local mock array | `useMySession()` hook; show approval status from real data |
| ManageEvents | `mockEvents.slice()` tricks | `useApprovals({status})` per tab; real approve/reject with `useApproveEvent()` |
| Campaigns | Local mock array | `useCampaigns()` + `useCreateCampaign()` + campaign form with channel selectors |
| Notifications | Local mock array | `useNotifications()` + mark read on click + real-time unread count |
| Preferences | No persistence | `usePreferences()` load + `useUpdatePreferences()` save; all controls bound to form |
| AdminPanel | All mock data | `useAdmin*()` hooks for each tab; real access matrix, real logs, real config |

### Step 5: Auth Token Injection

In `api.ts`, every request adds:
```
headers: { Authorization: `Bearer ${getToken()}` }
```

Where `getToken()` reads from AuthContext (in-memory) or falls back to localStorage.

On 401 response: attempt token refresh via `/auth/refresh`. If refresh fails: redirect to login.

### Step 6: Error Handling Patterns

- **Network errors:** Toast notification "Connection failed. Retrying..."
- **401:** Silent refresh, retry original request. If refresh fails: redirect to login.
- **403:** Toast "You don't have permission for this action" 
- **404:** Show "Not Found" component inline
- **422 (validation):** Map field errors to react-hook-form `setError()`
- **500:** Toast "Something went wrong. Please try again."

---

## 6. TESTING STRATEGY

### Backend Unit Tests

**Framework:** pytest + pytest-asyncio

**Coverage targets:** 80% line coverage minimum

| Test File | What it Tests |
|---|---|
| `tests/test_auth_service.py` | JWT creation, SSO proxy response parsing, user upsert logic |
| `tests/test_event_service.py` | Status transitions (Draft->Pending->Active->Cancelled), slot validation, date validation |
| `tests/test_registration_service.py` | Slot exhaustion, waitlist promotion, concurrent registration race condition |
| `tests/test_approval_service.py` | Approval state machine, group ownership verification |
| `tests/test_campaign_service.py` | Campaign state machine, scheduling validation |
| `tests/test_notification_service.py` | Preference filtering, batch creation, target resolution |
| `tests/test_recommendation_service.py` | Scoring algorithm correctness |

### Backend Integration Tests

**Framework:** pytest + httpx.AsyncClient + real test PostgreSQL DB

```python
# conftest.py pattern
@pytest.fixture
async def db():
    engine = create_async_engine("postgresql+asyncpg://test:test@localhost/eventhub_test")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
```

| Test File | What it Tests |
|---|---|
| `tests/test_events_router.py` | Full CRUD: create -> read -> update -> delete with real DB |
| `tests/test_registration_flow.py` | Register -> waitlist -> cancel -> promotion with real DB |
| `tests/test_approval_workflow.py` | Create -> submit -> approve -> event becomes Active |
| `tests/test_admin_router.py` | Role assignment, access matrix, config CRUD |
| `tests/test_rbac.py` | Every endpoint tested with every role: audience, speaker, organizer, admin |

### Frontend Unit Tests

**Framework:** Vitest + React Testing Library + MSW (Mock Service Worker)

| Test File | What it Tests |
|---|---|
| `src/test/components/EventCard.test.tsx` | Renders event data correctly, click navigates |
| `src/test/components/AppSidebar.test.tsx` | Shows correct menu items per role |
| `src/test/pages/Dashboard.test.tsx` | Renders with mocked events, filter works |
| `src/test/pages/CreateEvent.test.tsx` | Form validation, submit calls API |
| `src/test/pages/ManageEvents.test.tsx` | Approval actions call correct endpoints |
| `src/test/hooks/useAuth.test.ts` | Token storage, refresh logic, role extraction |
| `src/test/hooks/useEvents.test.ts` | Query key generation, cache invalidation |

### E2E Tests (Playwright)

**Framework:** Playwright (already in `frontend/package.json`)

| Test File | Scenario |
|---|---|
| `e2e/auth.spec.ts` | Login -> verify dashboard loads -> verify user initials in header |
| `e2e/event-lifecycle.spec.ts` | Create event -> submit for approval -> switch to organizer -> approve -> verify Active |
| `e2e/registration.spec.ts` | Register for event -> verify calendar page shows it -> cancel -> verify removed |
| `e2e/campaign.spec.ts` | Create campaign -> schedule -> verify status changes |
| `e2e/preferences.spec.ts` | Change preferences -> verify dashboard filters update |
| `e2e/admin.spec.ts` | Assign organizer role -> verify user can access manage events |

### Security Tests

| Test | What it Verifies |
|---|---|
| RBAC matrix test | Every endpoint tested with unauthorized role returns 403 |
| SQL injection | Pydantic rejects malformed UUIDs, strings with SQL |
| JWT manipulation | Tampered tokens return 401 |
| IDOR | User A cannot access User B's registrations |
| Rate limiting | More than 100 requests/min returns 429 |

### Performance Tests

**Framework:** Locust (backend), Lighthouse CI (frontend)

| Test | Target |
|---|---|
| GET /events (100 concurrent) | p95 < 200ms |
| POST /events/{id}/register (50 concurrent) | No double-registration race condition |
| GET /notifications (100 concurrent) | p95 < 100ms |
| Dashboard load | Lighthouse Performance > 90 |
| Event list (1000 events) | Renders in < 2s |

---

## 7. NETWORKING AND ZSCALER

### Problem

Infosys uses Zscaler Internet Access (ZIA) as a cloud proxy. Zscaler performs TLS inspection (MITM) by replacing upstream TLS certificates with its own CA-signed certificates. This means:
1. Standard HTTPS requests to `lex.infosysapps.com` and `infyme.infosysapps.com` will fail with `CERTIFICATE_VERIFY_FAILED` unless the Zscaler root CA is trusted.
2. Electron's Chromium engine needs to trust the Zscaler CA for loading web content.
3. Python's `httpx`/`requests` needs the Zscaler CA in its certificate bundle.

### Solution: Backend (Python/httpx)

In `backend/app/middleware/proxy_aware.py`:

```python
import httpx
import ssl
import certifi
import os

def get_http_client() -> httpx.AsyncClient:
    """Create Zscaler-aware async HTTP client."""
    # Check for Zscaler CA cert
    zscaler_cert = os.environ.get("ZSCALER_CA_PATH")
    
    if zscaler_cert and os.path.exists(zscaler_cert):
        # Combine system certs + Zscaler CA
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        ssl_context.load_verify_locations(zscaler_cert)
        return httpx.AsyncClient(verify=ssl_context, timeout=10.0)
    
    # Fallback: try system cert store
    return httpx.AsyncClient(verify=True, timeout=10.0)
```

Environment variable `ZSCALER_CA_PATH` points to the exported Zscaler root CA PEM file (typically found at `C:\Users\<user>\AppData\Local\Zscaler\ZscalerRootCA.pem` on Windows or exportable from Keychain on macOS).

### Solution: Electron

In `electron/main.cjs`:

```javascript
// Trust Zscaler CA in Electron's Chromium
app.commandLine.appendSwitch('ignore-certificate-errors', 'false');

// On Windows/macOS, Chromium inherits OS trust store automatically.
// For Linux or if needed explicitly:
if (process.env.ZSCALER_CA_PATH) {
  app.commandLine.appendSwitch('extra-ssl-flags', `--ca-cert-file=${process.env.ZSCALER_CA_PATH}`);
}
```

### Session Management

All 5 Infosys APIs use session-based auth (cookies). The flow:
1. User authenticates via Infosys SSO in browser/Electron
2. Session cookie is captured
3. Frontend sends cookie to backend `/auth/login`
4. Backend stores cookie securely and uses it for all proxied Infosys API calls
5. Backend issues its own JWT for all EventHub API calls
6. If Infosys session expires: backend returns 401 on proxied calls -> frontend re-authenticates

### External API Proxying Architecture

```
Frontend -> EventHub Backend -> Zscaler Proxy -> Infosys APIs
              (JWT auth)          (TLS MITM)      (Session cookie)
```

All external API calls go through `backend/app/services/infosys_api.py`:
- Master data (units, sub-units): cached in-memory with 1-hour TTL
- User profile: called once on login, result stored in employee table
- Employee info: called on-demand, short TTL cache
- Event search: proxied as-is, no caching (real-time results)

### Proxy Detection

At startup, the backend tests connectivity:
```python
async def check_proxy():
    try:
        resp = await client.get("https://lex.infosysapps.com/health")
        return "direct"
    except ssl.SSLCertVerificationError:
        return "zscaler_untrusted"
    except httpx.ConnectError:
        return "no_connectivity"
```

Result is exposed via `GET /health` response: `{ "status": "ok", "proxy": "zscaler", "external_apis": "reachable" }`.

---

## 8. DEPLOYMENT AND PACKAGING

### Electron Builder Setup

Add to root `package.json`:

```json
{
  "build": {
    "appId": "com.infosys.eventhub",
    "productName": "EventHub",
    "directories": {
      "buildResources": "build-resources",
      "output": "release"
    },
    "files": [
      "electron/**/*",
      "frontend/dist/**/*",
      "backend/**/*",
      "!backend/.venv",
      "!backend/__pycache__"
    ],
    "extraResources": [
      {
        "from": "backend/.venv",
        "to": "backend/.venv",
        "filter": ["**/*"]
      }
    ],
    "win": {
      "target": ["nsis"],
      "icon": "build-resources/icon.ico"
    },
    "mac": {
      "target": ["dmg"],
      "icon": "build-resources/icon.icns"
    },
    "nsis": {
      "oneClick": true,
      "perMachine": false,
      "allowToChangeInstallationDirectory": false
    }
  }
}
```

### Build Pipeline

```
Step 1: Frontend build
  cd frontend && npm run build    # outputs to frontend/dist/

Step 2: Backend packaging
  - Bundle Python venv with app (or use PyInstaller for single binary)
  - For enterprise: pre-install Python + venv on target machines via SCCM

Step 3: Electron packaging
  npx electron-builder --win --mac   # produces installers in release/

Step 4: Code signing (Windows)
  - Requires Infosys code signing certificate
  - electron-builder config: win.certificateFile, win.certificatePassword
  - Without signing: Windows SmartScreen will warn users

Step 5: Code signing (macOS)
  - Requires Apple Developer certificate
  - electron-builder config: mac.identity
  - Notarization required for distribution outside App Store
```

### Auto-Update

Use `electron-updater` with a static file server (internal Infosys HTTP server):

```javascript
// electron/updater.cjs
const { autoUpdater } = require("electron-updater");

autoUpdater.setFeedURL({
  provider: "generic",
  url: "https://internal-server.infosys.com/eventhub/releases"
});

// Check on startup and every 4 hours
autoUpdater.checkForUpdatesAndNotify();
setInterval(() => autoUpdater.checkForUpdatesAndNotify(), 4 * 60 * 60 * 1000);
```

Release server directory structure:
```
releases/
  latest.yml          # Points to latest version
  EventHub-1.0.0.exe  # Windows installer
  EventHub-1.0.0.dmg  # macOS installer
```

### Enterprise Distribution

For Infosys internal distribution:
1. **SCCM/Intune:** Package the NSIS installer for automated deployment
2. **Manual:** Share installer on internal SharePoint/file server
3. **Auto-update:** Once installed, app self-updates from internal server
4. **Prerequisites:** Python 3.11+ runtime (bundle with app or require pre-install via SCCM)

### Backend Deployment (Server-Side for Web Access)

For the web version (non-Electron):
1. **PostgreSQL:** Managed instance or Docker container
2. **FastAPI:** Run behind Nginx reverse proxy with Uvicorn workers
3. **Frontend:** Serve built static files from Nginx
4. **SSL:** Internal Infosys CA certificate

```
Nginx -> FastAPI (Uvicorn, 4 workers, port 8000)
      -> Static files (frontend/dist/)
      -> PostgreSQL (port 5432)
```

---

## POINTER COVERAGE MATRIX

| Pointer # | Description | Addressed In |
|---|---|---|
| 1 | Two pillars: Event + Campaign Management | Phase 2 (Events), Phase 5 (Campaigns) |
| 2 | Cool, employee-friendly UI | All phases (existing shadcn/ui foundation) |
| 3 | Continuous-running desktop app with notifications | Phase 7 (Electron), Phase 6 (Notifications) |
| 4 | Open to inhouse integrations | Phase 8 (pluggable integration layer) |
| 5 | Centralized updates (single source of truth) | Phase 1 (DB), Phase 2 (Events CRUD) |
| 6 | Strong internal governance | Phase 3 (approval chains, group hierarchy) |
| 7 | Strong admin handling | Phase 10 (Admin Panel) |
| 8 | Integration points: InfyMe, Viva, Teams | Phase 5 (Campaigns), Phase 8 (Integrations) |
| 9 | User-perspective, user-friendly | Phase 9 (Dashboard customization), all frontend phases |
| 10 | User chooses dashboard content | Phase 9 (Preferences-driven dashboard) |
| 11 | AI features (good-to-have) | Phase 11 (Recommendations) |
| 12 | Robust role-based personas | Phase 1 (Auth), Phase 3 (RBAC enforcement) |
| 13 | Auto-login via SSO | Phase 1 (SSO proxy login) |
| 14 | Real integrations where possible, mock rest | Phase 8 (mock-ready integration layer) |
| 15 | Outlook + Teams trigger points | Phase 4 (Calendar .ics), Phase 5 (Teams campaigns) |
| 16a | Robust personas | Phase 3 |
| 16b | Strong hierarchy | Phase 3 (Group -> Org -> HR) |
| 16c | Governance | Phase 3 (Approval workflow) |
| 16d | Desktop app | Phase 7 |
| 16e | Outlook/Teams | Phase 4, Phase 5, Phase 8 |

---

### Critical Files for Implementation

- `/Users/jayanti/Documents/dev/Event_Hub/backend/main.py` -- Must be restructured into the `app/` module pattern (FastAPI factory, routers, models, services)
- `/Users/jayanti/Documents/dev/Event_Hub/reference_docs/db_design.md` -- Contains the complete PostgreSQL DDL (lines 374-584) that becomes the Alembic initial migration
- `/Users/jayanti/Documents/dev/Event_Hub/frontend/src/contexts/RoleContext.tsx` -- Must be replaced with AuthContext that provides real user data and role-based access
- `/Users/jayanti/Documents/dev/Event_Hub/electron/main.cjs` -- Must be extended with tray, notifications, health monitoring, auto-start, and Zscaler cert handling
- `/Users/jayanti/Documents/dev/Event_Hub/frontend/src/data/mockEvents.ts` -- The interface here defines the current frontend contract; every page imports it and must be migrated to real API types