'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { generateStudentSummary } from '@/app/actions/reports'

export function GenerateSummaryButton({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleClick() {
    if (isPending) return
    setIsPending(true)
    try {
      const result = await generateStudentSummary(studentId)
      if (result.error) {
        alert(result.error)
        return
      }
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      size="sm"
      data-testid="generate-summary-btn"
    >
      {isPending ? 'Generating…' : 'Generate Summary'}
    </Button>
  )
}
