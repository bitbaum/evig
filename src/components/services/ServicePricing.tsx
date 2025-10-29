/**
 * ServicePricing Component
 * 
 * Reusable pricing section for service pages.
 * Supports media prices for data recovery service.
 */

import { CheckCircle2 } from 'lucide-react'
import { ServicePricing } from '@/data/services'

interface ServicePricingProps {
  pricing: ServicePricing
}

export default function ServicePricingSection({ pricing }: ServicePricingProps) {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-8 text-center">Preise</h2>
          <div className="text-center mb-8">
            <p className="text-2xl font-bold text-primary-600">{pricing.base}</p>
          </div>
          <div className="space-y-4">
            {pricing.details.map((detail, index) => (
              <div key={index} className="flex items-center">
                <CheckCircle2 className="w-5 h-5 text-primary-500 mr-3" />
                <span className="text-gray-600">{detail}</span>
              </div>
            ))}
          </div>
          
          {pricing.mediaPrices && pricing.mediaPrices.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-bold mb-4 text-center">Medienkosten</h3>
              <div className="space-y-3">
                {pricing.mediaPrices.map((price, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-primary-500 mr-3" />
                    <span className="text-gray-600">{price}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

