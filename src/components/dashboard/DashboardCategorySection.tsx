/**
 * Dashboard Category Section Component
 * 
 * Displays a category of dashboard cards with header.
 * Following dev guide: docs/development/DEV_GUIDE.md - DRY principle
 * 
 * Created: 2026-01-05
 * Last Modified: 2026-01-05
 * Last Modified Summary: Initial category section component
 */

import { DashboardCard } from './DashboardCard'
import { cn } from '@/lib/utils'
import { getTextColor } from '@/lib/design-system'
import type { DashboardCategory, DashboardCard as DashboardCardType } from '@/config/dashboard'
import { DASHBOARD_CATEGORIES } from '@/config/dashboard'

interface DashboardCategorySectionProps {
  category: DashboardCategory
  cards: DashboardCardType[]
  className?: string
}

export function DashboardCategorySection({ 
  category, 
  cards, 
  className 
}: DashboardCategorySectionProps) {
  if (cards.length === 0) {
    return null
  }

  const categoryConfig = DASHBOARD_CATEGORIES[category]

  return (
    <section className={cn('mb-8', className)}>
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{categoryConfig.icon}</span>
          <div>
            <h2 className={cn(
              'text-xl font-semibold',
              getTextColor('neutral', 'primary'),
              'dark:text-white'
            )}>
              {categoryConfig.title}
            </h2>
            <p className={cn(
              'text-sm',
              getTextColor('neutral', 'muted'),
              'dark:text-neutral-400'
            )}>
              {categoryConfig.description}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {cards.map(card => (
          <DashboardCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  )
}
