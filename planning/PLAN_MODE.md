# Plan mode — Event Hub

Use this file when you want **planning before coding**: scope a sprint, resolve contradictions in the docs, or onboard an AI assistant without touching implementation yet.

## What “plan mode” means here

1. **Read first** — Do not write production code until the checklist below is satisfied for the slice you are about to build.
2. **Decide explicitly** — Record open decisions (especially PostgreSQL vs MongoDB and governance vs organizer role) in `planning/SYNTHESIS_AND_GAPS.md` or in your issue/PR description.
3. **Phase-bound** — Align work with **one** phase from `MASTER_IMPLEMENTATION_PLAN.md` unless doing a deliberate spike.

## Required sources (in order)

| Step | Document | Purpose |
| --- | --- | --- |
| 1 | `CONTEXT.md` | PO pointers, routes, mock vs real, stack |
| 2 | `planning/SYNTHESIS_AND_GAPS.md` | Conflicts, gaps, risks |
| 3 | `MASTER_IMPLEMENTATION_PLAN.md` | Phases, endpoints, files to create, tests |
| 4 | `reference_docs/db_design.md` | Tables, CHECK constraints, state machines |
| 5 | `reference_docs/PS.md` | Hackathon must-haves and demo narrative |
| 6 | `reference_docs/apis.json` | Sample external API shapes (non-authoritative) |

## Entry criteria per phase (summary)

| Phase | Deliverable (planning must confirm) |
| --- | --- |
| 1 | DB choice, Alembic strategy, auth shape (JWT + SSO proxy), `app/` layout |
| 2 | Event CRUD scope, pagination/filter contract, TypeScript types vs Pydantic |
| 3 | RBAC matrix, group scoping for approvals, governance role resolution |
| 4 | Registration + waitlist rules, .ics scope (per-event vs aggregate) |
| 5 | Campaign scheduler design, mock vs real integration flags |
| 6 | Notification triggers + preference filtering + polling vs WS |
| 7 | Electron tray/IPC surface, backend health restart behavior |
| 8 | Infosys proxy routes, caching TTLs, Zscaler cert path |
| 9 | Dashboard customization vs preferences API overlap |
| 10 | Admin + audit log schema additions vs existing DDL |
| 11 | Recommendation scoring vs “real” SLM scope |
| 12 | Security checklist, test pyramid, packaging |

## Exit criteria (leave plan mode)

- [ ] Phase goal and **out-of-scope** items are one paragraph or less.
- [ ] Database choice and migration path are stated (no silent drift from team agreement).
- [ ] New or changed **APIs** are named with method + path (or explicitly “no API change”).
- [ ] **Files to touch** are listed (backend `routers/` / `services/`, frontend `pages/` / `hooks/`).
- [ ] **Test** expectation is set (unit / integration / manual).

## Pointer quick map (CONTEXT.md § PO pointers)

Governance, hierarchy, RBAC, desktop notifications, integrations, SSO, and centralized event data are the default **non-negotiables**. Map each sprint item to at least one pointer so scope creep is visible.

## Related canonical paths

- Master phased plan: `MASTER_IMPLEMENTATION_PLAN.md`
- Cross-doc analysis: `planning/SYNTHESIS_AND_GAPS.md`
- DDL: `reference_docs/db_design.md` (PostgreSQL section)

---

*This is a project-local planning aid; it does not replace Cursor’s UI Plan mode but complements it with repo-specific gates.*
