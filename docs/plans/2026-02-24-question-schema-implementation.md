# Question Schema Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hardcoded TypeScript question array with a JSON-based format that supports MCQ (2–6 options) and subjective (free-text, exact-match graded) questions, with metadata fields (difficulty 1–5, concept, tags), organised into named JSON files.

**Architecture:** Questions live in `src/data/questions/<set-id>.json`. A typed loader in `src/data/questions.ts` imports the demo set and re-exports `QUESTIONS` (preserving the existing import path). The student-demo page gains a text-input branch for subjective questions and delegates scoring to a shared `isCorrect` utility.

**Tech Stack:** TypeScript discriminated unions, Next.js `resolveJsonModule` JSON imports, Vitest (unit), Playwright (E2E).

**Design doc:** `docs/plans/2026-02-24-question-schema-design.md`

---

## Task 1: Types + `isCorrect` utility in `src/data/questions.ts`

**Files:**
- Modify: `src/data/questions.ts` (replace all content)
- Create: `src/data/questions.test.ts`

### Step 1: Write the failing unit tests

Create `src/data/questions.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { isCorrect, MCQQuestion, SubjectiveQuestion } from './questions'

const mcq: MCQQuestion = {
  id: 'q1', type: 'mcq', text: 'What is 2+2?',
  concept: 'Addition', difficulty: 1,
  options: ['3', '4', '5', '6'], correctIndex: 1,
}

const subjective: SubjectiveQuestion = {
  id: 'q2', type: 'subjective', text: 'How many legs does a dog have?',
  concept: 'General', difficulty: 1,
  correctAnswer: '4',
  acceptedAnswers: ['four'],
}

describe('isCorrect', () => {
  describe('MCQ', () => {
    it('returns true for correct index', () => {
      expect(isCorrect(mcq, 1)).toBe(true)
    })
    it('returns false for wrong index', () => {
      expect(isCorrect(mcq, 0)).toBe(false)
    })
    it('returns false for unanswered (-1)', () => {
      expect(isCorrect(mcq, -1)).toBe(false)
    })
  })

  describe('subjective — exact match', () => {
    it('returns true for exact correctAnswer', () => {
      expect(isCorrect(subjective, '4')).toBe(true)
    })
    it('returns true case-insensitively', () => {
      expect(isCorrect(subjective, 'FOUR')).toBe(true)
    })
    it('returns true ignoring surrounding whitespace', () => {
      expect(isCorrect(subjective, '  4  ')).toBe(true)
    })
    it('returns true for acceptedAnswers variant', () => {
      expect(isCorrect(subjective, 'four')).toBe(true)
    })
    it('returns false for wrong answer', () => {
      expect(isCorrect(subjective, '3')).toBe(false)
    })
    it('returns false for empty string', () => {
      expect(isCorrect(subjective, '')).toBe(false)
    })
  })
})
```

### Step 2: Run to confirm it fails

```bash
npm test -- src/data/questions.test.ts
```

Expected: FAIL — `isCorrect` and types not yet exported.

### Step 3: Replace `src/data/questions.ts` with types + utility

```ts
// --- Types ---

export type GradingStrategy = 'exact' | 'llm' | 'manual'

export interface GradingConfig {
  strategy: GradingStrategy
  prompt?: string   // context sent to LLM (future)
  model?: string    // override default LLM model (future)
}

interface QuestionBase {
  id: string
  type: string
  text: string
  concept: string
  difficulty: 1 | 2 | 3 | 4 | 5
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface MCQQuestion extends QuestionBase {
  type: 'mcq'
  options: string[]     // 2–6 items
  correctIndex: number
}

export interface SubjectiveQuestion extends QuestionBase {
  type: 'subjective'
  correctAnswer: string
  acceptedAnswers?: string[]
  grading?: GradingConfig  // defaults to { strategy: 'exact' }
}

export type Question = MCQQuestion | SubjectiveQuestion

export interface QuestionSet {
  id: string
  name: string
  description?: string
  gradeLevel?: number
  questions: Question[]
}

// --- Grading ---

export function isCorrect(question: Question, answer: string | number): boolean {
  if (question.type === 'mcq') {
    return answer === question.correctIndex
  }
  const norm = (s: string) => s.trim().toLowerCase()
  const accepted = [question.correctAnswer, ...(question.acceptedAnswers ?? [])]
  return accepted.some(a => norm(a) === norm(String(answer)))
}

// --- Data loader (populated in Task 2) ---
export const QUESTIONS: Question[] = []
```

