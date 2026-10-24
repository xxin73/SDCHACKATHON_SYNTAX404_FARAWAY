# Faraway — current Replit website source

This is the complete current Faraway pnpm workspace, including the existing
frontend, Express service, Supabase SQL and Edge Function sources, shared
libraries, assets, animations, and component-preview workspace.

**Preservation rule:** packaging does not redesign, refactor, or replace the
website. The current application source and assets are authoritative.

## Requirements

- Node.js **24** (the version used to validate this snapshot)
- pnpm **10.26.1** (the version used for its lockfile)
- The existing Supabase project for account authentication, saved profiles,
  catalogue data, and Edge Functions

No private credentials, database contents, installed dependencies, or compiled
build outputs are included. Use your own existing credentials locally.

## Repository integration

In `xxin73/SDCHACKATHON_SYNTAX404_FARWAY`, this current snapshot is located at
**`Faraway-Replit/`**. The pre-existing `Faraway/`, submission files, repository
history, GitHub workflows, and hosting configuration are intentionally preserved.
Adding source does **not** change which directory an existing deployment builds.

```sh
git clone https://github.com/xxin73/SDCHACKATHON_SYNTAX404_FARWAY.git
cd SDCHACKATHON_SYNTAX404_FARWAY/Faraway-Replit
pnpm install --frozen-lockfile
```

## Frontend environment and local development

```sh
cp .env.example artifacts/faraway/.env.local
```

Edit that local file with your existing Supabase URL and **publishable** key.
Do not commit it. Vite reads frontend environment files from
`artifacts/faraway/`, not from the workspace root.

Run the following in a POSIX shell:

```sh
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/faraway run dev
```

Open `http://localhost:5173`. `PORT` and `BASE_PATH` must be present in the
process environment because the existing Vite configuration validates them
before reading frontend environment files. On PowerShell:

```powershell
$env:PORT = "5173"
$env:BASE_PATH = "/"
pnpm --filter @workspace/faraway run dev
```

The application uses the same Supabase authentication, persistence, and
recommendation services as the existing site. Configure localhost in Supabase
Auth's allowed redirect URLs and in the Edge Function's allowed origins where
required. Without valid Supabase configuration, the site cannot sign users in
or load their saved account data.

### Optional Express API service

In a second terminal:

```sh
PORT=5000 pnpm --filter @workspace/api-server run dev
```

The existing Express service exposes `/api/healthz`. It is not a replacement for
the Supabase backend. Replit provides path-based routing automatically; outside
Replit, a hosting platform or reverse proxy must route `/api` to this service
if you need both services on the same origin. This package does not change the
website's request URLs or add a development proxy.

### Supabase backend

The `supabase/` directory includes the existing SQL and
`functions/faraway-recommendations/` Edge Function. For the current site, continue
using the already configured project. Packaging does not migrate databases,
export accounts, deploy functions, or change any server-side secrets.

For a separate environment, review the SQL and deployment script first. Do
**not** execute every SQL file blindly: `006_clear_personal_journey.sql` is a
destructive cleanup script, not a required installation step. The catalogue
editor import files are an alternative import procedure, not instructions to
repeat an existing production import.

The Edge Function reads server-only `SUPABASE_URL`, `SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, and `ALLOWED_ORIGINS`. Its existing provider
configuration also supports `AI_PROVIDER`, `GEMINI_API_KEY`, `GEMINI_MODEL`,
`RUNPOD_API_KEY`, `RUNPOD_ENDPOINT_ID`, and `RUNPOD_MODEL`. Set only the provider
configuration your existing deployment uses, through Supabase's secret
management. Never put server-only keys in frontend environment files.

The optional `lib/db` workspace retains its existing `DATABASE_URL` interface.
Do not point it at, migrate, or replace the existing Supabase database merely
to run the frontend.

## Validation and production builds

From this workspace's root:

```sh
pnpm run typecheck
node scripts/run-radar-tests.mjs
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/faraway run build
pnpm --filter @workspace/api-server run build
```

The frontend output is `artifacts/faraway/dist/public/`; the API output is
`artifacts/api-server/dist/`. Generated output is deliberately excluded from
Git. To preview the frontend build locally:

```sh
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/faraway run serve
```

For hosting below a URL prefix, use that prefix consistently as `BASE_PATH`
for both build and serve. Configure the host's SPA fallback to `index.html`
for existing client-side routes. Keep Supabase redirect/origin settings in
sync with the host.

## Source map

| Directory | Contents |
| --- | --- |
| `artifacts/faraway/src/` | Existing website pages, styles, components, data, translations, and interactions |
| `artifacts/faraway/public/` | Existing logos, images, icons, and static evidence |
| `artifacts/api-server/` | Existing Express service |
| `artifacts/mockup-sandbox/` | Existing isolated component-preview workspace |
| `lib/` | Shared API clients, schemas, and database library |
| `supabase/` | Existing SQL, catalogue imports, and Edge Function sources |
| `scripts/` | Existing utilities plus portable packaging/test helpers |

## Packaging and integrity

```sh
node scripts/package-source.mjs /absolute/path/to/new/source-folder
```

The destination must not exist. The packager copies source, configuration,
assets, lockfiles, and documentation; excludes dependencies, output, caches,
chat uploads, agent memory, and local credentials; and rejects common
embedded-secret signatures. It produces `SOURCE-MANIFEST.sha256` for the copied
files. This is a source package, not a database backup or an automatically
published website.

Verify the package's file contents on Linux with:

```sh
sha256sum -c SOURCE-MANIFEST.sha256
```
