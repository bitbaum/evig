import Heading from '@/components/ui/Heading'
import { IconBadge } from '@/components/ui/IconBadge'
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
    <section className="py-12 sm:py-16 md:py-20 bg-neutral-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Heading level={2} className="mb-6">{t('title')}</Heading>
          <p className="text-lg text-neutral-600">
            {t('subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white dark:bg-neutral-900 rounded-xl p-8 border border-neutral-200 dark:border-white/[0.06] hover:border-neutral-300 dark:hover:border-white/[0.12] transition-colors duration-300">
              <div className="flex items-start">
                <IconBadge icon={benefit.icon} theme="services" size="lg" className="mr-4" />
                <div>
                  <Heading level={3} className="mb-3">{benefit.title}</Heading>
                  <p className="text-neutral-600">{benefit.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
