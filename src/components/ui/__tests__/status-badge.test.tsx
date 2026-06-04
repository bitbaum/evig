/**
 * StatusBadge primitive tests
 * Verifies the variant/tone/size matrix renders the right token classes.
 */

import { render } from '@testing-library/react'
import { StatusBadge } from '../status-badge'

describe('StatusBadge', () => {
  it('renders children text', () => {
    const { getByText } = render(<StatusBadge variant="warning">Offen</StatusBadge>)
    expect(getByText('Offen')).toBeInTheDocument()
  })

  it('default tone is solid (bg-X-100)', () => {
    const { container } = render(<StatusBadge variant="warning">x</StatusBadge>)
    expect(container.firstChild).toHaveClass('bg-warning-100')
    expect(container.firstChild).toHaveClass('text-warning-800')
  })

  it('tone="subtle" uses bg-X-50', () => {
    const { container } = render(
      <StatusBadge variant="error" tone="subtle">x</StatusBadge>,
    )
    expect(container.firstChild).toHaveClass('bg-error-50')
    expect(container.firstChild).toHaveClass('text-error-600')
  })

  it('default size is sm', () => {
    const { container } = render(<StatusBadge variant="success">x</StatusBadge>)
    expect(container.firstChild).toHaveClass('text-xs')
    expect(container.firstChild).toHaveClass('px-2')
  })

  it('size="md" gets larger padding + text-sm', () => {
    const { container } = render(<StatusBadge variant="info" size="md">x</StatusBadge>)
    expect(container.firstChild).toHaveClass('text-sm')
    expect(container.firstChild).toHaveClass('px-2.5')
  })

  it('neutral variant uses token surface, not chromatic', () => {
    const { container } = render(<StatusBadge variant="neutral">x</StatusBadge>)
    expect(container.firstChild).toHaveClass('bg-surface-overlay')
    expect(container.firstChild).toHaveClass('text-text-primary')
  })

  it('every variant + tone combination renders', () => {
    const variants = ['warning', 'error', 'success', 'info', 'neutral'] as const
    const tones = ['solid', 'subtle'] as const
    for (const v of variants) {
      for (const t of tones) {
        const { container } = render(
          <StatusBadge variant={v} tone={t}>x</StatusBadge>,
        )
        expect(container.firstChild).toHaveClass('rounded-full')
        expect(container.firstChild).toHaveClass('inline-flex')
      }
    }
  })

  it('appends user className', () => {
    const { container } = render(
      <StatusBadge variant="success" className="custom-class">x</StatusBadge>,
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
