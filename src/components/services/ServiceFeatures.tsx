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
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-start mb-6">
                <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                  <feature.icon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

