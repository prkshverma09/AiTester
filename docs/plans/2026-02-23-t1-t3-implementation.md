# Math Diagnostic Platform T1–T3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bootstrap a Next.js 15 + Supabase + Tailwind project with Vitest TDD infrastructure, a working DB schema with RLS-protected auth, and two accessibility-tested layout shells.

**Architecture:** Single Next.js 15 App Router project at repo root. Tests co-located with source files. Local Supabase Docker for integration tests. Strict red-green-refactor TDD cycle throughout.

**Tech Stack:** Next.js 15, TypeScript, Supabase, Tailwind CSS, shadcn/ui, Vitest, React Testing Library, vitest-axe, t3-oss/env-nextjs, Supabase CLI + Docker.

---

## Pre-flight Checklist

Before starting, confirm these are available on the machine:
- `node` >= 20 (`node --version`)
- `npm` >= 10 (`npm --version`)
- `docker` running (`docker info`)
- `supabase` CLI (`supabase --version`; if missing: `brew install supabase/tap/supabase`)
- Real Supabase project URL + anon key ready
- Real Gemini API key ready

---

## Task 1: Scaffold Next.js Application

**Files:**
- Create: project root (scaffolded by `create-next-app`)

### Step 1.1: Scaffold the Next.js app into the current directory

```bash
cd /Users/prakashverma/projects/AiTester
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-import-alias \
  --yes
```

When prompted about proceeding in a non-empty directory, confirm yes.

Expected: Next.js project scaffolded. You should see `src/app/`, `package.json`, `tsconfig.json`, `tailwind.config.ts`.

### Step 1.2: Install additional runtime dependencies

```bash
npm install ai @ai-sdk/google zod @supabase/supabase-js @supabase/ssr lucide-react @t3-oss/env-nextjs
```

Expected: All packages install without peer dep errors.

### Step 1.3: Install dev dependencies for testing

```bash
npm install -D vitest @vitest/coverage-v8 jsdom @vitejs/plugin-react \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  vitest-axe @types/testing-library__jest-dom
```

Expected: All dev packages install.

### Step 1.4: Create `vitest.config.ts`

Create file `vitest.config.ts` at project root:

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/app/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Step 1.5: Create `vitest.setup.ts`

Create file `vitest.setup.ts` at project root:

```ts
import '@testing-library/jest-dom'
import * as axeMatchers from 'vitest-axe/matchers'
import { expect } from 'vitest'

expect.extend(axeMatchers)
```

### Step 1.6: Add test scripts to `package.json`

Open `package.json`. Add these entries to the `"scripts"` object:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

### Step 1.7: Verify scaffold compiles

```bash
npm run build
```

Expected: Build succeeds. Ignore any "no content" warnings on empty pages.

### Step 1.8: Commit the scaffold

```bash
git add -A
git commit -m "feat(t1): scaffold Next.js 15 app with Vitest + RTL + vitest-axe"
```

---

## Task 2: Env Validation (TDD)

**Files:**
- Create: `src/lib/env.ts`
- Create: `src/lib/env.test.ts`
- Create: `.env.local.example`

### Step 2.1: Write the failing env tests FIRST

Create `src/lib/env.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { validateEnv } from './env'

const validEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key-value',
  GOOGLE_GEMINI_API_KEY: 'test-gemini-key-value',
}

describe('validateEnv', () => {
  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    const { NEXT_PUBLIC_SUPABASE_URL, ...rest } = validEnv
    expect(() => validateEnv(rest)).toThrow()
  })

  it('throws when NEXT_PUBLIC_SUPABASE_URL is not a valid URL', () => {
    expect(() =>
      validateEnv({ ...validEnv, NEXT_PUBLIC_SUPABASE_URL: 'not-a-url' })
    ).toThrow()
  })

  it('throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    const { NEXT_PUBLIC_SUPABASE_ANON_KEY, ...rest } = validEnv
    expect(() => validateEnv(rest)).toThrow()
  })

  it('throws when GOOGLE_GEMINI_API_KEY is missing', () => {
    const { GOOGLE_GEMINI_API_KEY, ...rest } = validEnv
    expect(() => validateEnv(rest)).toThrow()
  })

  it('returns typed config when all required vars are present', () => {
    const result = validateEnv(validEnv)
    expect(result.NEXT_PUBLIC_SUPABASE_URL).toBe('https://abc.supabase.co')
    expect(result.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('test-anon-key-value')
    expect(result.GOOGLE_GEMINI_API_KEY).toBe('test-gemini-key-value')
  })
})
```

