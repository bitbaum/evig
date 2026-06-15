/**
 * ComparisonSection Component
 * 
 * Reusable section for displaying comparison groups
 * 
 * Created: 2025-12-17
 * Last Modified: 2026-06-15
 * Last Modified Summary: ui-public-card replaces shadow-lg on static comparison cards
 */

import { Comparison } from '../data'
import { ComparisonCard } from './ComparisonCard'
import { getTextColor } from '@/lib/design-system'
import { cn } from '@/lib/utils'

interface ComparisonSectionProps {
  title: string
  comparisons: Comparison[]
}

export function ComparisonSection({ title, comparisons }: ComparisonSectionProps) {
  return (
    <div className="mb-12 sm:mb-16">
      <h3 className={cn('text-2xl font-bold mb-6 sm:mb-8 text-center', getTextColor('white', 'primary'))}>
        {title}
      </h3>
      <div className="space-y-8 sm:space-y-12">
        {comparisons.map((comparison, index) => (
          <div key={index} className="ui-public-card">
            <h4 className={cn('text-xl sm:text-2xl font-bold mb-6 sm:mb-8 text-center', getTextColor('neutral', 'primary'))}>
              {comparison.category}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <ComparisonCard item={comparison.openSource} variant="openSource" />
              <ComparisonCard item={comparison.proprietary} variant="proprietary" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}



