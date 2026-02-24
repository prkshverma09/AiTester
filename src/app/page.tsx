import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <main className="w-full max-w-lg space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">MathDiagnose</h1>
          <p className="mt-2 text-slate-500">
            AI-powered math diagnostic platform for children ages 5–12.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            UI Demos — no login required
          </h2>

          <Link
            href="/parent-demo"
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 hover:border-slate-400 transition-colors"
          >
            <div>
              <p className="font-semibold text-slate-800">Parent Dashboard</p>
              <p className="text-sm text-slate-500 mt-0.5">
                View children, test history, and scores
              </p>
            </div>
            <span className="text-slate-400">→</span>
          </Link>

          <Link
            href="/student-demo"
            className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-5 hover:border-amber-400 transition-colors"
          >
            <div>
              <p className="font-semibold text-slate-800">Student Test View</p>
              <p className="text-sm text-slate-500 mt-0.5">
                What a child sees during a math diagnostic
              </p>
            </div>
            <span className="text-slate-400">→</span>
          </Link>
        </div>

        <div className="rounded-lg bg-slate-100 p-4 text-sm text-slate-500 space-y-1">
          <p className="font-medium text-slate-600">Full app requires Supabase</p>
          <p>Copy <code className="text-xs bg-white px-1 py-0.5 rounded">.env.local.example</code> → <code className="text-xs bg-white px-1 py-0.5 rounded">.env.local</code> and add your credentials.</p>
        </div>
      </main>
    </div>
  )
}
