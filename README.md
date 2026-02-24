# MathDiagnose

AI-powered math diagnostic platform for children ages 5–12.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The home page offers **Parent Login** and **Student Login**. Full auth and dashboards require Supabase.

## Test login credentials

Use these accounts for manual testing after [Supabase setup](#supabase-setup) and [Seed](#seed-create-test-users-and-data):

| Role    | Email                           | Password        |
|---------|----------------------------------|-----------------|
| Parent  | `parent@mathdiagnose.example`   | `TestParent123!`  |
| Student | `student@mathdiagnose.example`  | `TestStudent123!` |

- **Parent** → [Parent Login](http://localhost:3000/login/parent) → Parent dashboard (children, sessions, reports).
- **Student** → [Student Login](http://localhost:3000/login/student) → Student dashboard (progress, take tests by concept).

## Supabase Setup

**Full step-by-step:** [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)

1. Create a [Supabase](https://supabase.com) project.
2. Copy env: `cp .env.local.example .env.local`
3. Set in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` — project URL (Project Settings → API)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon public key (Project Settings → API)
   - `GOOGLE_GEMINI_API_KEY` — for future AI features
4. Run migrations in the Supabase **SQL Editor** (in order):
   - `supabase/migrations/20260223000001_initial_schema.sql`
   - `supabase/migrations/20260223000002_auth_trigger.sql`
   - `supabase/migrations/20260224000001_student_accounts.sql`
5. Create test users and seed data (see **Test credentials** and **Seed** below).

## Test credentials (manual testing)

After running the seed (see **Seed**), you can sign in with:

| Role    | Email                         | Password      | After login        |
|---------|-------------------------------|---------------|--------------------|
| Parent  | `parent@mathdiagnose.example` | `TestParent123!` | Parent dashboard   |
| Student | `student@mathdiagnose.example` | `TestStudent123!` | Student dashboard |

## Seed (create test users and data)

1. In Supabase Dashboard → **Authentication** → **Users**, create two users:
   - **Parent:** email `parent@mathdiagnose.example`, password `TestParent123!`
   - **Student:** email `student@mathdiagnose.example`, password `TestStudent123!`
2. Get their IDs:  
   `SELECT id, email FROM auth.users WHERE email IN ('parent@mathdiagnose.example', 'student@mathdiagnose.example');`
3. Open `supabase/seed.sql`, replace:
   - `PASTE_PARENT_USER_ID_HERE` with the parent user UUID
   - `PASTE_STUDENT_AUTH_USER_ID_HERE` with the student user UUID
4. Run `supabase/seed.sql` in the Supabase SQL Editor.

## Manual test steps

### Parent flow

1. Open [http://localhost:3000](http://localhost:3000).
2. Click **Parent Login**.
3. Sign in with `parent@mathdiagnose.example` / `TestParent123!`.
4. You should land on the **Parent dashboard** (children, recent sessions, “View Report”, “Start Test”).
5. Click **Log out** and confirm you are back on the home page.

### Student flow

1. Open [http://localhost:3000](http://localhost:3000).
2. Click **Student Login**.
3. Sign in with `student@mathdiagnose.example` / `TestStudent123!`.
4. You should land on **My Dashboard** (progress and “Take a test” with concepts).
5. Click **Take test** for a concept (e.g. Addition). Complete the quiz and click **Back to dashboard**.
6. Confirm the new session appears under “Your Progress”.
7. Click **Log out** and confirm you are back on the home page.

### Wrong account type

1. On **Parent Login**, sign in with `student@mathdiagnose.example` / `TestStudent123!`.  
   An error should appear: “This account is not a parent account. Use Student Login instead.”
2. On **Student Login**, sign in with `parent@mathdiagnose.example` / `TestParent123!`.  
   An error should appear: “This account is not a student account. Use Parent Login instead.”

## Demo routes (no login)

- **Parent dashboard (demo):** [http://localhost:3000/parent-demo](http://localhost:3000/parent-demo)
- **Student test (demo):** [http://localhost:3000/student-demo](http://localhost:3000/student-demo)

## Tests

- **Unit / component:** `npm run test`
- **E2E (Playwright):** `npm run test:e2e`  
  First time: run `npx playwright install` to install browsers. E2E starts the dev server and runs all specs. Login flows require Supabase and seeded test users. To run e2e without auth-dependent tests, set `E2E_SKIP_AUTH=1`:

  ```bash
  npx playwright install   # once
  npm run test:e2e
  ```

**If parent/student login shows an env error:** ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (and `GOOGLE_GEMINI_API_KEY`). Copy from `.env.local.example` if needed.

## Deploy to Vercel

1. **Push your code** to GitHub (this repo: `prkshverma09/AiTester`).
2. In [Vercel](https://vercel.com), click **Add New** → **Project** and import the GitHub repo.
3. **Environment variables** (required for the app to run):
   - `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key
   - `GOOGLE_GEMINI_API_KEY` — your Gemini API key  
   Add them in **Settings → Environment Variables** (or during import). Apply to Production, Preview, and Development if you use Vercel previews.
4. **Deploy.** Vercel will run `next build` and deploy. Your Supabase project stays the same; only the app runs on Vercel.

**Note:** Migrations and seed are run against your Supabase project from your machine (or Supabase Dashboard), not from Vercel. `DATABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are only needed for the local setup script, not for the Vercel deployment.

## Learn more

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
