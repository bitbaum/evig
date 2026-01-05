/**
 * ComparisonCard Component
 * 
 * Reusable component for displaying open-source vs proprietary comparisons
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Created reusable comparison card component
 */

import { FileCheck, FileX, LucideIcon } from 'lucide-react'
import { getTextColor } from '@/lib/design-system'
import { cn } from '@/lib/utils'

interface ComparisonItem {
  name: string
  icon: LucideIcon
  cost: string
  comparisons: string[]
  examples?: string[]
}

interface ComparisonCardProps {
  item: ComparisonItem
  variant: 'openSource' | 'proprietary'
}

export function ComparisonCard({ item, variant }: ComparisonCardProps) {
  const isOpenSource = variant === 'openSource'
  const Icon = item.icon

  return (
    <div
      className={cn(
        'rounded-lg p-4 sm:p-6 border-2',
        isOpenSource
          ? 'bg-success-50 border-success-200'
          : 'bg-neutral-50 border-neutral-200'
      )}
    >
      <div className="flex items-center mb-4">
        <div
          className={cn(
            'p-3 rounded-lg mr-4',
            isOpenSource ? 'bg-success-100 text-success-600' : 'bg-neutral-100 text-neutral-600'
          )}
        >
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <h5 className={cn('text-xl sm:text-2xl font-bold', getTextColor(isOpenSource ? 'success' : 'neutral', 'primary'))}>
            {item.name}
          </h5>
          <p
            className={cn(
              'font-medium text-sm sm:text-base',
              isOpenSource ? 'text-success-600' : getTextColor('neutral', 'muted')
            )}
          >
            {isOpenSource ? 'Open Source' : 'Proprietär'} • {item.cost}
          </p>
        </div>
      </div>

      {item.examples && item.examples.length > 0 && (
        <div className="mb-6">
          <h6 className={cn('text-base sm:text-lg font-semibold mb-3', getTextColor(isOpenSource ? 'success' : 'neutral', 'primary'))}>
            Beliebte Beispiele:
          </h6>
          <ul className="space-y-2">
            {item.examples.map((example, i) => (
              <li key={i} className="flex items-start">
                <div
                  className={cn(
                    'p-1 rounded-full mr-3 mt-0.5',
                    isOpenSource ? 'bg-success-100' : 'bg-neutral-100'
                  )}
                >
                  {isOpenSource ? (
                    <FileCheck className="w-4 h-4 text-success-600" />
                  ) : (
                    <FileX className="w-4 h-4 text-neutral-500" />
                  )}
                </div>
                <span className={cn('text-sm sm:text-base', getTextColor(isOpenSource ? 'success' : 'neutral', 'muted'))}>
                  {example}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {item.examples && (
          <h6 className={cn('text-base sm:text-lg font-semibold mb-3', getTextColor(isOpenSource ? 'success' : 'neutral', 'primary'))}>
            {isOpenSource ? 'Wichtige Vorteile:' : 'Wichtige Merkmale:'}
          </h6>
        )}
        {item.comparisons.map((comparison, i) => (
          <div key={i} className="flex items-start">
            <div
              className={cn(
                'p-1 rounded-full mr-3 mt-0.5',
                isOpenSource ? 'bg-success-100' : 'bg-neutral-100'
              )}
            >
              {isOpenSource ? (
                <FileCheck className="w-4 h-4 text-success-600" />
              ) : (
                <FileX className="w-4 h-4 text-neutral-500" />
              )}
            </div>
            <span className={cn('text-sm sm:text-base', getTextColor(isOpenSource ? 'success' : 'neutral', 'muted'))}>
              {comparison}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}



