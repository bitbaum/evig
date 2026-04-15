import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'
import { Zap, Code, Smartphone, Search } from 'lucide-react'

const BENEFIT_ICONS = [Zap, Code, Smartphone, Search]
const BENEFIT_KEYS = ['automationFirst', 'openSourceBase', 'seamlessUX', 'devFriendly'] as const

export async function BenefitsSection() {
  const t = await getTranslations('services.webDesign.benefits')

  const benefits = BENEFIT_KEYS.map((key, i) => ({
    icon: BENEFIT_ICONS[i],
    title: t(`items.${key}.title`),
    description: t(`items.${key}.description`),
  }))

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Heading level={2} className="mb-6">{t('title')}</Heading>
          <p className="text-lg text-gray-600">
            {t('subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start">
                <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                  <benefit.icon className="w-8 h-8" />
                </div>
                <div>
                  <Heading level={3} className="mb-3">{benefit.title}</Heading>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
