/**
 * =============================================================================
 * EVENT HUB — FRONTEND CORPORATE INTEGRATION MAP (for Copilot / maintainers)
 * =============================================================================
 *
 * Use this file as a static index. Implementation lives in the paths below.
 *
 * | Concern                    | Edit these files / locations                          |
 * |---------------------------|--------------------------------------------------------|
 * | API base URL (remote API)  | `VITE_API_URL` in `.env`; `apiFetch` in `./api.ts`    |
 * | Auth / SSO                 | `AuthContext.tsx` — add SSO redirect or POST `/auth/login/sso` |
 * | Mock SSO (backend flag)    | Backend `INTEGRATION_MOCK_SSO_LOGIN=true`; body uses `mock_sso|...` cookie |
 * | Master data dropdowns      | Create Event page — wire `GET /master-data/units` hooks if missing |
 * | Teams / Viva pickers       | `Campaigns.tsx` — uses `GET /integrations/teams-channels`, `viva-groups` |
 * | Outlook / .ics             | Event detail — download links calling API calendar routes |
 * | Native notifications       | `electron/main.cjs`, `electron/preload.cjs` (not React-only) |
 * | Governance persona UI      | `AuthContext` maps `governance` → organizer menu for campaigns |
 *
 * Backend single source of truth for mocks:
 *   `backend/app/integrations/corporate_stubs.py`
 * Campaign post seam:
 *   `backend/app/services/campaign_delivery.py`
 *
 * Planning: `planning/MASTER_FINAL_PLAN.md`
 * =============================================================================
 */

/** Re-export for tree-shakers — document only; no runtime side effects required. */
export const CORPORATE_INTEGRATION_DOC_VERSION = "1.0.0";
