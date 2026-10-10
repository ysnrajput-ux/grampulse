# Current validation status

The current validation commands and results are maintained in `TEST-REPORT.md`.

Latest local checks on 11 October 2026:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm test`: 10 tests passed, including authentication/RBAC, schema repair, and Vercel missing-database diagnostics.
- `npm audit`: 0 vulnerabilities reported.
- Playwright: 2 browser workflows passed using installed Chrome.
- The original live URL `https://grampulse-ten.vercel.app/` returned Vercel `DEPLOYMENT_NOT_FOUND`; live login and hosted PostgreSQL are not verified.

To reproduce local checks, see `README.md`. Browser tests require a seeded local database, configured `SEED_PASSWORD`, and a locally installed Chromium/Chrome browser.