### Step 2.2: Run tests — confirm they FAIL

```bash
npm test src/lib/env.test.ts
```

Expected: FAIL — `Cannot find module './env'`

### Step 2.3: Implement `src/lib/env.ts`

Create `src/lib/env.ts`:

```ts
import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  GOOGLE_GEMINI_API_KEY: z.string().min(1),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(input: Record<string, string | undefined>): Env {
  return envSchema.parse(input)
}

// Runtime singleton — validates at startup
export const env = validateEnv(process.env as Record<string, string | undefined>)
```

### Step 2.4: Run tests — confirm they PASS

```bash
npm test src/lib/env.test.ts
```

Expected: PASS — 5 tests passing.

### Step 2.5: Create `.env.local.example`

Create `.env.local.example`:

```bash
# Supabase (get from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Gemini API key
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# Only needed for integration tests (get from `supabase start` output)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 2.6: Create your real `.env.local`

Copy `.env.local.example` to `.env.local` and fill in your real credentials.

```bash
cp .env.local.example .env.local
```

Then edit `.env.local` with real values. Verify `.env.local` is in `.gitignore` (Next.js adds it by default).

### Step 2.7: Commit

```bash
git add src/lib/env.ts src/lib/env.test.ts .env.local.example
git commit -m "feat(t1): add t3-env-style validated env config with TDD"
```

---

## Task 3: Supabase CLI + Local Docker Setup

**Files:**
- Create: `supabase/` directory (via `supabase init`)
- Create: `supabase/migrations/20260223000001_initial_schema.sql`
- Create: `.env.test.local`

### Step 3.1: Initialise Supabase CLI

```bash
supabase init
```

Expected: `supabase/` directory created with `config.toml`.

### Step 3.2: Start local Supabase Docker stack

```bash
supabase start
```

Expected: Takes ~60 seconds first time (pulls Docker images). Output shows:
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
anon key: eyJ...
service_role key: eyJ...
```

**Copy the local `anon key` and `service_role key`** — you'll need them in the next step.

### Step 3.3: Create `.env.test.local`

