/**
 * ComparisonSection Component
 * 
 * Reusable section for displaying comparison groups
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Created reusable comparison section component
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
          <div key={index} className="bg-surface-raised rounded-xl p-6 sm:p-8 shadow-lg dark:shadow-black/30 border-2 border">
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



