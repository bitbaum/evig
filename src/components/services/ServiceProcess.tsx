/**
 * ServiceProcess Component
 * 
 * Reusable process steps for service pages.
 * Shows 4-step process with numbered circles.
 */

import { ServiceProcess } from '@/data/services'

interface ServiceProcessProps {
  process: ServiceProcess[]
}

export default function ServiceProcessSection({ process }: ServiceProcessProps) {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center">Unser Prozess</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {process.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-3 sm:mb-4">
                {step.step}
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3">{step.title}</h3>
              <p className="text-sm sm:text-base text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

