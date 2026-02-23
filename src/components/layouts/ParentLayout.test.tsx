import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { ParentLayout } from './ParentLayout'

describe('ParentLayout', () => {
  it('renders children inside the layout', () => {
    render(
      <ParentLayout>
        <div>test content</div>
      </ParentLayout>
    )
    expect(screen.getByText('test content')).toBeInTheDocument()
  })

  it('renders a navigation landmark', () => {
    render(
      <ParentLayout>
        <div>content</div>
      </ParentLayout>
    )
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders a main landmark', () => {
    render(
      <ParentLayout>
        <div>content</div>
      </ParentLayout>
    )
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('passes axe accessibility audit', async () => {
    const { container } = render(
      <ParentLayout>
        <div>content</div>
      </ParentLayout>
    )
    const results = await axe(container as Element)
    expect(results).toHaveNoViolations()
  })
})