### Step 4: Run tests — all should pass

```bash
npm test -- src/data/questions.test.ts
```

Expected: 8 tests PASS.

### Step 5: Commit

```bash
git add src/data/questions.ts src/data/questions.test.ts
git commit -m "feat: add Question types and isCorrect utility"
```

---

## Task 2: JSON data files

**Files:**
- Create: `src/data/questions/` (new directory)
- Create: `src/data/questions/mixed-demo.json`
- Modify: `src/data/questions.ts` (wire loader)

### Step 1: Create the directory and JSON file

Create `src/data/questions/mixed-demo.json`:

```json
{
  "id": "mixed-demo",
  "name": "Mixed Demo — Grades 1-3",
  "description": "10 multiple-choice questions and 2 subjective word problems",
  "questions": [
    {
      "id": "q1", "type": "mcq", "text": "What is 4 + 3?",
      "concept": "Addition", "difficulty": 1, "tags": ["single-digit"],
      "options": ["5", "6", "7", "8"], "correctIndex": 2
    },
    {
      "id": "q2", "type": "mcq", "text": "What is 9 + 6?",
      "concept": "Addition", "difficulty": 1, "tags": ["single-digit"],
      "options": ["14", "15", "16", "17"], "correctIndex": 1
    },
    {
      "id": "q3", "type": "mcq", "text": "What is 13 + 8?",
      "concept": "Addition", "difficulty": 2, "tags": ["two-digit"],
      "options": ["19", "20", "21", "22"], "correctIndex": 2
    },
    {
      "id": "q4", "type": "mcq", "text": "What is 10 − 4?",
      "concept": "Subtraction", "difficulty": 1, "tags": ["single-digit"],
      "options": ["5", "6", "7", "8"], "correctIndex": 1
    },
    {
      "id": "q5", "type": "mcq", "text": "What is 15 − 7?",
      "concept": "Subtraction", "difficulty": 2, "tags": ["single-digit"],
      "options": ["7", "8", "9", "10"], "correctIndex": 1
    },
    {
      "id": "q6", "type": "mcq", "text": "What is 23 − 9?",
      "concept": "Subtraction", "difficulty": 2, "tags": ["two-digit"],
      "options": ["12", "13", "14", "15"], "correctIndex": 2
    },
    {
      "id": "q7", "type": "mcq", "text": "What is 6 × 7?",
      "concept": "Multiplication", "difficulty": 3, "tags": ["times-tables"],
      "options": ["36", "40", "42", "48"], "correctIndex": 2
    },
    {
      "id": "q8", "type": "mcq", "text": "What is 8 × 9?",
      "concept": "Multiplication", "difficulty": 3, "tags": ["times-tables"],
      "options": ["63", "72", "78", "81"], "correctIndex": 1
    },
    {
      "id": "q9", "type": "mcq", "text": "What is 7 × 8?",
      "concept": "Multiplication", "difficulty": 3, "tags": ["times-tables"],
      "options": ["48", "54", "56", "64"], "correctIndex": 2
    },
    {
      "id": "q10", "type": "mcq", "text": "What is 4 × 6?",
      "concept": "Multiplication", "difficulty": 2, "tags": ["times-tables"],
      "options": ["20", "22", "24", "26"], "correctIndex": 2
    },
    {
      "id": "q11", "type": "subjective",
      "text": "Sam has 12 stickers. He gives 5 to his friend. How many does he have left?",
      "concept": "Subtraction", "difficulty": 2, "tags": ["word-problem"],
      "correctAnswer": "7", "acceptedAnswers": ["seven"]
    },
    {
      "id": "q12", "type": "subjective",
      "text": "A bag has 4 rows of 3 marbles. How many marbles are there in total?",
      "concept": "Multiplication", "difficulty": 3, "tags": ["word-problem"],
      "correctAnswer": "12", "acceptedAnswers": ["twelve"]
    }
  ]
}
```

