import { ParentLayout } from '@/components/layouts/ParentLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

const students = [
  {
    id: '1',
    name: 'Alice',
    age: 8,
    lastSession: '2026-02-22',
    concept: 'Addition & Subtraction',
    score: 85,
    status: 'completed' as const,
  },
  {
    id: '2',
    name: 'Bob',
    age: 10,
    lastSession: '2026-02-21',
    concept: 'Multiplication Tables',
    score: 62,
    status: 'completed' as const,
  },
  {
    id: '3',
    name: 'Charlie',
    age: 7,
    lastSession: null,
    concept: null,
    score: null,
    status: 'no_sessions' as const,
  },
]

const recentSessions = [
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

export default function ParentDemoPage() {
  return (
    <ParentLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm mt-1">
              Welcome back, Sarah — 3 children registered
            </p>
          </div>
          <Button>+ Add Child</Button>
        </div>

        {/* Student Cards */}
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
                  {student.status === 'no_sessions' ? (
                    <p className="text-slate-400 text-sm">No sessions yet</p>
                  ) : (
                    <>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">{student.concept}</p>
                        <Progress value={student.score!} className="h-2" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={scoreBadge(student.score!)}>
                          {student.score}%
                        </Badge>
                        <span className="text-xs text-slate-400">{student.lastSession}</span>
                      </div>
                    </>
                  )}
                  <Button variant="outline" size="sm" className="w-full">
                    Start Test
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Sessions Table */}
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
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="p-4 font-medium">{session.student}</td>
                      <td className="p-4 text-slate-600">{session.concept}</td>
                      <td className="p-4">
                        <span className={`font-semibold ${scoreColor(session.score)}`}>
                          {session.score}%
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{session.date}</td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm">View Report</Button>
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
