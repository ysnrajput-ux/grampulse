# GRAM-PULSE

GRAM-PULSE is a **SIMULATED / DEMO** predictive rural infrastructure digital twin. It combines a vanilla JavaScript dashboard, an Express 5 / TypeScript JSON API, deterministic rule-based calculations, and PostgreSQL-compatible persistence. It is not a trained machine-learning model, government data source, or engineering forecast.

## Technologies and project structure

- Browser UI: existing HTML, CSS, and JavaScript in `public/`.
- API: Express 5 and TypeScript in `server/`, with a plain JavaScript Vercel function adapter in `api/index.js`.
- Shared validation and models: Zod schemas and TypeScript types in `shared/`.
- Database: PostgreSQL schema in `migrations/`; PGlite is the local development option and hosted PostgreSQL is required for shared production use.
- Tests: Node integration tests in `tests/integration.test.ts`; Playwright browser tests in `tests/browser/`.
- `vercel.json`: Vercel function and static frontend routing.

## Prerequisites

Node.js 22.18 or later and npm. For deployment, use a hosted PostgreSQL database. Vercel's temporary filesystem cannot provide persistent database or upload storage.

## Local development

```sh
npm ci
node scripts/setup.mjs
npm run db:migrate
npm run db:seed
npm run build
npm start
```

Visit http://localhost:3000. `scripts/setup.mjs` creates a local `.env` and `LOCAL-CREDENTIALS.txt` with a generated demo password only if `.env` does not already exist. Seeded users are `admin@gram-pulse.demo`, `officer@gram-pulse.demo`, and `citizen@gram-pulse.demo`. Change passwords before using outside a local demo.

For hot-reload API development after setup and migration, use `npm run dev`. Re-run `npm run build` after editing `public/api-client.ts` to refresh its checked-in browser bundle.

## Environment variables

See `.env.example`. For local work, blank `DATABASE_URL` selects PGlite stored under `DATA_DIR`. Vercel refuses that local fallback and requires `DATABASE_URL` for managed PostgreSQL. `SEED_PASSWORD` is required only for initial seeding and must contain at least 12 characters. Never commit `.env` or credentials.

For production, configure `DATABASE_URL`, `NODE_ENV=production`, and the exact public `APP_ORIGIN` in Vercel. Local `DATA_DIR` storage is not persistent on Vercel. See [DEPLOYMENT.md](DEPLOYMENT.md) and the live failure findings in [ROOT-CAUSE.md](ROOT-CAUSE.md).

## Build and checks

```sh
npm run typecheck
npm run lint
npm run build
npm test
```

Browser checks use Playwright and a running app that has been seeded:

```sh
npx playwright install chromium
npm run test:ui
```

The browser test password comes from `SEED_PASSWORD`; set `TEST_BASE_URL` to override the default local URL. These checks do not imply that a live Vercel deployment or external database has been tested.

## Functionality and limits

The app includes role-based sessions, asset/report/incident workflows, a directed RICE-style cascade engine, what-if analysis, and a budget optimizer. Calculations are deterministic rules and carry model limitations in the UI. Seed information is synthetic and marked **SIMULATED / DEMO DATA**.

The local citizen photo upload flow validates, re-encodes, and stores images on local disk. A durable object-storage adapter has not been implemented, so do not enable photo reporting for production on Vercel until storage integration is added. Hosted PostgreSQL is likewise an external requirement, and production connectivity has not been verified here. The supplied schematic map is not an official GIS basemap.
