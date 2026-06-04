/**
 * ServicesSection Component
 * 
 * Reusable section for displaying services/features
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Created reusable services section component
 */

import { Feature } from '../data'
import { getTextColor } from '@/lib/design-system'
import { cn } from '@/lib/utils'

interface ServicesSectionProps {
  features: Feature[]
}

export function ServicesSection({ features }: ServicesSectionProps) {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-surface-raised">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className={cn('text-3xl font-bold mb-8 sm:mb-12 text-center', getTextColor('neutral', 'primary'))}>
          Unsere Dienstleistungen
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="bg-surface-base rounded-xl p-6 sm:p-8 shadow-lg dark:shadow-black/30 border-2 border">
                <div className="flex items-start mb-6">
                  <div className="p-3 bg-success-100 rounded-lg text-success-600 mr-4">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className={cn('text-xl sm:text-2xl font-bold mb-3', getTextColor('white', 'primary'))}>
                      {feature.title}
                    </h3>
                    <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}



