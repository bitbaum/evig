/**
 * ServiceFeatures Component
 * 
 * Reusable features grid for service pages.
 * Maintains existing beautiful card design.
 */

import { ServiceFeature } from '@/data/services'

interface ServiceFeaturesProps {
  features: ServiceFeature[]
}

export default function ServiceFeatures({ features }: ServiceFeaturesProps) {
  return (
    <section className="py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-start mb-4 sm:mb-6">
                <div className="p-2 sm:p-3 bg-green-100 rounded-lg text-green-600 mr-3 sm:mr-4 flex-shrink-0">
                  <feature.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