### Step 2: Wire the loader in `src/data/questions.ts`

Replace the last two lines of `src/data/questions.ts` (the stub export) with:

```ts
// --- Data loader ---
import mixedDemoData from './questions/mixed-demo.json'

export const QUESTIONS: Question[] = (mixedDemoData as QuestionSet).questions
```

### Step 3: Verify TypeScript compiles

```bash
npx tsc --noEmit
```

Expected: no errors. (resolveJsonModule is already enabled in tsconfig.json)

### Step 4: Run unit tests to confirm QUESTIONS loads

Add this test to `src/data/questions.test.ts` (append inside the describe block or add new describe):

```ts
import { QUESTIONS } from './questions'

describe('QUESTIONS loader', () => {
  it('loads 12 questions from mixed-demo.json', () => {
    expect(QUESTIONS).toHaveLength(12)
  })
  it('first question is MCQ', () => {
    expect(QUESTIONS[0].type).toBe('mcq')
  })
  it('last question is subjective', () => {
    expect(QUESTIONS[11].type).toBe('subjective')
  })
})
```

```bash
npm test -- src/data/questions.test.ts
```

Expected: 11 tests PASS.

### Step 5: Commit

```bash
git add src/data/questions/ src/data/questions.ts src/data/questions.test.ts
git commit -m "feat: add JSON question files and wire loader"
```

---

## Task 3: Update student-demo page for mixed question types

**Files:**
- Modify: `src/app/student-demo/page.tsx`

The page currently:
- Stores answers as `number[]` (MCQ index, -1 = unanswered)
- Guards Next with `if (selected === -1) return`
- Renders only option buttons
- Scores with inline `ans === QUESTIONS[i].correctIndex`

Changes needed:
- Answer state becomes `(number | string)[]` (-1 or '' = unanswered)
- Subjective questions render a text input instead of buttons
- `handleNext` guard uses `isAnswered` helper
- Score uses `isCorrect`
- `handleReset` re-initialises using question types

### Step 1: Replace the full page content

Replace `src/app/student-demo/page.tsx` with:

