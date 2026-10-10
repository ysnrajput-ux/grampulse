# Deploy GRAM-PULSE on Vercel

## Important production requirements

The checked-in Vercel configuration builds the existing TypeScript/Express API into a Vercel Node function and serves the existing static frontend from `public/`. It includes the SQL migration in the function bundle. No separate Express server is needed. The local PGlite database and local `data/uploads` filesystem are for development only. Vercel function files are temporary and are not a database or durable upload store.

Before using this deployment for real users, provide a hosted PostgreSQL database in `DATABASE_URL`, migrate and seed it once from a trusted local/admin environment, and move private image uploads to durable object storage. The current `/api/uploads` handlers still use local disk, so photo uploads are not production-ready on Vercel. The app currently has no object-storage adapter; do not enable photo reporting for a production deployment until one is implemented. No hosted deployment or production persistence has been verified in this delivery.

## 1. Extract and inspect

Extract `GRAM-PULSE-VERCEL-READY.zip`. Open the `gram-pulse` folder. Its root should contain `package.json`, `vercel.json`, `api/`, `server/`, `shared/`, `migrations/`, `public/`, and this guide.

## 2. Put the project in GitHub

Create a GitHub repository, then from the extracted project folder run:

```sh
git init
git add .
git commit -m "Prepare GRAM-PULSE for Vercel"
git branch -M main
git remote add origin https://github.com/YOUR-NAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the example repository URL with your own. Do not commit `.env`, `LOCAL-CREDENTIALS.txt`, database files, or real credentials.

## 3. Prepare the database

Create a dedicated PostgreSQL database with a provider that permits connections from Vercel. Copy its connection string; keep it private. Set up the schema from a trusted machine with Node.js 22.18 or later:

```sh
npm ci
DATABASE_URL='your-private-postgres-connection-string' npm run db:migrate
```

For a fresh demo dataset, also configure a unique password and run the seed once:

```sh
DATABASE_URL='your-private-postgres-connection-string' SEED_PASSWORD='a-unique-password-at-least-12-characters' npm run db:seed
```

Seed accounts are `admin@gram-pulse.demo`, `officer@gram-pulse.demo`, and `citizen@gram-pulse.demo`. They share the password provided to `SEED_PASSWORD`; change these credentials before real deployment. Seeding only initializes an empty database and does not overwrite existing records.

## 4. Import the repository into Vercel

In Vercel, choose **Add New → Project**, import the GitHub repository, and set **Root Directory** to `gram-pulse` if the extracted folder is inside a parent repository. Use the **Other** framework preset. The repository's `vercel.json` supplies the build command (`npm run build`), static output directory (`public`), API function route, and SPA fallback. Do not add a second conflicting rewrite.

## 5. Set environment variables

Set these in Vercel Project Settings → Environment Variables for Production (and Preview only when a separate test database is configured):

- `DATABASE_URL`: private hosted PostgreSQL connection string. Required. Use SSL settings required by your database provider.
- `NODE_ENV`: `production`.
- `APP_ORIGIN`: for Production, set the exact public origin, such as `https://grampulse-ten.vercel.app`. For Preview deployments, leave it unset or set the matching preview origin; an explicit production origin will correctly reject writes from a different preview host.
- `SEED_PASSWORD`: not required by the running app after database seeding; do not add it unless a controlled seed workflow needs it.
- `DATA_DIR`: not used for durable production storage. Do not point it at a supposed persistent Vercel directory.

`.env.example` lists the local development variables. Never use its blank database value in production.

## 6. Deploy and review the build

Click **Deploy**. If it fails, open the deployment's Build Logs and check for TypeScript errors, missing environment variables, database connectivity, or an incorrect Root Directory. Vercel builds the compiled server under `dist/`; the API function entry is `api/index.js`.

## 7. Verify the deployed application

After deployment, visit `https://YOUR-PROJECT.vercel.app/api/health`. A successful response indicates the API can connect to PostgreSQL and apply the migration. If it returns `DATABASE_NOT_CONFIGURED`, set `DATABASE_URL` in the Vercel project and redeploy. For `SERVICE_INITIALIZATION_FAILED`, open the matching deployment’s Functions logs; the safe internal error detail is logged there. If health returns 200 but login reports no seed data, migrate and seed the configured database once as described above. Then sign in and verify the dashboard, navigation, asset lists, simulation and budget optimizer. Do not treat local-disk citizen photo uploads as durable: the current upload endpoint must be replaced with an object-storage integration before enabling that workflow on Vercel.

## 8. Deploy later changes

Commit and push changes to the connected GitHub branch. Vercel creates a deployment for each push. Review the build result and repeat the health and workflow checks after changes to the API or database schema.

## Hosting boundary

The frontend and Express-compatible API are served by Vercel. PostgreSQL is a separate managed service. Private upload storage is also a separate service and is not yet integrated in this codebase. Do not use embedded PGlite or local files as shared production storage.
