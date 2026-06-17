'use client'

/**
 * AdminHeroStatus — single-action landing primitive for admin sections.
 *
 * Why: admin section landings used to show 4 dead-zero stat cards that
 * didn't tell the operator what to do next, often paired with the
 * white-on-light-green contrast bug (text-action-text on bg-action-muted).
 * This primitive replaces that pattern with:
 *
 *   1. A single headline that names the most important pending state
 *      ("X dringende Anfragen warten"), with a tone-coded surface
 *      (urgent/attention/empty/healthy) and a primary CTA pointing at it.
 *   2. A compact KPI strip below the headline (tabular-nums, text-sm)
 *      preserving the numbers as informational secondary content.
 *
 * The caller derives state in plain TS (no business logic in this
 * primitive) and passes a tone + headline + sub + cta + kpis array.
 * SoC: this file knows about colors + layout, nothing else.
 */

import { ComponentType, ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  CheckCircle,
  CheckSquare,
  Clock,
  AlertTriangle,
  HelpCircle,
  Image as ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Icon registry — a Server Component CANNOT pass an icon *component* across the
 * RSC boundary into this Client Component (React throws "Functions cannot be
 * passed directly to Client Components"). Server callers must pass a string
 * name from this registry instead. Client-Component callers may still pass a
 * component directly (there is no serialization boundary for them).
 */
const HERO_ICONS = {
  check: CheckCircle2,
  checkCircle: CheckCircle,
  checkSquare: CheckSquare,
  clock: Clock,
  alert: AlertTriangle,
  help: HelpCircle,
  image: ImageIcon,
} as const

export type HeroIconName = keyof typeof HERO_ICONS

export type HeroTone = 'urgent' | 'attention' | 'empty' | 'healthy'

export interface HeroKpi {
  label: string
  value: number | string
}

interface CtaOnClick {
  label: string
  onClick: () => void
}
interface CtaLink {
  label: string
  href: string
}
export type HeroCta = CtaOnClick | CtaLink

export interface AdminHeroStatusProps {
  tone: HeroTone
  /**
   * Icon to render. Server Components MUST pass a {@link HeroIconName} string
   * (e.g. "check"); Client Components may pass a component directly.
   */
  icon: HeroIconName | ComponentType<{ className?: string }>
  headline: string
  sub: string
  cta?: HeroCta
  kpis: HeroKpi[]
  /** Optional extra content slot below the KPI strip (e.g. inline action chips). */
  children?: ReactNode
}

const TONE_SURFACE: Record<HeroTone, string> = {
  urgent: 'bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800',
  attention: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800',
  empty: 'bg-surface-raised border-strong',
  healthy: 'bg-surface-raised border-subtle',
}

const TONE_ICON: Record<HeroTone, string> = {
  urgent: 'text-error-600 dark:text-error-400',
  attention: 'text-warning-600 dark:text-warning-400',
  empty: 'text-text-tertiary',
  healthy: 'text-action',
}

function isLinkCta(cta: HeroCta): cta is CtaLink {
  return 'href' in cta
}

export function AdminHeroStatus({
  tone,
  icon,
  headline,
  sub,
  cta,
  kpis,
  children,
}: AdminHeroStatusProps) {
  const Icon = typeof icon === 'string' ? HERO_ICONS[icon] : icon
  return (
    <div className={`rounded-xl border p-5 sm:p-6 ${TONE_SURFACE[tone]}`}>
      <div className="flex items-start gap-4">
        <div className={`shrink-0 rounded-lg p-2 bg-surface-base/60 dark:bg-surface-base/30 ${TONE_ICON[tone]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-semibold text-text-primary leading-tight">
            {headline}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">{sub}</p>
        </div>
        {cta && (
          isLinkCta(cta) ? (
            <Button as={Link} href={cta.href} variant="primary" size="sm" className="shrink-0 inline-flex items-center gap-2">
              {cta.label}
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={cta.onClick} variant="primary" size="sm" className="shrink-0 inline-flex items-center gap-2">
              {cta.label}
              <ArrowRight className="w-4 h-4" />
            </Button>
          )
        )}
      </div>

      {kpis.length > 0 && (
        <dl className={`mt-5 grid gap-3 text-sm ${kpis.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {kpis.map((k) => (
            <div key={k.label} className="flex flex-col">
              <dt className="text-xs text-text-tertiary">{k.label}</dt>
              <dd className="font-mono font-medium tabular-nums text-text-primary">{k.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {children}
    </div>
  )
}
