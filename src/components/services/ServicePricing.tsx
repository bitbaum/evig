/**
 * ServicePricing Component
 * 
 * Reusable pricing section for service pages.
 * Supports media prices for data recovery service.
 */

import { CheckCircle2 } from 'lucide-react'
import type { ServicePricing } from '@/lib/services'
import { getTextColor } from '@/lib/design-system'
import { cn } from '@/lib/utils'
import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'

interface ServicePricingProps {
  pricing: ServicePricing
}

export default async function ServicePricingSection({ pricing }: ServicePricingProps) {
  const t = await getTranslations('services')

  return (
    <section className="py-12 sm:py-16 md:py-20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto bg-white rounded-xl p-6 sm:p-8 shadow-lg border-2 border-neutral-200">
          <Heading level={2} className={cn('text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center', getTextColor('white', 'primary'))}>{t('pricingTitle')}</Heading>
          <div className="text-center mb-6 sm:mb-8">
            <p className="text-xl sm:text-2xl font-bold text-primary-600">{pricing.base}</p>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {pricing.details.map((detail, index) => (
              <div key={index} className="flex items-start">
                <CheckCircle2 className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>{detail}</span>
              </div>
            ))}
          </div>
          
          {pricing.mediaPrices && pricing.mediaPrices.length > 0 && (
            <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t-2 border-neutral-200">
              <Heading level={3} className={cn('text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center', getTextColor('white', 'primary'))}>{t('mediaCostsTitle')}</Heading>
              <div className="space-y-2 sm:space-y-3">
                {pricing.mediaPrices.map((price, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>{price}</span>
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

