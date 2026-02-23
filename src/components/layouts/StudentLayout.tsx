interface StudentLayoutProps {
  children: React.ReactNode
}

export function StudentLayout({ children }: StudentLayoutProps) {
  return (
    <div
      data-testid="student-layout"
      className="min-h-screen bg-amber-50 flex items-center justify-center p-4"
    >
      <main className="w-full max-w-2xl text-lg leading-relaxed">
        {children}
      </main>
    </div>
  )
}
