import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/auth/LogoutButton'

interface ParentLayoutProps {
  children: React.ReactNode
}

export async function ParentLayout({ children }: ParentLayoutProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const displayName = user?.email?.split('@')[0] ?? 'Parent'

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard/parent" className="text-sm font-semibold text-slate-700 uppercase tracking-wider hover:text-slate-900">
          MathDiagnose
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">{displayName}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-6 md:p-8">
        {children}
      </main>
    </div>
  )
}
