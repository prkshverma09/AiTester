'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AnswerRecord = { questionId: string; rawAnswer: string; isCorrect: boolean }

export async function completeTestSession(sessionId: string, answers: AnswerRecord[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) {
    redirect('/login/student')
  }

  const { error: sessionError } = await supabase
    .from('test_sessions')
    .update({
      end_time: new Date().toISOString(),
      status: 'completed',
    })
    .eq('id', sessionId)

  if (sessionError) {
    return { error: sessionError.message }
  }

  for (const a of answers) {
    await supabase.from('test_answers').insert({
      session_id: sessionId,
      question_id: a.questionId,
      raw_answer: a.rawAnswer,
      is_correct: a.isCorrect,
    })
  }

  redirect('/dashboard/student')
}
