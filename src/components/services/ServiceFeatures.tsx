/**
 * ServiceFeatures Component
 * 
 * Reusable features grid for service pages.
 * Maintains existing beautiful card design.
 */

import type { ServiceFeature } from '@/lib/services'
import { getTextColor } from '@/lib/design-system'
import { cn } from '@/lib/utils'

interface ServiceFeaturesProps {
  features: ServiceFeature[]
}

export default function ServiceFeatures({ features }: ServiceFeaturesProps) {
  return (
    <section className="py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
          {features.map((feature, index) => (
            <div key={index} className="bg-surface-base rounded-xl p-6 sm:p-8 border">
              <div className="flex items-start mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 bg-success-100 rounded-lg text-success-600 mr-3 sm:mr-4 shrink-0">
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn('text-xl sm:text-2xl font-bold mb-2 sm:mb-3', getTextColor('white', 'primary'))}>{feature.title}</h3>
                  <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

