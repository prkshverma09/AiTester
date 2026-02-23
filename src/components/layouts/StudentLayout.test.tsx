import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { StudentLayout } from './StudentLayout'

describe('StudentLayout', () => {
  it('renders children inside the layout', () => {
    render(
      <StudentLayout>
        <div>question text</div>
      </StudentLayout>
    )
    expect(screen.getByText('question text')).toBeInTheDocument()
  })

  it('renders a main landmark', () => {
    render(
      <StudentLayout>
        <div>content</div>
      </StudentLayout>
    )
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('applies large font class for child-friendly readability', () => {
    const { container } = render(
      <StudentLayout>
        <div>content</div>
      </StudentLayout>
    )
    const main = container.querySelector('main')
    // text-lg = 18px body text (Tailwind)
    expect(main?.className).toContain('text-lg')
  })

  it('applies minimum touch-target size class', () => {
    const { container } = render(
      <StudentLayout>
        <div>content</div>
      </StudentLayout>
    )
    // data-testid used to find the interactive wrapper
    const wrapper = container.querySelector('[data-testid="student-layout"]')
    expect(wrapper).toBeDefined()
  })

  it('passes axe accessibility audit', async () => {
    const { container } = render(
      <StudentLayout>
        <div>content</div>
      </StudentLayout>
    )
    const results = await axe(container as Element)
    expect(results).toHaveNoViolations()
  })
})
