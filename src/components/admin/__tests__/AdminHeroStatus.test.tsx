/**
 * AdminHeroStatus primitive tests
 * Verifies tone-coded surface classes, CTA dispatch (onClick vs link),
 * KPI grid layout, and the headline + sub + icon rendering.
 */

import { render, fireEvent } from '@testing-library/react'
import { AlertTriangle, ShoppingBag } from 'lucide-react'
import { AdminHeroStatus } from '../AdminHeroStatus'

describe('AdminHeroStatus', () => {
  it('renders headline + sub + icon', () => {
    const { getByText, container } = render(
      <AdminHeroStatus
        tone="urgent"
        icon={AlertTriangle}
        headline="2 dringende Anfragen warten"
        sub="Schnelle Reaktion verhindert Abspringen."
        kpis={[]}
      />,
    )
    expect(getByText('2 dringende Anfragen warten')).toBeInTheDocument()
    expect(getByText('Schnelle Reaktion verhindert Abspringen.')).toBeInTheDocument()
    // Lucide icons render as SVGs
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('applies urgent tone classes', () => {
    const { container } = render(
      <AdminHeroStatus tone="urgent" icon={AlertTriangle} headline="x" sub="y" kpis={[]} />,
    )
    expect(container.firstChild).toHaveClass('bg-error-50')
    expect(container.firstChild).toHaveClass('border-error-200')
  })

  it('applies attention tone classes', () => {
    const { container } = render(
      <AdminHeroStatus tone="attention" icon={AlertTriangle} headline="x" sub="y" kpis={[]} />,
    )
    expect(container.firstChild).toHaveClass('bg-warning-50')
  })

  it('applies healthy tone classes', () => {
    const { container } = render(
      <AdminHeroStatus tone="healthy" icon={ShoppingBag} headline="x" sub="y" kpis={[]} />,
    )
    expect(container.firstChild).toHaveClass('bg-surface-raised')
    expect(container.firstChild).toHaveClass('border-subtle')
  })

  it('renders an onClick CTA and dispatches click', () => {
    const onClick = jest.fn()
    const { getByRole } = render(
      <AdminHeroStatus
        tone="urgent"
        icon={AlertTriangle}
        headline="x"
        sub="y"
        cta={{ label: 'Dringende anzeigen', onClick }}
        kpis={[]}
      />,
    )
    const btn = getByRole('button', { name: /Dringende anzeigen/ })
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('renders a link CTA with href', () => {
    const { getByText } = render(
      <AdminHeroStatus
        tone="empty"
        icon={ShoppingBag}
        headline="x"
        sub="y"
        cta={{ label: 'Techniker ansehen', href: '/it-hilfe/techniker' }}
        kpis={[]}
      />,
    )
    const link = getByText('Techniker ansehen').closest('a')
    expect(link).toHaveAttribute('href', '/it-hilfe/techniker')
  })

  it('omits CTA section when no cta prop', () => {
    const { container } = render(
      <AdminHeroStatus tone="healthy" icon={ShoppingBag} headline="x" sub="y" kpis={[]} />,
    )
    expect(container.querySelector('a')).toBeNull()
    expect(container.querySelector('button')).toBeNull()
  })

  it('renders the KPI strip with label + value pairs', () => {
    const { getByText } = render(
      <AdminHeroStatus
        tone="healthy"
        icon={ShoppingBag}
        headline="x"
        sub="y"
        kpis={[
          { label: 'Offen', value: 0 },
          { label: 'Lösungsrate', value: '85%' },
        ]}
      />,
    )
    expect(getByText('Offen')).toBeInTheDocument()
    expect(getByText('0')).toBeInTheDocument()
    expect(getByText('Lösungsrate')).toBeInTheDocument()
    expect(getByText('85%')).toBeInTheDocument()
  })

  it('uses 2-col grid for <=2 KPIs, 4-col for more', () => {
    const { container: c2 } = render(
      <AdminHeroStatus tone="healthy" icon={ShoppingBag} headline="x" sub="y" kpis={[
        { label: 'a', value: 1 },
        { label: 'b', value: 2 },
      ]} />,
    )
    expect(c2.querySelector('dl')).toHaveClass('grid-cols-2')
    expect(c2.querySelector('dl')).not.toHaveClass('sm:grid-cols-4')

    const { container: c4 } = render(
      <AdminHeroStatus tone="healthy" icon={ShoppingBag} headline="x" sub="y" kpis={[
        { label: 'a', value: 1 },
        { label: 'b', value: 2 },
        { label: 'c', value: 3 },
        { label: 'd', value: 4 },
      ]} />,
    )
    expect(c4.querySelector('dl')).toHaveClass('sm:grid-cols-4')
  })

  it('omits KPI strip when kpis array is empty', () => {
    const { container } = render(
      <AdminHeroStatus tone="healthy" icon={ShoppingBag} headline="x" sub="y" kpis={[]} />,
    )
    expect(container.querySelector('dl')).toBeNull()
  })

  it('renders children below the KPI strip', () => {
    const { getByText } = render(
      <AdminHeroStatus
        tone="healthy"
        icon={ShoppingBag}
        headline="x"
        sub="y"
        kpis={[{ label: 'a', value: 1 }]}
      >
        <div data-testid="extra">extra slot</div>
      </AdminHeroStatus>,
    )
    expect(getByText('extra slot')).toBeInTheDocument()
  })
})
