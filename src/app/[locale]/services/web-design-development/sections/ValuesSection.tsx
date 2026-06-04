import Heading from '@/components/ui/Heading'
import { getTranslations } from 'next-intl/server'
import {
  Code,
  Globe,
  Shield,
  Zap,
  Users,
  Monitor,
  Heart,
  Database,
} from 'lucide-react'

const VALUE_ICONS = [Code, Globe, Shield, Database, Heart, Zap, Users, Monitor]

const VALUE_STYLES = [
  { borderColor: 'border-primary-500', bgColor: 'bg-primary-100 dark:bg-primary-900/30', iconColor: 'text-action', titleColor: 'text-primary-800 dark:text-primary-300' },
  { borderColor: 'border-primary-400', bgColor: 'bg-primary-100 dark:bg-primary-900/30', iconColor: 'text-action', titleColor: 'text-primary-800 dark:text-primary-300' },
  { borderColor: 'border-info-500', bgColor: 'bg-info-100', iconColor: 'text-info-600', titleColor: 'text-info-800' },
  { borderColor: 'border-secondary-500', bgColor: 'bg-secondary-100', iconColor: 'text-secondary-600', titleColor: 'text-secondary-800' },
  { borderColor: 'border-warning-500', bgColor: 'bg-warning-100 dark:bg-warning-900/30', iconColor: 'text-warning-600', titleColor: 'text-warning-800 dark:text-warning-400' },
  { borderColor: 'border-error-500', bgColor: 'bg-error-100', iconColor: 'text-error-600', titleColor: 'text-error-800' },
  { borderColor: 'border-info-700', bgColor: 'bg-info-100', iconColor: 'text-info-700', titleColor: 'text-info-900' },
  { borderColor: 'border-neutral-400', bgColor: 'bg-surface-raised', iconColor: 'text-text-secondary', titleColor: 'text-neutral-800' },
]

const VALUE_KEYS = ['openSource', 'decentralization', 'privacyFirst', 'ownYourData', 'ownYourCode', 'maxAutomation', 'userExperience', 'developerExperience'] as const

export async function ValuesSection() {
  const t = await getTranslations('services.webDesign.values')

  const coreValues = VALUE_KEYS.map((key, i) => ({
    icon: VALUE_ICONS[i],
    title: t(`${key}.title`),
    description: t(`${key}.description`),
    ...VALUE_STYLES[i],
  }))

  return (
    <section className="py-12 sm:py-16 md:py-20 bg-surface-raised dark:bg-neutral-900">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <Heading level={2} className="mb-6 text-neutral-800">{t('title')}</Heading>
          <p className="text-xl text-text-secondary mb-8"
            dangerouslySetInnerHTML={{ __html: t.raw('subtitle') as string }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreValues.map((value, index) => (
            <div key={index} className={`bg-surface-base rounded-xl p-6 border border-l-4 ${value.borderColor} hover:border-neutral-300 dark:hover:border-white/12 transition-colors duration-300`}>
              <div className="text-center">
                <div className={`w-14 h-14 ${value.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <value.icon className={`w-7 h-7 ${value.iconColor}`} />
                </div>
                <Heading level={3} className={`mb-3 ${value.titleColor}`}>{value.title}</Heading>
                <p className="text-text-secondary text-sm">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
