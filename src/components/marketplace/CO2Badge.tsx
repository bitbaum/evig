'use client'

import { Leaf } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { estimateCO2Savings } from '@/config/co2-impact'

interface CO2BadgeProps {
  category: string
  className?: string
}

/**
 * Displays estimated CO2 savings for a reused product.
 * Shows nothing if category has no weight estimate.
 */
export function CO2Badge({ category, className = '' }: CO2BadgeProps) {
  const t = useTranslations('components.co2Badge')
  const co2Saved = estimateCO2Savings(category)

  if (co2Saved == null || co2Saved === 0) return null

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-full text-sm ${className}`}
      title={t('tooltip')}
    >
      <Leaf className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" aria-hidden="true" />
      <span className="text-primary-700 dark:text-primary-300 font-medium">
        {t('saved', { amount: co2Saved })}
      </span>
    </div>
  )
}
