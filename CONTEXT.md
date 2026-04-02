# Event Hub — Complete Project Context

> This file provides full context for AI-assisted development (Cursor, Claude Code, Copilot, etc.).
> Read this before making any changes to the codebase.

---

## Product Owner's 16 Core Pointers (MUST READ)

These are the non-negotiable design and architecture priorities. Every implementation decision should align with these:

### Two Pillars
1. **Event Management** — creation, approval, lifecycle, sessions
2. **Campaign Management** — InfyMe banners, Viva Engage, MS Teams channel posts

### Focus Points (Priority Order)
1. **Robust personas** — strong role-based workflows, backend-enforced access control
2. **Strong hierarchy** — unit level, org level, HR governance chains
3. **Stronger governance mechanism** — smooth, robust approval workflows with proper levels
4. **Continuous-running desktop app** — Electron app always running, pushing notifications based on user prefs
5. **Outlook + Teams integration** — add-to-calendar and channel posting are trigger points

### UX Principles
- Cool, easy, employee-friendly UI synced with existing Infosys app look & feel
- Think from **user perspective** — minimize friction
- User has liberty to **choose what appears on their dashboard**
- **Zero registration** — platform auto-fetches employee details and auto-logs them in (SSO)

### Notification System
- Desktop app runs in background continuously
- Push notifications upfront based on user config/preferences
- Notification timing, frequency, and mechanism are all user-configurable

### Governance Architecture
- Internal governance must be smooth, strong, robust
- Proper hierarchy levels: Unit → Org → HR
- Admin should strongly and smoothly handle feature flow
- Every event action respects role hierarchy (enforced at API level, not just UI)

### Integration Strategy
- Open to further inhouse integrations (InfyMe, Viva, MS Teams, Outlook)
- **Centralized updates** — single source of truth for all event data
- Integration points: InfyMe banners (campaigns), Viva Engage (announcements), MS Teams channels (campaigns), Outlook (calendar)
- Integrate what's realistically possible; **mock the rest cleanly** so system runs end-to-end
- Design integration layer to be pluggable for future additions

### AI Features (Good-to-Have)
Intelligent suggestions considering:
- Calendar bandwidth from Outlook — don't disturb work schedule
- User's machine engagement patterns
- Work interests & learning from internal platforms (LEX)
- Past event attendance history
- Trending/must-have events for career development based on experience level
- Current workload — suggest only when bandwidth allows

---

## What Is This?

**Event Hub** is an Infosys-internal platform to centralize event discovery across the organization. It replaces scattered email-based event announcements with a role-aware, notification-driven event management system.

Built as a **desktop + web hybrid** using:
- Electron 33 (desktop shell)
- React 18 + TypeScript + Vite (frontend)
- FastAPI / Python (backend — currently minimal)

---

## User Roles

| Role | Who | Can Do |
|---|---|---|
| `audience` | All employees | Discover events, register, set preferences, add to calendar |
| `speaker` | Proposing employee | Propose events, manage own sessions |
| `organizer` | Group-mapped admin | Create/approve events, manage campaigns |
| `admin` | Platform admin | Full access, logs, config, access matrix |

Role is stored in `RoleContext` (`frontend/src/contexts/RoleContext.tsx`). Default: `audience`.

---

## Project Structure

```
Event_Hub/
├── package.json              # Root workspace — runs Electron + Vite concurrently
├── frontend/                 # React app (TypeScript, Vite, Tailwind, shadcn/ui)
│   └── src/
│       ├── App.tsx           # Router (BrowserRouter or HashRouter for Electron)
│       ├── contexts/RoleContext.tsx
│       ├── data/mockEvents.ts
│       ├── components/
│       │   ├── AppLayout.tsx
│       │   ├── AppSidebar.tsx
│       │   ├── EventCard.tsx
│       │   └── ui/           # shadcn components
│       └── pages/
│           ├── Dashboard.tsx
│           ├── EventDetail.tsx
│           ├── CalendarPage.tsx
│           ├── CreateEvent.tsx
│           ├── Preferences.tsx
│           ├── Notifications.tsx
│           ├── ManageEvents.tsx
│           ├── MySessions.tsx
│           ├── Campaigns.tsx
│           └── AdminPanel.tsx
├── backend/
│   ├── main.py               # FastAPI app — CORS + GET /health only
│   └── requirements.txt      # fastapi, uvicorn
├── electron/
│   ├── main.cjs              # Spawns backend, opens BrowserWindow
│   └── preload.cjs
└── reference_docs/
    ├── PS.md                 # Product Statement
    └── db_design.md          # Full DB schema (SQL + MongoDB)
```

---

## Frontend Routes

| Path | Page | Role |
|---|---|---|
| `/` | Dashboard — event grid, category filter, live banner | All |
| `/event/:id` | Event detail, register, add to calendar | All |
| `/calendar` | Month calendar view with registered events | All |
| `/create-event` | Propose new event (multi-session form) | Speaker |
| `/preferences` | Interest & notification preferences | All |
| `/notifications` | Notification center | All |
| `/manage-events` | Approve/reject/manage events | Organizer |
| `/my-sessions` | Speaker's sessions & approval status | Speaker |
| `/campaigns` | Schedule MS Teams / Viva Engage campaigns | Organizer |
| `/admin/access` `/admin/logs` `/admin/config` | Admin panel | Admin |

---

## Frontend Tech Stack

