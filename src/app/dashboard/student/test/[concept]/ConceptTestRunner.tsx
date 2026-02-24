'use client'

import { useState } from 'react'
import { StudentLayout } from '@/components/layouts/StudentLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { isCorrect, type Question, type MCQQuestion } from '@/data/questions'
import { completeTestSession, type AnswerRecord } from './actions'

type AnswerValue = number | string

function initAnswers(questions: Question[]): AnswerValue[] {
  return questions.map((q) => (q.type === 'mcq' ? -1 : ''))
}

function isAnswered(question: Question, value: AnswerValue): boolean {
  if (question.type === 'mcq') return typeof value === 'number' && value !== -1
  return typeof value === 'string' && value.trim() !== ''
}

interface ConceptTestRunnerProps {
  questions: Question[]
  concept: string
  sessionId: string
}

export function ConceptTestRunner({ questions, concept, sessionId }: ConceptTestRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<AnswerValue[]>(() => initAnswers(questions))
  const [completed, setCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const question = questions[currentIndex]
  const currentAnswer = answers[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  function handleSelectMCQ(optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev]
      next[currentIndex] = optionIndex
      return next
    })
  }

  function handleTypeSubjective(text: string) {
    setAnswers((prev) => {
      const next = [...prev]
      next[currentIndex] = text
      return next
    })
  }

  function handleNext() {
    if (!question || !isAnswered(question, currentAnswer)) return
    if (currentIndex === questions.length - 1) {
      setCompleted(true)
    } else {
      setCurrentIndex((i) => i + 1)
    }
  }

  function handleBack() {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }

  async function handleFinishAndGoBack() {
    if (submitting) return
    setSubmitting(true)
    const answerRecords: AnswerRecord[] = questions.map((q, i) => ({
      questionId: q.id,
      rawAnswer: typeof answers[i] === 'number' ? String(answers[i]) : String(answers[i] ?? ''),
      isCorrect: isCorrect(q, answers[i]),
    }))
    await completeTestSession(sessionId, answerRecords)
  }

  if (completed && questions.length > 0) {
    const correct = questions.filter((q, i) => isCorrect(q, answers[i])).length
    const pct = Math.round((correct / questions.length) * 100)
    return (
      <StudentLayout>
        <div className="space-y-8 text-center">
          <h1 data-testid="score-heading" className="text-4xl font-bold text-slate-800">
            You got {correct} / {questions.length} correct!
          </h1>
          <p className="text-2xl text-slate-600">{pct}%</p>
          <Button
            data-testid="back-to-dashboard"
            size="lg"
            className="bg-amber-500 hover:bg-amber-600 text-base px-8"
            onClick={handleFinishAndGoBack}
            disabled={submitting}
          >
            Back to dashboard
          </Button>
        </div>
      </StudentLayout>
    )
  }

  if (!question) {
    return (
      <StudentLayout>
        <p className="text-slate-600">No questions for this concept.</p>
      </StudentLayout>
    )
  }

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-amber-700">
            <span data-testid="question-label">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <Badge variant="secondary">{concept}</Badge>
          </div>
          <Progress data-testid="progress-bar" value={progress} className="h-3 rounded-full" />
        </div>

        <Card className="shadow-md border-2 border-amber-100">
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-4xl font-bold text-slate-800 tracking-tight">{question.text}</p>
          </CardContent>
        </Card>

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
              onChange={(e) => handleTypeSubjective(e.target.value)}
              placeholder="Type your answer here…"
              className="w-full rounded-2xl border-2 border-amber-200 p-6 text-3xl font-bold text-slate-700 focus:border-amber-500 focus:outline-none"
            />
          </div>
        )}

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