```tsx
'use client'

import { useState } from 'react'
import { StudentLayout } from '@/components/layouts/StudentLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { QUESTIONS, isCorrect, MCQQuestion } from '@/data/questions'

type AnswerValue = number | string

function initAnswers(): AnswerValue[] {
  return QUESTIONS.map(q => (q.type === 'mcq' ? -1 : ''))
}

function isAnswered(question: (typeof QUESTIONS)[number], value: AnswerValue): boolean {
  if (question.type === 'mcq') return typeof value === 'number' && value !== -1
  return typeof value === 'string' && value.trim() !== ''
}

export default function StudentDemoPage() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerValue[]>(initAnswers)
  const [completed, setCompleted] = useState(false)

  const question = QUESTIONS[currentIndex]
  const currentAnswer = answers[currentIndex]
  const progress = ((currentIndex + 1) / QUESTIONS.length) * 100

  function handleSelectMCQ(optionIndex: number) {
    setAnswers(prev => {
      const next = [...prev]
      next[currentIndex] = optionIndex
      return next
    })
  }

  function handleTypeSubjective(text: string) {
    setAnswers(prev => {
      const next = [...prev]
      next[currentIndex] = text
      return next
    })
  }

  function handleNext() {
    if (!isAnswered(question, currentAnswer)) return
    if (currentIndex === QUESTIONS.length - 1) {
      setCompleted(true)
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  function handleBack() {
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  function handleReset() {
    setCurrentIndex(0)
    setAnswers(initAnswers())
    setCompleted(false)
  }

  if (completed) {
    const correct = QUESTIONS.filter((q, i) => isCorrect(q, answers[i])).length
    const pct = Math.round((correct / QUESTIONS.length) * 100)
    return (
      <StudentLayout>
        <div className="space-y-8 text-center">
          <h1
            data-testid="score-heading"
            className="text-4xl font-bold text-slate-800"
          >
            You got {correct} / {QUESTIONS.length} correct!
          </h1>
          <p className="text-2xl text-slate-600">{pct}%</p>
          <Button
            data-testid="try-again"
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-base px-8"
            onClick={handleReset}
          >
            Try Again
          </Button>
        </div>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* Progress header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-amber-700">
            <span data-testid="question-label">
              Question {currentIndex + 1} of {QUESTIONS.length}
            </span>
            <Badge variant="secondary">{question.concept}</Badge>
          </div>
          <Progress
            data-testid="progress-bar"
            value={progress}
            className="h-3 rounded-full"
          />
        </div>

        {/* Question card */}
        <Card className="shadow-md border-2 border-amber-100">
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-4xl font-bold text-slate-800 tracking-tight">
              {question.text}
            </p>
          </CardContent>
        </Card>

        {/* Answer area — branches on question type */}
        {question.type === 'mcq' ? (
          <div className="grid grid-cols-2 gap-4">
            {(question as MCQQuestion).options.map((option, i) => (
              <button
                key={i}
                data-testid={`option-${i}`}
                aria-label={`Answer ${i + 1}: ${option}`}
                aria-pressed={currentAnswer === i}
                onClick={() => handleSelectMCQ(i)}
                className={`
                  rounded-2xl border-2 p-6 text-3xl font-bold text-slate-700
                  active:scale-95 transition-all duration-100
                  min-h-[80px] cursor-pointer
                  ${
                    currentAnswer === i
                      ? 'border-amber-500 bg-amber-100'
                      : 'border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50'
                  }
                `}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <input
              data-testid="subjective-input"
              type="text"
              value={typeof currentAnswer === 'string' ? currentAnswer : ''}
              onChange={e => handleTypeSubjective(e.target.value)}
              placeholder="Type your answer here…"
              className="w-full rounded-2xl border-2 border-amber-200 p-6 text-3xl font-bold text-slate-700 focus:border-amber-500 focus:outline-none"
            />
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <Button
            data-testid="back-btn"
            variant="outline"
            size="lg"
            className="text-base px-8"
            onClick={handleBack}
            disabled={currentIndex === 0}
          >
            ← Back
          </Button>
          <span className="text-sm text-slate-400">Take your time!</span>
          <Button
            data-testid="next-btn"
            size="lg"
            className="text-base px-8 bg-amber-500 hover:bg-amber-600"
            onClick={handleNext}
          >
            Next →
          </Button>
        </div>
      </div>
    </StudentLayout>
  )
}
```

### Step 2: Run vitest to confirm no unit test regressions

```bash
npm test
```

Expected: all existing tests PASS.

### Step 3: Commit

```bash
git add src/app/student-demo/page.tsx
git commit -m "feat: support subjective questions in student-demo UI"
```

---

## Task 4: Update E2E tests

**Files:**
- Modify: `e2e/student-demo.spec.ts`
- Modify: `e2e/student-journey.spec.ts`

The question count changed from 10 → 12. All hardcoded `'10'` references must become `'12'`. The complete-all-questions loops must handle subjective questions (Q11, Q12) by typing into `subjective-input` instead of clicking `option-0`.

### Step 1: Update `e2e/student-demo.spec.ts`

Replace the file with:

