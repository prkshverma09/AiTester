import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRoleForUser } from '@/lib/auth/get-role'
import { CONCEPTS } from '@/data/questions'
import { StudentLayout } from '@/components/layouts/StudentLayout'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) {
    redirect('/login/student')
  }

  const role = await getRoleForUser(supabase, user.id)
  if (role?.role === 'parent') {
    redirect('/dashboard/parent')
  }
  if (role?.role !== 'student' || !role.studentId) {
    redirect('/login/student')
  }

  const { data: student } = await supabase
    .from('students')
    .select('name')
    .eq('id', role.studentId)
    .single()

  const { data: sessions } = await supabase
    .from('test_sessions')
    .select('id, concept, end_time, status')
    .eq('student_id', role.studentId)
    .order('end_time', { ascending: false })
    .limit(20)

  const sessionsWithScores = sessions?.length
    ? await Promise.all(
        (sessions ?? []).map(async (sess) => {
          const { data: answers } = await supabase
            .from('test_answers')
            .select('is_correct')
            .eq('session_id', sess.id)
          const score = answers?.length
            ? Math.round((answers.filter((a) => a.is_correct).length / answers.length) * 100)
            : 0
          return {
            concept: sess.concept,
            date: sess.end_time ? new Date(sess.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            score,
            status: sess.status,
          }
        })
      )
    : []

  const displayName = student?.name ?? user.email?.split('@')[0] ?? 'Student'

  return (
    <StudentLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">
              Hi, {displayName}! See your progress and take tests.
            </p>
          </div>
          <LogoutButton />
        </div>

        {sessionsWithScores.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-4">Your Progress</h2>
            <div className="space-y-2">
              {sessionsWithScores.map((s, i) => (
                <Card key={`${s.concept}-${s.date}-${i}`}>
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{s.concept}</p>
                      <p className="text-sm text-slate-500">{s.date}</p>
                    </div>
                    {s.status === 'completed' && (
                      <span className={`font-semibold ${scoreColor(s.score)}`}>
                        {s.score}%
                      </span>
                    )}
                    {s.status !== 'completed' && (
                      <Badge variant="secondary">In progress</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Take a test</h2>
          <p className="text-slate-600 text-sm mb-4">
            Choose a concept to practice.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CONCEPTS.map((concept) => (
              <Card key={concept}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{concept}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/dashboard/student/test/${encodeURIComponent(concept)}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      Take test
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  )
}
