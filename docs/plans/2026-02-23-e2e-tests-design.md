# E2E Test Suite — Design Document

Date: 2026-02-23

## Goal

Add comprehensive Playwright E2E tests covering all user flows across the three existing pages (`/`, `/parent-demo`, `/student-demo`), and make the student demo page interactive so that a real multi-question quiz flow exists to test.

## Approach

Option A — Client component in `/student-demo`. Convert `student-demo/page.tsx` to a `'use client'` component with `useState` managing `currentIndex`, `selectedAnswers`, and a `completed` flag. Quiz data lives in a separate `src/data/questions.ts` file.

## Files

| File | Action |
|---|---|
| `src/data/questions.ts` | New — 10 questions with 4 options + correct answer index |
| `src/app/student-demo/page.tsx` | Rewrite as `'use client'` interactive quiz |
| `playwright.config.ts` | New — Playwright config (Next.js dev server, port 3000) |
| `e2e/home.spec.ts` | New — home page tests |
| `e2e/parent-demo.spec.ts` | New — parent dashboard tests |
| `e2e/student-demo.spec.ts` | New — full interactive quiz flow tests |
| `package.json` | Add `"test:e2e": "playwright test"` script |

## Interactive Quiz Behaviour

1. **Select answer** → button gets a highlighted border (selected/active state, e.g. `border-amber-500 bg-amber-100`)
2. **Click "Next →"** → advance to next question (answer recorded); disabled/no-op if no answer selected
3. **Click "← Back"** → return to previous question with prior selection restored
4. **After question 10 + Next** → score screen: "You got X / 10 correct", percentage, "Try Again" button resets to question 1

## Question Data (10 questions, 3 concepts)

- Questions 1–3: Addition
- Questions 4–6: Subtraction
- Questions 7–10: Multiplication Tables
- Each question: `{ text, options: string[4], correctIndex: 0–3, concept }`

## E2E Test Coverage

### `home.spec.ts` (3 tests)
- Page title "MathDiagnose" is visible
- "Parent Dashboard" link navigates to `/parent-demo`
- "Student Test View" link navigates to `/student-demo`

### `parent-demo.spec.ts` (9 tests)
- "Dashboard" heading visible; welcome text mentions "Sarah — 3 children"
- Alice card: name, age 8, concept "Addition & Subtraction", 85% green badge
- Bob card: 62% amber badge
- Charlie card: "No sessions yet" text
- All 3 "Start Test" buttons present
- Recent sessions table has exactly 4 rows
- Score colours: 91% green, 74% amber, 62% amber
- All 4 "View Report" buttons present
- "+ Add Child" button present

### `student-demo.spec.ts` (8 tests)
- Page loads showing "Question 1 of 10" and concept badge
- Progress bar starts at 10% (1/10)
- "Next →" without selecting an answer does not advance (guard)
- Select an answer → button shows selected style
- Select → Next → shows "Question 2 of 10", progress 20%
- Back button restores question 1 with prior selection shown
- Complete all 10 questions → score screen with "X / 10 correct"
- "Try Again" resets to question 1

## Success Criteria

- `npm run test:e2e` passes all 20 tests with zero failures
- Existing 14 Vitest unit/component tests continue to pass
- No new TypeScript errors
