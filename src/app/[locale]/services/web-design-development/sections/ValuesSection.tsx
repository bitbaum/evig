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
  { borderColor: 'border-primary-500', bgColor: 'bg-primary-100', iconColor: 'text-primary-600', titleColor: 'text-primary-800' },
  { borderColor: 'border-primary-400', bgColor: 'bg-primary-100', iconColor: 'text-primary-600', titleColor: 'text-primary-800' },
  { borderColor: 'border-purple-500', bgColor: 'bg-purple-100', iconColor: 'text-purple-600', titleColor: 'text-purple-800' },
  { borderColor: 'border-orange-500', bgColor: 'bg-orange-100', iconColor: 'text-orange-600', titleColor: 'text-orange-800' },
  { borderColor: 'border-teal-500', bgColor: 'bg-teal-100', iconColor: 'text-teal-600', titleColor: 'text-teal-800' },
  { borderColor: 'border-rose-500', bgColor: 'bg-rose-100', iconColor: 'text-rose-600', titleColor: 'text-rose-800' },
  { borderColor: 'border-indigo-500', bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600', titleColor: 'text-indigo-800' },
  { borderColor: 'border-cyan-500', bgColor: 'bg-cyan-100', iconColor: 'text-cyan-600', titleColor: 'text-cyan-800' },
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
    <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-neutral-900 dark:to-neutral-950">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <Heading level={2} className="mb-6 text-neutral-800">{t('title')}</Heading>
          <p className="text-xl text-neutral-600 mb-8"
            dangerouslySetInnerHTML={{ __html: t.raw('subtitle') as string }}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {coreValues.map((value, index) => (
            <div key={index} className={`bg-white rounded-xl p-6 shadow-xl border-l-4 ${value.borderColor} hover:shadow-2xl transition-shadow duration-300`}>
              <div className="text-center">
                <div className={`w-14 h-14 ${value.bgColor} rounded-full flex items-center justify-center mx-auto mb-3`}>
                  <value.icon className={`w-7 h-7 ${value.iconColor}`} />
                </div>
                <Heading level={3} className={`mb-3 ${value.titleColor}`}>{value.title}</Heading>
                <p className="text-neutral-600 text-sm">{value.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
