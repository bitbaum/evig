import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'
import { Code, Database, Shield, Globe, Heart, Rocket } from 'lucide-react'

const REASON_ICONS = [Code, Database, Shield, Globe, Heart, Rocket]
const REASON_KEYS = ['ownCode', 'ownData', 'privacyByDesign', 'decentralized', 'openSourceBase', 'futureProof'] as const

export async function WhyOpenSourceSection() {
  const t = await getTranslations('services.webDesign.whyOpenSource')

  const reasons = REASON_KEYS.map((key, i) => ({
    icon: REASON_ICONS[i],
    title: t(`items.${key}.title`),
    description: t(`items.${key}.description`),
  }))

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-surface-raised">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Heading level={2} className="mb-6">{t('title')}</Heading>
          <p className="text-lg text-text-secondary">
            {t('subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reasons.map((reason, index) => (
            <div key={index} className="bg-surface-base rounded-xl p-6 border hover:border-strong transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-action-muted-muted rounded-lg text-action mr-4">
                  <reason.icon className="w-6 h-6" />
                </div>
                <Heading level={3} className="">{reason.title}</Heading>
              </div>
              <p className="text-text-secondary">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
