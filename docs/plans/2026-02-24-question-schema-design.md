# Question Schema Design

**Date:** 2026-02-24
**Status:** Approved

## Goals

Replace the current hardcoded TypeScript array in `src/data/questions.ts` with a JSON-based question format that:

- Supports multiple question types (MCQ, subjective) in the same test
- Carries rich metadata per question (difficulty 1–5, concept, tags)
- Organises questions into named, reusable sets (one JSON file per set)
- Is extensible for future question types and grading strategies without breaking existing data

## File Structure

```
src/data/questions/
  mixed-demo.json           ← replaces current hardcoded 10-question array
  grade-1-addition.json
  grade-1-subtraction.json
  grade-2-multiplication.json
  ...

src/data/questions.ts       ← becomes a typed loader + grading utility (no raw data)
```

## JSON Schema

### Question Set File

```jsonc
{
  "id": "grade-1-addition",           // unique across all sets
  "name": "Grade 1 — Addition",
  "description": "Basic single-digit addition for young learners",  // optional
  "gradeLevel": 1,                    // optional integer
  "questions": [ /* Question[] */ ]
}
```

### Common Question Fields (all types)

```jsonc
{
  "id": "q1",                         // unique within the set
  "type": "mcq",                      // discriminant — see types below
  "text": "What is 4 + 3?",
  "concept": "Addition",
  "difficulty": 1,                    // integer 1–5
  "tags": ["single-digit", "mental-math"],  // optional, free-form
  "metadata": {}                      // optional escape hatch for arbitrary fields
}
```

### MCQ Question (`"type": "mcq"`)

```jsonc
{
  "type": "mcq",
  "options": ["5", "6", "7", "8"],   // 2–6 strings
  "correctIndex": 2                   // 0-based index into options
}
```

### Subjective Question (`"type": "subjective"`)

```jsonc
{
  "type": "subjective",
  "correctAnswer": "8",              // canonical correct answer
  "acceptedAnswers": ["eight"],      // optional extra accepted variants
  "grading": {
    "strategy": "exact"              // "exact" | "llm" | "manual"
    // future LLM fields:
    // "prompt": "The student answered a word problem about addition..."
    // "model": "claude-haiku-4-5"
  }
}
```

`grading` defaults to `{ "strategy": "exact" }` if omitted.

## TypeScript Types

```ts
// src/data/questions.ts

export type GradingStrategy = 'exact' | 'llm' | 'manual'

export interface GradingConfig {
  strategy: GradingStrategy
  prompt?: string   // context prompt for LLM grading (future)
  model?: string    // override default model (future)
}

interface QuestionBase {
  id: string
  type: string                        // narrow in subtypes
  text: string
  concept: string
  difficulty: 1 | 2 | 3 | 4 | 5
  tags?: string[]
  metadata?: Record<string, unknown>  // escape hatch for future fields
}

export interface MCQQuestion extends QuestionBase {
  type: 'mcq'
  options: string[]                   // 2–6 items
  correctIndex: number
}

export interface SubjectiveQuestion extends QuestionBase {
  type: 'subjective'
  correctAnswer: string
  acceptedAnswers?: string[]
  grading?: GradingConfig             // defaults to { strategy: 'exact' }
}

// Extend this union as new question types are added
export type Question = MCQQuestion | SubjectiveQuestion

export interface QuestionSet {
  id: string
  name: string
  description?: string
  gradeLevel?: number
  questions: Question[]
}
```

## Grading Logic

```ts
// Exact / accepted-answers grading (current)
export function isCorrect(question: Question, answer: string | number): boolean {
  if (question.type === 'mcq') {
    return answer === question.correctIndex
  }
  const norm = (s: string) => s.trim().toLowerCase()
  const all = [question.correctAnswer, ...(question.acceptedAnswers ?? [])]
  return all.some(a => norm(a) === norm(String(answer)))
}
```

When `grading.strategy === 'llm'`, the caller will invoke an LLM and pass back a
boolean/score — `isCorrect` will delegate to that path once implemented.

## Extensibility Notes

| Extension point | How it works |
|---|---|
| New question type (e.g. `"ordering"`) | Add a new interface extending `QuestionBase`, add to the `Question` union |
| New grading strategy (e.g. `"llm"`) | Add to `GradingStrategy`, implement in the grading layer |
| New metadata field (known) | Add to `QuestionBase` directly |
| New metadata field (one-off) | Use the `metadata: Record<string, unknown>` escape hatch |
| New set-level field | Add to `QuestionSet` |

## Answer State

The student-demo page currently tracks answers as `number[]` (selected option index).
With mixed question types the answer state must accommodate both MCQ indexes and text strings.

New answer type:
```ts
type Answer =
  | { type: 'mcq';        value: number }   // -1 = unanswered
  | { type: 'subjective'; value: string }   // '' = unanswered

type AnswerState = Record<string, Answer>   // keyed by question id
```

## Files Affected

| File | Change |
|---|---|
| `src/data/questions.ts` | Replace raw array with types, loader, and `isCorrect` |
| `src/data/questions/mixed-demo.json` | Migrated 10 existing questions (MCQ) + 2 sample subjective |
| `src/app/student-demo/page.tsx` | Update answer state type; add text input branch for subjective |
| `e2e/student-demo.spec.ts` | Update tests to cover subjective question path |
| `src/app/student-demo/page.tsx` score screen | `isCorrect` replaces inline `=== correctIndex` check |
