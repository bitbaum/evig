/**
 * ServiceProcess Component
 * 
 * Reusable process steps for service pages.
 * Shows 4-step process with numbered circles.
 */

import type { ServiceProcess } from '@/lib/services'
import { getTextColor } from '@/lib/design-system'
import { cn } from '@/lib/utils'

interface ServiceProcessProps {
  process: ServiceProcess[]
}

export default function ServiceProcessSection({ process }: ServiceProcessProps) {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-surface-raised">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className={cn('text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center', getTextColor('neutral', 'primary'))}>Unser Prozess</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {process.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-3 sm:mb-4">
                {step.step}
              </div>
              <h3 className={cn('text-lg sm:text-xl font-bold mb-2 sm:mb-3', getTextColor('neutral', 'primary'))}>{step.title}</h3>
              <p className={cn('text-sm sm:text-base', getTextColor('neutral', 'muted'))}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