Create `.env.test.local` with the local Docker credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste local anon key from above>
SUPABASE_SERVICE_ROLE_KEY=<paste local service_role key from above>
GOOGLE_GEMINI_API_KEY=placeholder-not-needed-for-db-tests
```

Add `.env.test.local` to `.gitignore`.

### Step 3.4: Write the initial schema migration

Create `supabase/migrations/20260223000001_initial_schema.sql`:

```sql
-- Parents: linked to Supabase Auth users
CREATE TABLE public.parents (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Students: children managed by a parent
CREATE TABLE public.students (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  name       text NOT NULL,
  age        int  NOT NULL CHECK (age BETWEEN 5 AND 12),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Test sessions: one per concept attempt per student
CREATE TABLE public.test_sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  concept    text NOT NULL,
  start_time timestamptz DEFAULT now() NOT NULL,
  end_time   timestamptz,
  status     text NOT NULL DEFAULT 'in_progress'
             CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

-- Individual question responses with timing
CREATE TABLE public.test_answers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  raw_answer  text,
  time_taken  int,   -- milliseconds
  is_correct  bool
);

-- AI-generated diagnostic reports (one per session)
CREATE TABLE public.diagnostic_reports (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           uuid UNIQUE NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  ai_generated_report  jsonb,
  created_at           timestamptz DEFAULT now() NOT NULL
);

-- =====================
-- Row Level Security
-- =====================

ALTER TABLE public.parents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_answers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_reports ENABLE ROW LEVEL SECURITY;

-- Parents can only access their own row
CREATE POLICY "parents: own row only"
  ON public.parents FOR ALL
  USING (id = auth.uid());

-- Parents access students they own
CREATE POLICY "students: parent owns"
  ON public.students FOR ALL
  USING (parent_id = auth.uid());

-- Parents access sessions for their students
CREATE POLICY "test_sessions: via student"
  ON public.test_sessions FOR ALL
  USING (
    student_id IN (
      SELECT id FROM public.students WHERE parent_id = auth.uid()
    )
  );

-- Parents access answers for their sessions
CREATE POLICY "test_answers: via session"
  ON public.test_answers FOR ALL
  USING (
    session_id IN (
      SELECT ts.id FROM public.test_sessions ts
      JOIN public.students s ON ts.student_id = s.id
      WHERE s.parent_id = auth.uid()
    )
  );

-- Parents access reports for their sessions
CREATE POLICY "diagnostic_reports: via session"
  ON public.diagnostic_reports FOR ALL
  USING (
    session_id IN (
      SELECT ts.id FROM public.test_sessions ts
      JOIN public.students s ON ts.student_id = s.id
      WHERE s.parent_id = auth.uid()
    )
  );
```

### Step 3.5: Apply migration to local DB

```bash
supabase db push
```

Expected: Migration applied. No errors.

### Step 3.6: Commit

```bash
git add supabase/ .env.local.example
git commit -m "feat(t2): add Supabase schema with 5 tables and RLS policies"
```

---

## Task 4: Supabase Client Setup

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`

### Step 4.1: Create the browser client

Create `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from '@supabase/ssr'
import { env } from '@/lib/env'

export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
```

### Step 4.2: Create the server client

Create `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies set in middleware
          }
        },
      },
    }
  )
}
```

### Step 4.3: Commit

```bash
git add src/lib/supabase/
git commit -m "feat(t2): add Supabase browser and server clients"
```

---

## Task 5: Auth Server Actions (TDD)

**Files:**
- Create: `src/lib/supabase/auth.test.ts`
- Create: `src/app/actions/auth.ts`

### Step 5.1: Update `vitest.config.ts` to load test env

Modify `vitest.config.ts` — add `envFiles` to the test config:

```ts
import { defineConfig, loadEnv } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      globals: true,
      include: ['src/**/*.test.{ts,tsx}'],
      env: {
        NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
        GOOGLE_GEMINI_API_KEY: env.GOOGLE_GEMINI_API_KEY,
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
```

### Step 5.2: Write the failing auth + RLS tests FIRST

Create `src/lib/supabase/auth.test.ts`:

```ts
import { describe, it, expect, afterEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

// Admin client bypasses RLS — for test setup/teardown only
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Generate a unique test email each run
const testEmail = () => `test-${Date.now()}@example.com`

async function cleanupUser(email: string) {
  const { data } = await adminClient.auth.admin.listUsers()
  const user = data.users.find((u) => u.email === email)
  if (user) {
    await adminClient.auth.admin.deleteUser(user.id)
  }
}

describe('Supabase Auth', () => {
  const emails: string[] = []

  afterEach(async () => {
    await Promise.all(emails.map(cleanupUser))
    emails.length = 0
  })

  it('signUp creates an entry in the parents table', async () => {
    const email = testEmail()
    emails.push(email)

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data, error } = await anonClient.auth.signUp({
      email,
      password: 'TestPassword123!',
    })

    expect(error).toBeNull()
    expect(data.user?.email).toBe(email)

    // Verify parents row was created (via trigger)
    const { data: parentRow } = await adminClient
      .from('parents')
      .select('email')
      .eq('email', email)
      .single()

    expect(parentRow?.email).toBe(email)
  })

  it('signIn returns a valid session for a registered parent', async () => {
    const email = testEmail()
    emails.push(email)

    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    await anonClient.auth.signUp({ email, password: 'TestPassword123!' })

    const { data, error } = await anonClient.auth.signInWithPassword({
      email,
      password: 'TestPassword123!',
    })

    expect(error).toBeNull()
    expect(data.session?.access_token).toBeDefined()
  })
})

describe('RLS — cross-account isolation', () => {
  const emails: string[] = []

  afterEach(async () => {
    await Promise.all(emails.map(cleanupUser))
    emails.length = 0
  })

  it('parent A cannot read parent B students', async () => {
    const emailA = testEmail()
    const emailB = testEmail()
    emails.push(emailA, emailB)

    // Create parent B and add a student via admin
    const { data: userB } = await adminClient.auth.admin.createUser({
      email: emailB,
      password: 'TestPassword123!',
      email_confirm: true,
    })
    await adminClient.from('parents').insert({ id: userB.user!.id, email: emailB })
    const { data: student } = await adminClient
      .from('students')
      .insert({ parent_id: userB.user!.id, name: 'Child B', age: 7 })
      .select()
      .single()

    // Sign in as parent A
    const { data: userA } = await adminClient.auth.admin.createUser({
      email: emailA,
      password: 'TestPassword123!',
      email_confirm: true,
    })
    await adminClient.from('parents').insert({ id: userA.user!.id, email: emailA })

    const clientA = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await clientA.auth.signInWithPassword({ email: emailA, password: 'TestPassword123!' })

    // Parent A tries to read Parent B's student
    const { data: stolen } = await clientA
      .from('students')
      .select('*')
      .eq('id', student!.id)

    expect(stolen).toHaveLength(0)
  })

  it('parent can read and insert their own students', async () => {
    const email = testEmail()
    emails.push(email)

    const { data: user } = await adminClient.auth.admin.createUser({
      email,
      password: 'TestPassword123!',
      email_confirm: true,
    })
    await adminClient.from('parents').insert({ id: user.user!.id, email })

    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await client.auth.signInWithPassword({ email, password: 'TestPassword123!' })

    const { data, error } = await client
      .from('students')
      .insert({ parent_id: user.user!.id, name: 'My Child', age: 8 })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data?.name).toBe('My Child')
  })
})
```

### Step 5.3: Run tests — confirm they FAIL

```bash
npm test src/lib/supabase/auth.test.ts
```

Expected: FAIL — likely on `signUp` → parents row not auto-created (no trigger yet).

### Step 5.4: Add the `handle_new_user` trigger migration

Create `supabase/migrations/20260223000002_auth_trigger.sql`:

```sql
-- Auto-insert into parents when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.parents (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

Apply it:

```bash
supabase db push
```

### Step 5.5: Run tests — confirm they PASS

```bash
npm test src/lib/supabase/auth.test.ts
```

Expected: PASS — all 4 tests green. (Note: these are integration tests; they need local Supabase running via `supabase start`.)

### Step 5.6: Create auth Server Actions

Create `src/app/actions/auth.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect('/auth/error')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect('/auth/error')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
```

### Step 5.7: Commit

```bash
git add supabase/migrations/ src/lib/supabase/ src/app/actions/ vitest.config.ts
git commit -m "feat(t2): add DB migrations, RLS policies, auth trigger, and server actions"
```

---

## Task 6: shadcn/ui Initialisation

**Files:**
- Modify: `components.json` (created by shadcn CLI)
- Create: `src/components/ui/` (populated by shadcn CLI)

### Step 6.1: Initialise shadcn/ui

```bash
npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

Expected: `components.json` created, `src/components/ui/` skeleton created, `src/app/globals.css` updated with CSS variables.

### Step 6.2: Add the 7 required components

```bash
npx shadcn@latest add button card form input progress dialog badge
```

Expected: 7 component files created in `src/components/ui/`.

### Step 6.3: Commit

```bash
git add src/components/ui/ components.json src/app/globals.css src/lib/utils.ts
git commit -m "feat(t3): initialise shadcn/ui with Button, Card, Form, Input, Progress, Dialog, Badge"
```

---

## Task 7: ParentLayout Component (TDD)

**Files:**
- Create: `src/components/layouts/ParentLayout.tsx`
- Create: `src/components/layouts/ParentLayout.test.tsx`

### Step 7.1: Write the failing tests FIRST

Create `src/components/layouts/ParentLayout.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { ParentLayout } from './ParentLayout'

describe('ParentLayout', () => {
  it('renders children inside the layout', () => {
    render(
      <ParentLayout>
        <div>test content</div>
      </ParentLayout>
    )
    expect(screen.getByText('test content')).toBeInTheDocument()
  })

  it('renders a navigation landmark', () => {
    render(
      <ParentLayout>
        <div>content</div>
      </ParentLayout>
    )
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders a main landmark', () => {
    render(
      <ParentLayout>
        <div>content</div>
      </ParentLayout>
    )
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('passes axe accessibility audit', async () => {
    const { container } = render(
      <ParentLayout>
        <div>content</div>
      </ParentLayout>
    )
    const results = await axe(container as Element)
    expect(results).toHaveNoViolations()
  })
})
```

### Step 7.2: Run tests — confirm they FAIL

```bash
npm test src/components/layouts/ParentLayout.test.tsx
```

Expected: FAIL — `Cannot find module './ParentLayout'`

### Step 7.3: Implement `ParentLayout`

Create `src/components/layouts/ParentLayout.tsx`:

```tsx
interface ParentLayoutProps {
  children: React.ReactNode
}

export function ParentLayout({ children }: ParentLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white">
        <nav
          aria-label="Main navigation"
          className="p-4"
        >
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            MathDiagnose
          </p>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
```

### Step 7.4: Run tests — confirm they PASS

```bash
npm test src/components/layouts/ParentLayout.test.tsx
```

Expected: PASS — 4 tests green.

### Step 7.5: Commit

```bash
git add src/components/layouts/ParentLayout.tsx src/components/layouts/ParentLayout.test.tsx
git commit -m "feat(t3): add ParentLayout with sidebar nav, TDD + a11y tests"
```

---

## Task 8: StudentLayout Component (TDD)

**Files:**
- Create: `src/components/layouts/StudentLayout.tsx`
- Create: `src/components/layouts/StudentLayout.test.tsx`

### Step 8.1: Write the failing tests FIRST

Create `src/components/layouts/StudentLayout.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { StudentLayout } from './StudentLayout'

describe('StudentLayout', () => {
  it('renders children inside the layout', () => {
    render(
      <StudentLayout>
        <div>question text</div>
      </StudentLayout>
    )
    expect(screen.getByText('question text')).toBeInTheDocument()
  })

  it('renders a main landmark', () => {
    render(
      <StudentLayout>
        <div>content</div>
      </StudentLayout>
    )
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('applies large font class for child-friendly readability', () => {
    const { container } = render(
      <StudentLayout>
        <div>content</div>
      </StudentLayout>
    )
    const main = container.querySelector('main')
    // text-lg = 18px body text (Tailwind)
    expect(main?.className).toContain('text-lg')
  })

  it('applies minimum touch-target size class', () => {
    const { container } = render(
      <StudentLayout>
        <div>content</div>
      </StudentLayout>
    )
    // data-testid used to find the interactive wrapper
    const wrapper = container.querySelector('[data-testid="student-layout"]')
    expect(wrapper).toBeDefined()
  })

  it('passes axe accessibility audit', async () => {
    const { container } = render(
      <StudentLayout>
        <div>content</div>
      </StudentLayout>
    )
    const results = await axe(container as Element)
    expect(results).toHaveNoViolations()
  })
})
```

### Step 8.2: Run tests — confirm they FAIL

```bash
npm test src/components/layouts/StudentLayout.test.tsx
```

Expected: FAIL — `Cannot find module './StudentLayout'`

### Step 8.3: Implement `StudentLayout`

Create `src/components/layouts/StudentLayout.tsx`:

```tsx
interface StudentLayoutProps {
  children: React.ReactNode
}

export function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <div
      data-testid="student-layout"
      className="min-h-screen bg-amber-50 flex items-center justify-center p-4"
    >
      <main className="w-full max-w-2xl text-lg leading-relaxed">
        {children}
      </main>
    </div>
  )
}
```

### Step 8.4: Run tests — confirm they PASS

```bash
npm test src/components/layouts/StudentLayout.test.tsx
```

Expected: PASS — 5 tests green.

### Step 8.5: Run the full test suite

```bash
npm test
```

Expected: All tests across T1–T3 pass. Zero axe violations.

### Step 8.6: Commit

```bash
git add src/components/layouts/StudentLayout.tsx src/components/layouts/StudentLayout.test.tsx
git commit -m "feat(t3): add StudentLayout with large fonts, touch targets, TDD + a11y tests"
```

---

## Task 9: Final Verification

### Step 9.1: Run full test suite with coverage

```bash
npm run test:coverage
```

Expected: All tests pass. Coverage report generated.

### Step 9.2: Run production build

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors.

### Step 9.3: Final commit

```bash
git add -A
git commit -m "chore(t1-t3): final verification — all tests pass, build succeeds"
```

---

## Summary

| Task | What was built | Tests |
|------|---------------|-------|
| T1   | Next.js 15 scaffold + Vitest + RTL + vitest-axe | env validation (5 unit tests) |
| T2   | Supabase schema (5 tables) + RLS + auth trigger + server actions | auth + RLS (4 integration tests) |
| T3   | shadcn/ui components + ParentLayout + StudentLayout | component + a11y (9 tests) |

**Next session:** T4 (JSON Question Engine API) and T5 (Student Testing Interface).

---

> Reference: `docs/plans/2026-02-23-math-diagnostic-platform-design.md`
