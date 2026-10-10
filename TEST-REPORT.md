# Verification report

Run locally on 11 October 2026 from the project root.

| Check | Result |
|---|---|
| `npm ci` | Passed; 220 packages installed, npm reported 0 vulnerabilities at install time |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed; builds TypeScript, bundles browser API client, syntax-checks browser JS and Vercel handler |
| `npm test` | Passed: 10 tests, including authentication/RBAC, migration repair, and Vercel missing-database diagnostics |
| `npm run test:ui` with installed Chrome | Passed: 2 browser workflows covering login, navigation, CRUD, simulations, reports, mobile overflow, access control, and retry |
| `npm audit` | Passed: 0 reported vulnerabilities |
| Vercel handler through local HTTP + PGlite | Passed: `/api/health` returned HTTP 200 and ready status |
| Vercel mode without `DATABASE_URL` | Passed: HTTP 503 with `DATABASE_NOT_CONFIGURED` |
| Live `https://grampulse-ten.vercel.app/` check | Not available: Vercel returned HTTP 404 `DEPLOYMENT_NOT_FOUND` |

Hosted PostgreSQL, hosted account seeding, actual Vercel build/deployment, and photo object storage were not tested.