| Concern | Library |
|---|---|
| Framework | React 18.3.1 + TypeScript 5.8.3 |
| Build | Vite 5.4.19 + React SWC |
| Styling | Tailwind CSS 3.4.17 |
| Components | shadcn/ui + Radix UI |
| Routing | React Router DOM 6.30.1 |
| Server state | TanStack React Query 5.83.0 |
| Forms | React Hook Form 7.61.1 + Zod 3.25.76 |
| Icons | Lucide React |
| Toasts | Sonner |
| Dev port | 8080 |

---

## Backend Tech Stack

| Concern | Detail |
|---|---|
| Framework | FastAPI >= 0.115.0 |
| Server | Uvicorn >= 0.32.0 |
| Language | Python |
| Dev port | 8000 |
| DB | Not yet connected |
| Auth | Not yet implemented |
| Routes | GET /health only |

**CORS allowed:** `localhost:8080`, `127.0.0.1:8080`, `[::1]:8080`

---

## Data Model (Summary)

### Core Entities
- **Employee** — wid (UUID), roles[], preferences{}, org hierarchy fields
- **Event** — UUID, title, eventType, delivery_method, status, sessions[], stats{}
- **Session** — topic, speaker info, startDatetime, duration — embedded in Event (MongoDB)
- **Registration** — employee ↔ event, status: registered/waitlisted/cancelled/attended
- **ApprovalRequest** — event approval audit trail, status: Pending/Approved/Rejected/Modification Requested
- **Campaign** — Teams/Viva Engage post scheduling, status: Draft/Scheduled/Posted/Failed
- **Notification** — per-user, type: new_event/reminder/approved/rejected/campaign/registration
- **Group** — org chapter/community, maps organizers to events

### Event Status Flow
`Draft → Pending Approval → Active → Cancelled`
`Pending Approval → Rejected`

### Registration Status Flow
`registered → attended | cancelled`
`waitlisted → registered (when slot opens) | cancelled`

### DB Recommendation
- **MongoDB** (hackathon): Atlas free tier, sessions embedded in Event, roles embedded in Employee
- **PostgreSQL** (production): strong FK constraints, audit trail

---

## External APIs (Infosys Internal)

All use session-based auth (cookies). CORS configured for localhost:8080.

| API | URL | Use |
|---|---|---|
| Get Units | `POST lex.infosysapps.com/.../get/unit` | Unit dropdown |
| Get Sub-Units | `POST lex.infosysapps.com/.../get/sub_unit` | Sub-unit cascade dropdown |
| Event Search | `POST lex.infosysapps.com/.../event-search` | Event discovery + filtering |
| Current User | `GET lex.infosysapps.com/.../me/users/view` | Auto-populate user profile on login |
| Employee Info | `GET infyme.infosysapps.com/.../GetEmployeeOfficialInfoNew` | Extended org details |

Cache unit/sub-unit responses with 1-hour TTL.

---

## What's Mock vs Real

| Feature | Status |
|---|---|
| Event listing | Mock (`mockEvents.ts`) |
| User profile | Mock (hardcoded "JD" avatar) |
| Role switching | Mock (RoleContext dropdown) |
| Registration | Mock (no API) |
| Notifications | Mock |
| Campaigns | Mock |
| Admin data | Mock |
| Health endpoint | Real (`GET /health`) |

**Everything needs to be wired to real backend APIs.**

---

## EventData Interface (mockEvents.ts)

```typescript
interface EventData {
  id: string
  title: string
  description: string
  date: string             // "YYYY-MM-DD"
  time: string             // "HH:MM AM/PM"
  duration: string
  category: "tech" | "domain" | "health" | "fun" | "product"
  location: string
  speaker: { name: string; title: string; avatar: string }
  attendees: number
  maxAttendees: number
  status: "upcoming" | "live" | "completed" | "draft" | "pending"
  tags: string[]
  isRegistered?: boolean
}
```

---

## What Needs to Be Built

### Backend (Priority Order)
1. DB connection (MongoDB or PostgreSQL)
2. Employee sync from `GET /me/users/view` Infosys API
3. Auth middleware (session/JWT)
4. Events CRUD (`GET /events`, `POST /events`, `GET /events/:id`, `PATCH`, `DELETE`)
5. Sessions management
6. Registrations (`POST /events/:id/register`, `DELETE`, waitlist handling)
7. Approval workflow (`POST /events/:id/submit`, `PATCH /approvals/:id`)
8. Notifications (`GET /notifications`, `PATCH /notifications/read`)
9. Preferences (`GET /preferences`, `PATCH /preferences`)
10. Campaigns (Teams/Viva Engage integration)
11. Master data proxy with caching (units, sub-units)
12. Admin APIs (access matrix, logs, config)

### Frontend (Priority Order)
1. Replace mock data with `useQuery` hooks pointing to real backend
2. Real auth flow (SSO redirect or token handling)
3. Real user profile display
4. Notification polling or WebSocket
5. Outlook calendar export (.ics or MS Graph API)
6. Campaign scheduling to Teams / Viva Engage
7. Venue clash / slot validation
8. AI/SLM suggestions panel

---

## Dev Setup

```bash
# Install dependencies
npm install
cd frontend && npm install

# Setup Python backend
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# Run (Electron + Vite + FastAPI concurrently)
npm run dev

# Frontend only
cd frontend && npm run dev  # → http://localhost:8080

# Backend only
cd backend && uvicorn main:app --reload --port 8000
```

---

## Design Principles (from PS.md evaluation criteria)

1. **Modularity & Extensibility** (30% weight) — keep concerns separated, easy to add new event types/integrations
2. **Innovative Technology** (20%) — consider SLM for suggestions, smart notifications
3. **Simplicity** (10%) — don't over-engineer, ship working features
4. **UX** (10%) — role-based views, minimal clicks to register/propose
