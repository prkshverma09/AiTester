'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { generateConceptReport } from '@/app/actions/reports'

export function GenerateConceptReportButton({
  studentId,
  concept,
  variant = 'outline',
}: {
  studentId: string
  concept: string
  variant?: 'default' | 'outline'
}) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)

  async function handleClick() {
    if (isPending) return
    setIsPending(true)
    try {
      const result = await generateConceptReport(studentId, concept)
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
      variant={variant}
      data-testid="generate-concept-report-btn"
    >
      {isPending ? 'Generating…' : 'Generate Report'}
    </Button>
  )
}
