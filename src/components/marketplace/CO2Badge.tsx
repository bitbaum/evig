'use client'

/**
 * CO2Badge — estimated CO₂ savings for a reused device.
 *
 * Always renders with:
 *   • `~` prefix to signal estimate
 *   • An explicit "Schätzung" tag and a link to /transparenz/co2
 *
 * Returns null if the category has no defensible weight — never invent
 * a number for the sake of showing one. Credibility comes from
 * under-claiming and showing the math, not from a confident-looking
 * headline figure.
 */

import { Leaf } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { estimateCO2Savings } from '@/config/co2-impact'
import { cn } from '@/lib/utils'

interface CO2BadgeProps {
  category: string
  className?: string
}

export function CO2Badge({ category, className = '' }: CO2BadgeProps) {
  const t = useTranslations('components.co2Badge')
  const co2Saved = estimateCO2Savings(category)

  if (co2Saved == null || co2Saved <= 0) return null

  return (
    <div
      className={cn(
        'inline-flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-1.5',
        'bg-primary-50 dark:bg-primary-900/20',
        'border border-primary-200 dark:border-primary-800 rounded-full text-sm',
        className,
      )}
      title={t('tooltip')}
    >
      <span className="inline-flex items-center gap-1.5">
        <Leaf className="w-4 h-4 text-action flex-shrink-0" aria-hidden="true" />
        <span className="text-primary-700 dark:text-primary-300 font-medium">
          {t('saved', { amount: co2Saved })}
        </span>
      </span>
      <Link
        href="/transparenz/co2"
        className="text-xs text-action hover:underline underline-offset-2"
      >
        {t('estimate')} — {t('methodologyLink')}
      </Link>
    </div>
  )
}
