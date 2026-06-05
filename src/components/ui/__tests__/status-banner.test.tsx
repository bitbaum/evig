/**
 * StatusBanner primitive tests
 * Verifies variant → class mapping, default icons, ARIA semantics, content slot.
 */

import { render } from '@testing-library/react'
import { Info } from 'lucide-react'
import { StatusBanner } from '../status-banner'

describe('StatusBanner', () => {
  it('renders children as the message', () => {
    const { getByText } = render(<StatusBanner variant="error">Verification failed</StatusBanner>)
    expect(getByText('Verification failed')).toBeInTheDocument()
  })

  it('sets role="alert" so it announces to screen readers', () => {
    const { container } = render(<StatusBanner variant="error">x</StatusBanner>)
    expect(container.firstChild).toHaveAttribute('role', 'alert')
  })

  it('uses aria-live="assertive" for error variant', () => {
    const { container } = render(<StatusBanner variant="error">x</StatusBanner>)
    expect(container.firstChild).toHaveAttribute('aria-live', 'assertive')
  })

  it('uses aria-live="polite" for non-error variants', () => {
    const { container: c1 } = render(<StatusBanner variant="success">x</StatusBanner>)
    expect(c1.firstChild).toHaveAttribute('aria-live', 'polite')

    const { container: c2 } = render(<StatusBanner variant="warning">x</StatusBanner>)
    expect(c2.firstChild).toHaveAttribute('aria-live', 'polite')

    const { container: c3 } = render(<StatusBanner variant="info">x</StatusBanner>)
    expect(c3.firstChild).toHaveAttribute('aria-live', 'polite')
  })

  it('omits aria-live when announce={false}', () => {
    const { container } = render(<StatusBanner variant="error" announce={false}>x</StatusBanner>)
    expect(container.firstChild).not.toHaveAttribute('aria-live')
  })

  it('applies success tone classes', () => {
    const { container } = render(<StatusBanner variant="success">x</StatusBanner>)
    expect(container.firstChild).toHaveClass('bg-action-muted')
  })

  it('applies error tone classes', () => {
    const { container } = render(<StatusBanner variant="error">x</StatusBanner>)
    expect(container.firstChild).toHaveClass('bg-error-50')
  })

  it('applies warning tone classes', () => {
    const { container } = render(<StatusBanner variant="warning">x</StatusBanner>)
    expect(container.firstChild).toHaveClass('bg-warning-50')
  })

  it('applies info tone classes', () => {
    const { container } = render(<StatusBanner variant="info">x</StatusBanner>)
    expect(container.firstChild).toHaveClass('bg-info-50')
  })

  it('renders default icon for each variant', () => {
    // Each variant produces exactly one SVG (the icon)
    for (const variant of ['success', 'error', 'warning', 'info'] as const) {
      const { container } = render(<StatusBanner variant={variant}>x</StatusBanner>)
      expect(container.querySelectorAll('svg').length).toBe(1)
    }
  })

  it('accepts a custom icon override', () => {
    const { container } = render(
      <StatusBanner variant="success" icon={Info}>x</StatusBanner>,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('preserves user className alongside variant classes', () => {
    const { container } = render(
      <StatusBanner variant="info" className="mt-4">x</StatusBanner>,
    )
    expect(container.firstChild).toHaveClass('mt-4')
    expect(container.firstChild).toHaveClass('bg-info-50')
  })
})
