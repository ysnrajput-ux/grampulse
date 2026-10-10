# GRAM-PULSE architecture and repair audit

## Actual project structure

- Browser frontend: plain HTML, CSS and JavaScript in `public/` (not React).
- API: TypeScript/Express 5 routes in `server/app.ts`, shared Zod validation and types in `shared/`, built into `dist/`.
- Vercel: `api/index.js` adapts the Express app to a Node function; `vercel.json` routes `/api/*` to that handler and serves the static frontend.
- Persistence: PostgreSQL via `pg` when `DATABASE_URL` is configured; embedded PGlite under `DATA_DIR` for local-only development.
- Schema/seed: SQL migration in `migrations/001_initial.sql`; `npm run db:seed` applies migration before idempotent demo seeding.
- Auth: seeded local accounts, scrypt password hashes, HttpOnly session cookie, CSRF token and admin/officer/citizen authorization.

## Confirmed deployment and migration defects

1. The Vercel adapter previously collapsed initialization failures into one generic 503. It now distinguishes missing `DATABASE_URL`, logs a safe internal startup detail, and returns a useful status message.
2. Vercel cannot use the local PGlite directory as shared durable storage. The DB connector now explicitly refuses that fallback in Vercel when `DATABASE_URL` is absent.
3. State-changing requests previously compared browser `Origin` to a localhost default when `APP_ORIGIN` was omitted. The API now derives the expected same-origin from the forwarded request host unless an explicit origin is configured.
4. Migration bootstrap previously treated any `schema_migrations` table as proof that every application table existed. A partially initialized database could therefore reach seed with no `villages` table. Migration now checks the required table set and applies idempotent DDL when pieces are missing. Regression test: `tests/migrations.test.ts`.
5. The earlier `AUDIT.md` text incorrectly described a frontend-only ZIP with no API or database. That description has been replaced with the actual current architecture.

## Auth and service contract

- Browser requests use same-origin relative `/api` paths; no localhost API base URL is hardcoded in the browser.
- Login validates email/password server-side, checks the stored scrypt hash with timing-safe comparison, and sets an HttpOnly/SameSite cookie.
- Mutations require the session CSRF token. Roles protect admin and officer routes. There is no public sign-up route.
- Seeded credentials are not hardcoded in the project. `SEED_PASSWORD` is supplied only during an empty database seed and is not recoverable from its hash.

## Known boundaries

- Live `grampulse-ten.vercel.app` returned `DEPLOYMENT_NOT_FOUND` when checked on 11 October 2026; no live deployment can be claimed from this workspace.
- Production requires a hosted PostgreSQL `DATABASE_URL`, migration and one-time seed. No external database credentials are available here.
- Photo uploads use local disk for local development and return `UPLOAD_STORAGE_NOT_CONFIGURED` on Vercel. Durable private object storage is not implemented.
- Village metrics/assets/reports are marked DEMO/SIMULATED. Rule-based calculations are not trained AI or validated government data.
- `ROOT-CAUSE.md`, `DEPLOYMENT.md`, and `TEST-REPORT.md` contain the detailed findings, setup, and actual verification results.
