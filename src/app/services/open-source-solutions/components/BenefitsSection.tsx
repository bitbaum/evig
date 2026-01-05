/**
 * BenefitsSection Component
 * 
 * Reusable section for displaying benefits
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Created reusable benefits section component
 */

import { Benefit } from '../data'
import { getTextColor } from '@/lib/design-system'
import { cn } from '@/lib/utils'

interface BenefitsSectionProps {
  benefits: Benefit[]
}

export function BenefitsSection({ benefits }: BenefitsSectionProps) {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <h2 className={cn('text-3xl font-bold mb-6', getTextColor('white', 'primary'))}>
            Warum Open Source wählen?
          </h2>
          <p className={cn('text-lg', getTextColor('white', 'muted'))}>
            Open-Source-Software bietet einen überlegenen Wert, Sicherheit und Flexibilität im Vergleich zu proprietären Alternativen.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div key={index} className="bg-success-50 rounded-xl p-6 sm:p-8 border-2 border-success-200">
                <div className="flex items-center mb-4">
                  <Icon className="w-6 h-6 text-success-600 mr-3" />
                  <h3 className={cn('text-xl font-semibold', getTextColor('success', 'primary'))}>
                    {benefit.title}
                  </h3>
                </div>
                <p className={cn('text-sm sm:text-base', getTextColor('success', 'muted'))}>
                  {benefit.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}



