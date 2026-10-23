# Connect your individual Faraway account

The editable website is now inside this Git repository, in `Faraway/`.
The original ZIP and the earlier `/workspace/faraway-source/Faraway` folder
are preserved. Make future edits here, not in that old extracted folder.

The existing layout, graphics and individual journey are retained. The email
forms now use a password and real Supabase accounts. Organisation records and
the rules-based explanation engine have not been connected to Supabase or AI.

## 1. Create the tables

1. Open the Supabase Dashboard and choose your project
   (`txsgreryqmxrrpefbfua`).
2. Select **SQL Editor** in the left sidebar, then **New query**.
3. Open `Faraway/supabase/001_personal_auth.sql` from this repository.
   Copy its entire contents into the query editor.
4. Click **Run**. You should see a success result. The script is safe to run
   again; it does not delete existing records.
5. In **Table Editor**, confirm that `personal_profiles` and
   `skill_assessments` exist and have RLS enabled.

You do not need to create a `todos` table. The example supplied with the
Supabase connection instructions was only a sample.

`personal_profiles` holds the user's profile, preferences, learning plan and
progress. `skill_assessments` holds that user's skill ratings. Both use the
authenticated user's ID. Row Level Security permits each user to read, insert,
update and delete only their own row. Anonymous visitors cannot access either
table. The save function writes both rows in one transaction and checks the
account ID again to protect against requests arriving after an account switch.

## 2. Enable email sign-in and confirmation redirects

1. Go to **Authentication > Sign In / Providers** (sometimes labelled
   **Providers**) and check that **Email** and new-user sign-ups are enabled.
2. Keep email confirmation enabled. Faraway displays a check-your-email message
   when confirmation is required, rather than pretending that registration has
   already signed you in.
3. Under **Authentication > URL Configuration**, set the **Site URL** to the
   address where you use Faraway. For the default local development server,
   that is `http://localhost:4173`.
4. Add `http://localhost:4173/` to **Redirect URLs** for local development.
   If you use a hosted site, also add its exact address, including any base
   path and trailing slash. Use the actual address shown in your browser.

## 3. Environment variables and startup

The provided project URL and **publishable** key are already in the ignored
local file `Faraway/artifacts/faraway/.env.local` in this workspace.

For another machine, copy `artifacts/faraway/.env.example` to
`artifacts/faraway/.env.local` from inside `Faraway/`, and fill in:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The publishable key is designed for browser use. Never put a Supabase
service-role key or database password in a `VITE_` variable. Local environment
files are ignored by Git; the example contains only placeholders. Vite reads
these variables at startup/build time, so restart the development server or
rebuild after changes. On a hosting platform, add the same variables to its
build environment.

From `/workspace/faraway-practice/Faraway`:

```sh
export XDG_DATA_HOME=/workspace/.local/share
export XDG_CACHE_HOME=/workspace/.cache
pnpm install --frozen-lockfile --store-dir /workspace/.pnpm-store
pnpm exec tsc --build lib/api-client-react
pnpm dev
```

The XDG/store settings avoid unwritable home-directory folders in this cloud
machine. Node 24 and pnpm 11 were used. pnpm is this project's existing package
manager; do not run the sample `npm install` command in this workspace.

The cloud environment also needs HTTPS access to
`txsgreryqmxrrpefbfua.supabase.co`. That domain and the variable requirements
have been saved to the environment configuration draft. Review and save those
settings, enter the publishable key in the variable field for future sessions,
and publish the environment when you want to retain this configuration. Saving
the draft alone does not apply network changes or publish a snapshot.

## 4. Try the real individual flow

1. Choose **Create account**, enter a name, email and password (at least eight
   characters), and submit.
2. If asked, open the confirmation email, confirm, and return to **Sign in**.
3. Choose **Personal**, complete a profile and rate some skills. Wait for
   **Personal profile and skills saved to your account.**
4. Use the avatar menu's **Sign out** action. This waits for pending saves;
   a save failure keeps you signed in and shows an error.
5. Sign in again, or sign in with that account in a different browser. Your
   profile, ratings and learning progress should be restored.
6. A different account should start with a blank personal journey.

**Explore the demo** remains available and never writes personal records to
Supabase. Existing local demo records are not automatically uploaded. Signed-in
personal records are kept in memory and Supabase, outside the shared demo cache.
Supabase's SDK persists the login session so a page refresh can restore it.
Organisation records still use the original browser-only storage.

If tables are missing or a restore fails, editing is paused to avoid replacing
existing data with a blank profile. Fix the setup, then click **Retry**. If a
save fails, keep the tab open and click **Retry save** after resolving it. Wait
for the saved message before closing; unsaved changes are not a durable offline
backup. Simultaneous edits in multiple tabs/devices use the last completed save.

## 5. Checks and what they prove

```sh
pnpm exec tsc --build lib/api-client-react
pnpm typecheck
pnpm check:logic
pnpm check:auth
pnpm check:browser
pnpm build
```

`check:auth` exercises serialization, stale-account loads, failed-save retries
and validation. It also runs the actual SQL migration in an isolated local
PostgreSQL engine (PGlite), with simulated Supabase auth roles, and verifies
cross-account and anonymous access denial. It does not change your cloud database.

`check:browser` uses Chromium and the real Supabase JavaScript SDK, with
simulated remote responses. It checks account forms, profile/skill saving,
restoration, isolation and failure messages. It starts/stops its own server on
port 4183. Set `CHROMIUM_PATH` if Chromium is elsewhere; this cloud machine uses
`/usr/bin/chromium`. It sends no real confirmation emails and creates no live
accounts. Production output is `dist/`; static hosting must fall back to
`index.html` for application routes.

The live Supabase project, email delivery, hosted redirect URLs and deployed
RLS policies still require the steps above and a real account round trip.
Build warnings about source maps and large chunks do not prevent compilation.
