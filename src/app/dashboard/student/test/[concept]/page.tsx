import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRoleForUser } from '@/lib/auth/get-role'
import { CONCEPTS, getQuestionsForConcept } from '@/data/questions'
import { ConceptTestRunner } from './ConceptTestRunner'

export default async function StudentTestConceptPage({
  params,
}: {
  params: Promise<{ concept: string }>
}) {
  const { concept } = await params
  const decoded = decodeURIComponent(concept)

  if (!CONCEPTS.includes(decoded)) {
    redirect('/dashboard/student')
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) {
    redirect('/login/student')
  }

  const role = await getRoleForUser(supabase, user.id)
  if (role?.role !== 'student' || !role.studentId) {
    redirect('/dashboard/student')
  }

  const questions = getQuestionsForConcept(decoded)
  if (questions.length === 0) {
    redirect('/dashboard/student')
  }

  const { data: existingSession } = await supabase
    .from('test_sessions')
    .select('id')
    .eq('student_id', role.studentId)
    .eq('concept', decoded)
    .eq('status', 'in_progress')
    .maybeSingle()

  let sessionId: string
  if (existingSession?.id) {
    sessionId = existingSession.id
  } else {
    const { data: newSession, error } = await supabase
      .from('test_sessions')
      .insert({
        student_id: role.studentId,
        concept: decoded,
        status: 'in_progress',
      })
      .select('id')
      .single()
    if (error || !newSession?.id) {
      redirect('/dashboard/student')
    }
    sessionId = newSession.id
  }

  return (
    <ConceptTestRunner
      questions={questions}
      concept={decoded}
      sessionId={sessionId}
    />
  )
}
