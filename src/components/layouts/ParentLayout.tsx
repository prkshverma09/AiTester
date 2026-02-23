interface ParentLayoutProps {
  children: React.ReactNode
}

export function ParentLayout({ children }: ParentLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 shrink-0 border-r border-slate-200 bg-white">
        <nav
          aria-label="Main navigation"
          className="p-4"
        >
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            MathDiagnose
          </p>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
