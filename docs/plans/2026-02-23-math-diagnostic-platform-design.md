# Math Diagnostic Platform — Design Document

**Date:** 2026-02-23
**Scope:** Phase 1, Session 1 — T1 (Project Setup), T2 (Database & Auth), T3 (Base UI)
**Product:** Parent-Centric, Language-Aware Diagnostic Platform for Primary Mathematics

---

## 1. Context

This platform diagnoses children's mathematical understanding (ages 6–9, UK primary) by
separating mathematical misconceptions from language comprehension barriers. It uses
JSON-driven question delivery and AI-powered diagnostic reporting (Gemini API).

Full product spec: `PRD.md`. Full task DAG: `implementation_plan.md`.

---

## 2. Session Scope

This session implements the infrastructure foundation only (Tasks T1–T3). Later sessions
will build on this foundation to complete T4–T10.

| Task | Description |
|------|-------------|
| T1   | Project scaffold, dependencies, env config, Vitest setup |
| T2   | Supabase DB schema, RLS policies, Auth server actions |
| T3   | shadcn/ui initialisation, ParentLayout, StudentLayout |

---

## 3. Technology Stack

| Concern | Choice |
|---------|--------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Database / Auth | Supabase (PostgreSQL + Supabase Auth) |
| Styling | Tailwind CSS + shadcn/ui |
| AI (future T7–T8) | Vercel AI SDK + `@ai-sdk/google` (Gemini) |
| Env validation | `t3-env` |
| Unit + Integration tests | Vitest + React Testing Library + vitest-axe |
| Local DB for tests | Supabase CLI + Docker |
| E2E tests (T10 only) | Playwright |

---

## 4. Architecture

### 4.1 Project Structure

```
/
├── src/
│   ├── app/                        # Next.js App Router pages, layouts, server actions
│   ├── components/
│   │   ├── ui/                     # shadcn/ui primitives (Button, Card, Form, etc.)
│   │   └── layouts/
│   │       ├── ParentLayout.tsx
│   │       ├── ParentLayout.test.tsx
│   │       ├── StudentLayout.tsx
│   │       └── StudentLayout.test.tsx
│   ├── lib/
│   │   ├── supabase/               # DB client + typed query helpers
│   │   └── env.ts                  # t3-env validated environment config
│   └── db/
│       └── migrations/             # Supabase SQL migration files
├── supabase/                       # Supabase CLI config + local seed data
├── vitest.config.ts
├── vitest.setup.ts                 # RTL + axe global setup
└── .env.local                      # Real credentials (gitignored)
```

### 4.2 TDD Workflow

Strict red-green-refactor on every implementation unit:

1. Write a failing test that describes the intended behaviour
2. Write the minimum code to make it pass
3. Refactor without breaking tests
4. Commit

Tests co-located with source files (e.g., `env.test.ts` next to `env.ts`).

---

## 5. T1 — Project Setup

### Dependencies

**Runtime:** `ai`, `@ai-sdk/google`, `zod`, `@supabase/supabase-js`, `@supabase/ssr`,
`lucide-react`, `@t3-oss/env-nextjs`

**Dev:** `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`,
`@testing-library/jest-dom`, `vitest-axe`, `@types/node`

### Env Validation (TDD target)

```ts
// src/lib/env.test.ts — written before env.ts
it('throws at startup if NEXT_PUBLIC_SUPABASE_URL is missing')
it('throws at startup if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing')
it('throws at startup if GOOGLE_GEMINI_API_KEY is missing')
it('returns typed config when all required vars present')
```

### Acceptance Criteria

- `next build` compiles without errors
- `vitest run` passes env validation tests
- `.env.local.example` committed with all required variable names

---

## 6. T2 — Database Schema & Authentication

### Schema

```sql
-- Owned by Supabase Auth (auth.users linked via id)
CREATE TABLE parents (
  id         uuid PRIMARY KEY REFERENCES auth.users(id),
  email      text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE students (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  name       text NOT NULL,
  age        int  NOT NULL CHECK (age BETWEEN 5 AND 12),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE test_sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  concept    text NOT NULL,
  start_time timestamptz DEFAULT now(),
  end_time   timestamptz,
  status     text NOT NULL DEFAULT 'in_progress'
             CHECK (status IN ('in_progress', 'completed', 'abandoned'))
);

CREATE TABLE test_answers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  raw_answer  text,
  time_taken  int,   -- milliseconds
  is_correct  bool
);

CREATE TABLE diagnostic_reports (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           uuid UNIQUE NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  ai_generated_report  jsonb,
  created_at           timestamptz DEFAULT now()
);
```

### RLS Policies

All tables enable RLS. Parents can only access rows where `parent_id = auth.uid()`.
Transitive access (e.g., `test_answers` via `session_id → student_id → parent_id`) uses
security-definer helper functions.

### Auth

Supabase email/password auth for parents. Three Next.js Server Actions:
- `signUp(email, password)` — creates `auth.users` entry + inserts into `parents`
- `signIn(email, password)` — returns session
- `signOut()` — clears session cookie

### TDD Targets

```ts
// src/lib/supabase/auth.test.ts — written before implementation
it('signUp creates a row in the parents table')
it('signIn returns a valid session for registered parent')
it('signOut clears the session')
it('blocks parent A from reading parent B students')  // RLS test
it('allows parent to read their own students')
it('allows parent to insert a student linked to their id')
```

Tests run against local Supabase Docker instance (`supabase start`).

### Acceptance Criteria

- Parent can register and log in
- RLS policies block cross-account data access (verified by test)
- All auth server actions have passing tests

---

## 7. T3 — Base UI Components & Theming

### Layout Shells

**ParentLayout**
- Sidebar navigation (analytical palette: blues/greys)
- Data-dense typography, desktop-first
- Wraps all `/dashboard/*` routes

**StudentLayout**
- Full-screen, distraction-free
- Warm, playful color palette
- Large fonts (minimum 18px body)
- Touch-friendly tap targets (minimum 44×44px)
- Wraps all `/test/*` routes

### shadcn/ui Components Initialised

Button, Card, Form, Input, Progress, Dialog, Badge.
Only what T4–T6 will consume — no premature additions.

### TDD Targets (every component gets all 3)

```tsx
// Pattern applied to ParentLayout, StudentLayout, and each shadcn primitive wrapper
it('renders children correctly')
it('passes axe accessibility audit')           // vitest-axe, zero violations required
it('meets minimum touch target / font size')   // StudentLayout only
```

### Acceptance Criteria

- Both layout shells render without errors
- All component tests pass
- Zero axe violations across all components

---

## 8. Out of Scope for This Session

The following are intentionally deferred to later sessions:

- T4: JSON Question Engine API
- T5: Student Testing Interface
- T6: Test Execution & State Management
- T7: Gemini API Core Setup
- T8: AI Diagnostic Report Generator
- T9: Parent Dashboard & Analytics
- T10: Vercel E2E Deployment

---

## 9. Open Questions for Future Sessions

- Sample math question content for T4 (who authors initial JSON question bank?)
- Gemini model version to target (gemini-1.5-flash vs gemini-1.5-pro)
- Vercel project name and custom domain for T10
