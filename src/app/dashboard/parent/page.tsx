import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRoleForUser } from '@/lib/auth/get-role'
import { ParentLayout } from '@/components/layouts/ParentLayout'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'

type ConceptScore = { concept: string; score: number; date: string }

const MOCK_STUDENTS: { id: string; name: string; age: number; conceptScores: ConceptScore[] }[] = [
  { id: '1', name: 'Alice', age: 8, conceptScores: [{ concept: 'Addition & Subtraction', score: 85, date: 'Feb 23' }, { concept: 'Place Value', score: 91, date: 'Feb 18' }] },
  { id: '2', name: 'Bob', age: 10, conceptScores: [{ concept: 'Multiplication Tables', score: 62, date: 'Feb 22' }, { concept: 'Fractions (Intro)', score: 74, date: 'Feb 15' }] },
  { id: '3', name: 'Charlie', age: 7, conceptScores: [] },
]

const MOCK_RECENT_SESSIONS = [
  { student: 'Alice', concept: 'Addition & Subtraction', score: 85, date: 'Feb 22' },
  { student: 'Bob', concept: 'Multiplication Tables', score: 62, date: 'Feb 21' },
  { student: 'Alice', concept: 'Place Value', score: 91, date: 'Feb 18' },
  { student: 'Bob', concept: 'Fractions (Intro)', score: 74, date: 'Feb 15' },
]

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function scoreBadge(score: number) {
  if (score >= 80) return 'default'
  if (score >= 60) return 'secondary'
  return 'destructive'
}

export default async function ParentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) {
    redirect('/login/parent')
  }

  const role = await getRoleForUser(supabase, user.id)
  if (role?.role === 'student') {
    redirect('/dashboard/student')
  }
  if (role?.role !== 'parent') {
    redirect('/login/parent')
  }

  const { data: studentsRows } = await supabase
    .from('students')
    .select('id, name, age')
    .order('name')

  type StudentDisplay = {
    id: string
    name: string
    age: number
    conceptScores: ConceptScore[]
  }

  let students: StudentDisplay[] = MOCK_STUDENTS
  if (studentsRows?.length) {
    students = await Promise.all(
      studentsRows.map(async (s) => {
        const { data: sessions } = await supabase
          .from('test_sessions')
          .select('id, concept, end_time')
          .eq('student_id', s.id)
          .eq('status', 'completed')
          .order('end_time', { ascending: false })
        const conceptScores: ConceptScore[] = []
        if (sessions?.length) {
          for (const sess of sessions) {
            const { data: answers } = await supabase
              .from('test_answers')
              .select('is_correct')
              .eq('session_id', sess.id)
            const score = answers?.length
              ? Math.round((answers.filter((a) => a.is_correct).length / answers.length) * 100)
              : 0
            conceptScores.push({
              concept: sess.concept,
              score,
              date: sess.end_time ? new Date(sess.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
            })
          }
        }
        return {
          id: s.id,
          name: s.name,
          age: s.age,
          conceptScores,
        }
      })
    )
  }

  let recentSessions: { student: string; concept: string; score: number; date: string }[] = MOCK_RECENT_SESSIONS
  if (studentsRows?.length) {
    const { data: sessions } = await supabase
      .from('test_sessions')
      .select('id, student_id, concept, end_time')
      .in('student_id', studentsRows.map((s) => s.id))
      .eq('status', 'completed')
      .order('end_time', { ascending: false })
      .limit(10)
    if (sessions?.length) {
      const names = new Map(studentsRows.map((s) => [s.id, s.name]))
      const withScores = await Promise.all(
        sessions.map(async (sess) => {
          const { data: answers } = await supabase
            .from('test_answers')
            .select('is_correct')
            .eq('session_id', sess.id)
          const score = answers?.length
            ? Math.round((answers.filter((a) => a.is_correct).length / answers.length) * 100)
            : 0
          return {
            student: names.get(sess.student_id) ?? 'Child',
            concept: sess.concept,
            score,
            date: sess.end_time ? new Date(sess.end_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
          }
        })
      )
      recentSessions = withScores
    }
  }

  const displayName = user.email?.split('@')[0] ?? 'Parent'
  const count = students.length

  return (
    <ParentLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">
              Welcome back, {displayName} — {count} children registered
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button>+ Add Child</Button>
            <LogoutButton />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Your Children</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {students.map((student) => (
              <Card key={student.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{student.name}</CardTitle>
                    <span className="text-slate-400 text-sm">Age {student.age}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {student.conceptScores.length === 0 ? (
                    <p className="text-slate-400 text-sm">No sessions yet</p>
                  ) : (
                    <ul className="space-y-2">
                      {student.conceptScores.map(({ concept, score, date }, i) => (
                        <li key={`${concept}-${date}-${i}`} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-slate-600 truncate" title={concept}>{concept}</span>
                          <span className="shrink-0 flex items-center gap-1.5">
                            <Badge variant={scoreBadge(score)} className="text-xs">
                              {score}%
                            </Badge>
                            {date && <span className="text-slate-400 text-xs">{date}</span>}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-700 mb-4">Recent Sessions</h2>
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left p-4 font-medium text-slate-500">Child</th>
                    <th className="text-left p-4 font-medium text-slate-500">Concept</th>
                    <th className="text-left p-4 font-medium text-slate-500">Score</th>
                    <th className="text-left p-4 font-medium text-slate-500">Date</th>
                    <th className="p-4" />
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((session, i) => (
                    <tr key={`${session.student}-${session.date}-${i}`} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4 font-medium">{session.student}</td>
                      <td className="p-4 text-slate-600">{session.concept}</td>
                      <td className="p-4">
                        <span className={`font-semibold ${scoreColor(session.score)}`}>
                          {session.score}%
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{session.date}</td>
                      <td className="p-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">View Report</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Session Report</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Child</span>
                                <span className="font-medium">{session.student}</span>
                              </div>
                              <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Concept</span>
                                <span className="font-medium">{session.concept}</span>
                              </div>
                              <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Score</span>
                                <span className={`font-semibold ${scoreColor(session.score)}`}>
                                  {session.score}%
                                </span>
                              </div>
                              <div className="flex justify-between border-b pb-2">
                                <span className="text-slate-500">Date</span>
                                <span className="font-medium">{session.date}</span>
                              </div>
                              <p className="text-slate-500 pt-1">
                                {session.score >= 80
                                  ? 'Great performance! Ready to move to the next concept.'
                                  : session.score >= 60
                                  ? 'Good effort. A bit more practice on this concept is recommended.'
                                  : 'Needs more support on this concept before progressing.'}
                              </p>
                            </div>
                            <DialogFooter showCloseButton />
                          </DialogContent>
                        </Dialog>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    </ParentLayout>
  )
}