import Heading from '@/components/ui/Heading'
import { Card } from '@/components/ui/card'
import { IconBadge } from '@/components/ui/IconBadge'
import { getTranslations } from 'next-intl/server'
import { Zap, Code, Smartphone, Search } from 'lucide-react'
import { Section } from '@/components/layout/Section'

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
    <Section density="default" tone="tinted" contained={false}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Heading level={2} className="mb-6">{t('title')}</Heading>
          <p className="text-lg text-text-secondary">
            {t('subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="p-8 hover:border-strong dark:hover:border-white/12 transition-colors duration-300">
              <div className="flex items-start">
                <IconBadge icon={benefit.icon} theme="services" size="lg" className="mr-4" />
                <div>
                  <Heading level={3} className="mb-3">{benefit.title}</Heading>
                  <p className="text-text-secondary">{benefit.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  )
}
