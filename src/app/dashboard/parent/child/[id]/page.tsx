import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRoleForUser } from '@/lib/auth/get-role'
import { getQuestionsForConcept, type Question } from '@/data/questions'
import { ParentLayout } from '@/components/layouts/ParentLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GenerateSummaryButton } from './GenerateSummaryButton'
import { GenerateConceptReportButton } from './GenerateConceptReportButton'
import { SessionDeepDiveDialog } from './SessionDeepDiveDialog'

function getCorrectAnswerString(q: Question): string {
  if (q.type === 'mcq') return q.options[q.correctIndex] ?? ''
  return q.correctAnswer
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

export default async function ParentChildPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: studentId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) redirect('/login/parent')

  const role = await getRoleForUser(supabase, user.id)
  if (role?.role === 'student') redirect('/dashboard/student')
  if (role?.role !== 'parent') redirect('/login/parent')

  const { data: student } = await supabase
    .from('students')
    .select('id, name, age, parent_id')
    .eq('id', studentId)
    .single()

  if (!student || student.parent_id !== user.id) redirect('/dashboard/parent')

  const [sessionsRes, conceptReportsRes, summaryRes] = await Promise.all([
    supabase
      .from('test_sessions')
      .select('id, concept, end_time')
      .eq('student_id', studentId)
      .eq('status', 'completed')
      .order('end_time', { ascending: false }),
    supabase
      .from('concept_reports')
      .select('concept, report_json, last_session_id, updated_at')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false }),
    supabase
      .from('student_summaries')
      .select('summary_json, updated_at')
      .eq('student_id', studentId)
      .maybeSingle(),
  ])

  const sessions = sessionsRes.data ?? []
  const conceptReports = conceptReportsRes.data ?? []
  const summaryRow = summaryRes.data
  const summaryJson = summaryRow?.summary_json as
    | { overallAssessment?: string; recommendedNextSteps?: string[] }
    | null
  const conceptsWithSessions = [...new Set(sessions.map((s) => s.concept))]

  const sessionsWithScores = await Promise.all(
    sessions.slice(0, 10).map(async (sess) => {
      const { data: answers } = await supabase
        .from('test_answers')
        .select('question_id, raw_answer, is_correct')
        .eq('session_id', sess.id)
      const questions = getQuestionsForConcept(sess.concept)
      const qMap = new Map(questions.map((q) => [q.id, q]))
      const score =
        answers?.length
          ? Math.round((answers.filter((a) => a.is_correct).length / answers.length) * 100)
          : 0
      const dateStr = sess.end_time
        ? new Date(sess.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : ''
      const answerRows = (answers ?? []).map((a) => {
        const q = qMap.get(a.question_id ?? '')
        const correctAnswer = q ? getCorrectAnswerString(q) : '—'
        let childAnswer: string
        if (q?.type === 'mcq' && typeof a.raw_answer === 'number') {
          childAnswer = q.options[a.raw_answer] ?? String(a.raw_answer)
        } else {
          childAnswer = a.raw_answer != null ? String(a.raw_answer) : '—'
        }
        return {
          questionText: q?.text ?? '—',
          childAnswer,
          correctAnswer,
          isCorrect: a.is_correct ?? false,
        }
      })
      return {
        sessionId: sess.id,
        concept: sess.concept,
        score,
        date: dateStr,
        answers: answerRows,
      }
    })
  )

  const reportByConcept = new Map(
    conceptReports.map((r) => [
      r.concept,
      r.report_json as {
        expertiseScore?: number
        strengths?: string[]
        shortcomings?: string[]
        summary?: string
      },
    ])
  )
  const lastSessionIdByConcept = new Map<string, string>()
  for (const s of sessions) {
    if (!lastSessionIdByConcept.has(s.concept)) lastSessionIdByConcept.set(s.concept, s.id)
  }
  const reportStaleByConcept = new Map(
    conceptReports.map((r) => {
      const latestSessionId = lastSessionIdByConcept.get(r.concept)
      const stale = latestSessionId != null && r.last_session_id !== latestSessionId
      return [r.concept, stale]
    })
  )

  return (
    <ParentLayout>
      <div className="space-y-8">
        <nav className="text-sm">
          <Link
            href="/dashboard/parent"
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            Dashboard
          </Link>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Age {student.age} · {sessions.length} completed session{sessions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">Overall Summary</h2>
          <Card>
            <CardContent className="pt-6">
              {summaryJson ? (
                <div className="space-y-3 text-sm" data-testid="overall-summary-content">
                  <p className="text-slate-700">{summaryJson.overallAssessment}</p>
                  {summaryJson.recommendedNextSteps?.length ? (
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                      {summaryJson.recommendedNextSteps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <p className="text-slate-500 text-sm">
                    Generate an AI summary from this child&apos;s concept reports.
                  </p>
                  <GenerateSummaryButton studentId={studentId} />
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">Concept Reports</h2>
          <div className="grid gap-4">
            {conceptsWithSessions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500 text-sm">No tests taken yet. Concept reports will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              conceptsWithSessions.map((concept) => {
                const report = reportByConcept.get(concept)
                const isStale = reportStaleByConcept.get(concept) ?? false
                const showGenerate = !report || isStale
                return (
                  <Card key={concept}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{concept}</CardTitle>
                          {report?.expertiseScore != null && (
                            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              {report.expertiseScore}%
                            </span>
                          )}
                          {report && isStale && (
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                              New tests — regenerate
                            </span>
                          )}
                        </div>
                        {showGenerate && (
                          <GenerateConceptReportButton
                            studentId={studentId}
                            concept={concept}
                            variant="default"
                          />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {report ? (
                        <div data-testid={`concept-report-content-${concept}`}>
                          <p className="text-slate-700 text-sm">{report.summary}</p>
                          {report.strengths?.length ? (
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Strengths</p>
                              <ul className="list-disc list-inside text-sm text-slate-600 space-y-0.5">
                                {report.strengths.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {report.shortcomings?.length ? (
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Areas to improve</p>
                              <ul className="list-disc list-inside text-sm text-slate-600 space-y-0.5">
                                {report.shortcomings.map((s, i) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-700 mb-3">Recent Sessions</h2>
          <Card>
            <CardContent className="p-0">
              {sessionsWithScores.length === 0 ? (
                <p className="p-4 text-slate-500 text-sm">No completed sessions yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {sessionsWithScores.map((s, i) => (
                    <li
                      key={s.sessionId ?? i}
                      className="flex items-center gap-4 p-4 flex-wrap sm:flex-nowrap"
                    >
                      <span className="font-medium text-slate-700 min-w-0 flex-1">{s.concept}</span>
                      <span className={`font-semibold w-12 text-right shrink-0 ${scoreColor(s.score)}`}>{s.score}%</span>
                      <span className="text-slate-400 text-sm w-14 text-right shrink-0">{s.date}</span>
                      <SessionDeepDiveDialog session={s} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </ParentLayout>
  )
}
