# Supabase setup for MathDiagnose

Follow these steps to connect the app to Supabase and enable Parent / Student login.

**Automated option:** If you have already set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`, add `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` (see step 2 and 3 below), then run:

```bash
npm run setup:supabase
```

This runs migrations, creates the two test users, and seeds the database. Then verify with step 8.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New project**.
3. Choose an organization (or create one).
4. Set:
   - **Name:** e.g. `mathdiagnose` or `AiTester`
   - **Database password:** choose a strong password and **save it** (you need it for DB access).
   - **Region:** pick one close to you.
5. Click **Create new project** and wait for the project to be ready.

---

## 2. Get your project URL and anon key

1. In the Supabase Dashboard, open your project.
2. Go to **Project Settings** (gear icon in the left sidebar).
3. Click **API** in the left menu.
4. Under **Project URL**, copy the URL (e.g. `https://xxxxxxxxxxxx.supabase.co`).
5. Under **Project API keys**, find **anon** **public** and click **Reveal** (or copy). Copy the anon key.

---

## Where to find DATABASE_URL (connection string)

Supabase does **not** put the database connection string under **Project Settings**. You get it from the **Connect** panel:

1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard) (you should see the project overview, not Settings).
2. In the **top bar** of the project, click the **Connect** button (or use the link in the docs: [Connect](https://supabase.com/docs/guides/database/connecting-to-postgres#direct-connection)).
3. In the Connect panel you’ll see connection options:
   - **Direct connection** — `postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres`
   - **Session pooler** — for IPv4 / persistent clients (port 5432)
   - **Transaction pooler** — for serverless (port 6543)
4. Choose **URI** (or the tab that shows the full connection string).
5. Copy the string and replace **`[YOUR-PASSWORD]`** with your **database password** (the one you set when creating the project). If you don’t remember it: **Project Settings** (gear) → **Database** (in the left menu under Configuration, or under a “Database” / “Compute and Disk” area) → **Database password** → Reset database password.
6. Put the final URI in `.env.local` as `DATABASE_URL=...`

If you don’t see **Connect** in the top bar, try going to **Project Settings** → **Database** (scroll the left sidebar; it may be under a different grouping). There you can see or reset your database password and sometimes connection info.

---

## 3. Configure the app (.env.local)

1. In the project root, copy the example env file (if you don’t already have `.env.local`):

   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` and set:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   GOOGLE_GEMINI_API_KEY=your-gemini-api-key
   ```

   Replace:

   - `NEXT_PUBLIC_SUPABASE_URL` with the **Project URL** from step 2.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the **anon public** key from step 2.
   - `GOOGLE_GEMINI_API_KEY` can stay as-is for now unless you use Gemini features.

3. Save the file. Restart the dev server if it’s running (`npm run dev`).

---

## 4. Run database migrations

Migrations create tables and RLS policies. Run them **in this order** in the Supabase SQL Editor.

1. In the Dashboard, go to **SQL Editor**.
2. Click **New query**.
3. For each migration below:
   - Open the file in your repo, copy **all** of its contents, paste into the SQL Editor, then click **Run** (or Cmd/Ctrl+Enter).

**Order:**

| Order | File |
|-------|------|
| 1 | `supabase/migrations/20260223000001_initial_schema.sql` |
| 2 | `supabase/migrations/20260223000002_auth_trigger.sql` |
| 3 | `supabase/migrations/20260224000001_student_accounts.sql` |

You should see “Success. No rows returned” (or similar) for each. If you get an error, check that you ran the previous migrations and that you didn’t skip one.

---

## 5. Create test users (Auth)

1. In the Dashboard, go to **Authentication** → **Users**.
2. Click **Add user** → **Create new user**.
3. **Parent user:**
   - Email: `parent@mathdiagnose.example`
   - Password: `TestParent123!`
   - Click **Create user**.
4. Click **Add user** again and create the **Student user:**
   - Email: `student@mathdiagnose.example`
   - Password: `TestStudent123!`
   - Click **Create user**.

The auth trigger will create a row in `public.parents` for the parent user. The student user will be linked to a student in the next step (seed).

---

## 6. Get user IDs for the seed

1. Go to **SQL Editor** → **New query**.
2. Run:

   ```sql
   SELECT id, email FROM auth.users
   WHERE email IN ('parent@mathdiagnose.example', 'student@mathdiagnose.example');
   ```

3. Copy the **id** (UUID) for each email. You’ll need:
   - Parent **id** → for `PASTE_PARENT_USER_ID_HERE`
   - Student **id** → for `PASTE_STUDENT_AUTH_USER_ID_HERE`

---

## 7. Run the seed script

1. Open `supabase/seed.sql` in your editor.
2. Replace the two placeholders:
   - `PASTE_PARENT_USER_ID_HERE` → parent UUID from step 6.
   - `PASTE_STUDENT_AUTH_USER_ID_HERE` → student UUID from step 6.
3. Copy the **entire** contents of `supabase/seed.sql`.
4. In Supabase **SQL Editor**, paste and click **Run**.

You should see a success notice. The seed creates:

- Rows in `public.parents` (if needed) and `public.students` (Alice, Bob, Charlie).
- A row in `public.student_accounts` linking the student auth user to Alice.
- Sample test sessions and answers so the parent dashboard and student progress have data.

---

## 8. Verify

1. Start the app: `npm run dev`.
2. Open [http://localhost:3000](http://localhost:3000).
3. Click **Parent Login** and sign in with `parent@mathdiagnose.example` / `TestParent123!`. You should land on the Parent dashboard with children and sessions.
4. Log out, then click **Student Login** and sign in with `student@mathdiagnose.example` / `TestStudent123!`. You should see the Student dashboard and “Take a test” for concepts.

If anything fails, check:

- `.env.local` has the correct URL and anon key (no extra spaces).
- All three migrations ran in order.
- Both users exist under **Authentication** → **Users**.
- Seed was run **after** creating the two users and with the correct UUIDs in `seed.sql`.

---

## Quick reference

| Item | Value |
|------|--------|
| Parent login | `parent@mathdiagnose.example` / `TestParent123!` |
| Student login | `student@mathdiagnose.example` / `TestStudent123!` |
| Env vars | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `GOOGLE_GEMINI_API_KEY` |
| Migrations | Run in order: `20260223000001` → `20260223000002` → `20260224000001` |
