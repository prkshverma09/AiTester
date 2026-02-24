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

// --- Data loader (populated in next task) ---
export const QUESTIONS: Question[] = []
