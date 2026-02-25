'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Check, X } from 'lucide-react'

export type SessionAnswerRow = {
  questionText: string
  childAnswer: string
  correctAnswer: string
  isCorrect: boolean
}

export type SessionForDeepDive = {
  concept: string
  date: string
  score: number
  answers: SessionAnswerRow[]
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

export function SessionDeepDiveDialog({ session }: { session: SessionForDeepDive }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="shrink-0">
          View Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {session.concept} — {session.date}
          </DialogTitle>
          <p className={`text-sm font-semibold ${scoreColor(session.score)}`}>
            Score: {session.score}%
          </p>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 min-h-0 space-y-4 pr-2">
          {session.answers.length === 0 ? (
            <p className="text-slate-500 text-sm">No question data for this session.</p>
          ) : (
            session.answers.map((row, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2 text-sm"
              >
                <p className="font-medium text-slate-800">{row.questionText}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-600">
                    Your answer: <span className="font-medium">{row.childAnswer}</span>
                  </span>
                  {row.isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                      <Check className="size-4" /> Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                      <X className="size-4" /> Correct answer: {row.correctAnswer}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