```ts
import { test, expect } from '@playwright/test'

test.describe('Student quiz flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/student-demo')
  })

  test('shows Question 1 of 12 on load', async ({ page }) => {
    await expect(page.getByTestId('question-label')).toContainText('Question 1 of 12')
  })

  test('progress bar is visible', async ({ page }) => {
    await expect(page.getByTestId('progress-bar')).toBeVisible()
  })

  test('Next without selection does not advance', async ({ page }) => {
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 1 of 12')
  })

  test('selecting an MCQ answer highlights the button', async ({ page }) => {
    await page.getByTestId('option-0').click()
    await expect(page.getByTestId('option-0')).toHaveClass(/border-amber-500/)
  })

  test('Next after MCQ selection advances to question 2', async ({ page }) => {
    await page.getByTestId('option-0').click()
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 2 of 12')
  })

  test('Back restores question 1 with prior selection', async ({ page }) => {
    await page.getByTestId('option-1').click()
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 2 of 12')
    await page.getByTestId('back-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 1 of 12')
    await expect(page.getByTestId('option-1')).toHaveClass(/border-amber-500/)
  })

  test('subjective question shows text input instead of option buttons', async ({ page }) => {
    // Navigate to Q11 (first subjective question, index 10)
    for (let i = 0; i < 10; i++) {
      await page.getByTestId('option-0').click()
      await page.getByTestId('next-btn').click()
    }
    await expect(page.getByTestId('question-label')).toContainText('Question 11 of 12')
    await expect(page.getByTestId('subjective-input')).toBeVisible()
    await expect(page.getByTestId('option-0')).not.toBeVisible()
  })

  test('Next blocked until subjective input is non-empty', async ({ page }) => {
    for (let i = 0; i < 10; i++) {
      await page.getByTestId('option-0').click()
      await page.getByTestId('next-btn').click()
    }
    // On Q11 — input empty
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 11 of 12')
    // Type something — Next should advance
    await page.getByTestId('subjective-input').fill('7')
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 12 of 12')
  })

  test('completing all 12 questions shows score screen', async ({ page }) => {
    for (let i = 0; i < 12; i++) {
      const optionBtn = page.getByTestId('option-0')
      if (await optionBtn.isVisible()) {
        await optionBtn.click()
      } else {
        await page.getByTestId('subjective-input').fill('42')
      }
      await page.getByTestId('next-btn').click()
    }
    await expect(page.getByTestId('score-heading')).toContainText('/ 12 correct')
  })

  test('Try Again resets to question 1', async ({ page }) => {
    for (let i = 0; i < 12; i++) {
      const optionBtn = page.getByTestId('option-0')
      if (await optionBtn.isVisible()) {
        await optionBtn.click()
      } else {
        await page.getByTestId('subjective-input').fill('42')
      }
      await page.getByTestId('next-btn').click()
    }
    await page.getByTestId('try-again').click()
    await expect(page.getByTestId('question-label')).toContainText('Question 1 of 12')
  })

  test('score reflects correct answers', async ({ page }) => {
    // MCQ correct picks: Q1→idx2(7), Q2→idx1(15), Q3→idx2(21), Q4-Q10→idx0(wrong)
    // Subjective: Q11→'7'(correct), Q12→'wrong'
    const mcqPicks = [2, 1, 2, 0, 0, 0, 0, 0, 0, 0]
    for (const pick of mcqPicks) {
      await page.getByTestId(`option-${pick}`).click()
      await page.getByTestId('next-btn').click()
    }
    await page.getByTestId('subjective-input').fill('7')   // Q11 correct
    await page.getByTestId('next-btn').click()
    await page.getByTestId('subjective-input').fill('wrong') // Q12 wrong
    await page.getByTestId('next-btn').click()
    await expect(page.getByTestId('score-heading')).toContainText('You got 4 / 12 correct!')
  })
})
```

### Step 2: Check `e2e/student-journey.spec.ts` for hardcoded 10s
<br>

Read the file and replace any `'10'` question-count references with `'12'` and update any complete-quiz loops similarly to the pattern above.

```bash
grep -n "10" e2e/student-journey.spec.ts
```

Update as needed following the same pattern as above.

### Step 3: Run the full E2E suite

Make sure the dev server is running in a separate terminal (`npm run dev`), then:

```bash
npm run test:e2e
```

Expected: all tests PASS.

### Step 4: Commit

```bash
git add e2e/student-demo.spec.ts e2e/student-journey.spec.ts
git commit -m "test(e2e): update student-demo tests for 12-question mixed set"
```

---

## Task 5: Final verification + push

### Step 1: Run all tests

```bash
npm test && npm run test:e2e
```

Expected: all Vitest unit tests PASS, all Playwright E2E tests PASS.

### Step 2: TypeScript check

```bash
npx tsc --noEmit
```

Expected: no errors.

### Step 3: Push

```bash
git push origin main
```
