import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'
import type { BusinessPlanUi, Cite } from '../types'

export function formatStepLabel(template: string, step: number): string {
  return template.replace('{n}', String(step))
}

export function formatCitationAria(template: string, n: number): string {
  return template.replace('{n}', String(n))
}

export function Cite({
  k,
  citeMap,
  ui,
}: {
  k: Cite
  citeMap: Map<string, number>
  ui: BusinessPlanUi
}) {
  if (!k) return null
  const n = citeMap.get(k)
  if (!n) return null
  return (
    <a
      href={`#belege-${k}`}
      className="ml-1 inline-flex align-baseline rounded-sm bg-surface-raised px-1 text-[10px] font-mono text-text-tertiary no-underline hover:bg-action-muted hover:text-action"
      aria-label={formatCitationAria(ui.citationAria, n)}
    >
      [{n}]
    </a>
  )
}

export function Section({
  id,
  tone = 'canvas',
  children,
}: {
  id: string
  tone?: 'canvas' | 'raised' | 'base'
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className={cn(
        'border-b border-subtle scroll-mt-24 sm:scroll-mt-28',
        tone === 'canvas' && 'bg-canvas',
        tone === 'raised' && 'bg-surface-raised -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-0 lg:px-0',
        tone === 'base' && 'bg-surface-base -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-0 lg:px-0',
      )}
    >
      <div className="py-14 sm:py-16">{children}</div>
    </section>
  )
}

export function CriteriaCard({
  variant,
  title,
  items,
  cite,
  citeMap,
  ui,
}: {
  variant: 'accept' | 'reject'
  title: string
  items: string[]
  cite: Cite
  citeMap: Map<string, number>
  ui: BusinessPlanUi
}) {
  const Icon = variant === 'accept' ? Check : X
  return (
    <div className="min-w-0 rounded-xl border border-subtle bg-surface-base p-6">
      <h3 className="font-mono text-xs uppercase tracking-[0.18em] text-action">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm text-text-secondary">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <Icon
              className={cn(
                'mt-0.5 h-4 w-4 shrink-0',
                variant === 'accept' ? 'text-action' : 'text-text-tertiary',
              )}
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-text-tertiary">
        {ui.source}
        <Cite k={cite} citeMap={citeMap} ui={ui} />
      </p>
    </div>
  )
}

export function SourceLine({
  cite,
  citeMap,
  ui,
}: {
  cite: Cite
  citeMap: Map<string, number>
  ui: BusinessPlanUi
}) {
  return (
    <p className="mt-3 text-xs text-text-tertiary">
      {ui.source}
      <Cite k={cite} citeMap={citeMap} ui={ui} />
    </p>
  )
}

export function DisclosureSummary({
  badge,
  title,
}: {
  badge: string
  title: string
}) {
  return (
    <>
      <span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-tertiary mr-2">
          {badge}
        </span>
        {title}
      </span>
      <span aria-hidden="true" className="font-mono text-text-tertiary transition-transform group-open:rotate-180">
        ⌄
      </span>
    </>
  )
}
