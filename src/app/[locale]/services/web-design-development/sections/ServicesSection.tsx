import { CheckCircle2 } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { IconBadge } from '@/components/ui/IconBadge'
import { getTranslations } from 'next-intl/server'
import { Code, Palette, Globe, Shield } from 'lucide-react'

const SERVICE_ICONS = [Code, Palette, Globe, Shield]
const SERVICE_KEYS = ['customDev', 'responsiveDesign', 'cmsDev', 'maintenance'] as const

export async function ServicesSection() {
  const t = await getTranslations('services.webDesign.servicesSection')

  const services = SERVICE_KEYS.map((key, i) => ({
    icon: SERVICE_ICONS[i],
    title: t(`items.${key}.title`),
    description: t(`items.${key}.description`),
    features: t.raw(`items.${key}.features`) as string[],
  }))

  return (
    <section id="services" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <Heading level={2} className="mb-6">{t('title')}</Heading>
          <p className="text-lg text-neutral-600 mb-4">
            {t('subtitle')}
          </p>
          <div className="text-primary-600 font-semibold text-xl mb-8">
            {t('pricing')}
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-6 text-left border border-neutral-200 dark:border-white/[0.06]">
            <Heading level={3} className="text-neutral-900 dark:text-white mb-2">{t('consultationTitle')}</Heading>
            <p className="text-neutral-700 dark:text-neutral-300">
              {t('consultationText')}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-8 border border-neutral-200 dark:border-white/[0.06] hover:border-neutral-300 dark:hover:border-white/[0.12] transition-colors duration-300">
              <div className="flex items-start mb-6">
                <IconBadge icon={service.icon} theme="services" size="lg" className="mr-4" />
                <div>
                  <Heading level={3} className="mb-3">{service.title}</Heading>
                  <p className="text-neutral-600 mb-4">{service.description}</p>
                </div>
              </div>
              <div className="space-y-2">
                {service.features.map((feature, i) => (
                  <div key={i} className="flex items-center text-neutral-600">
                    <CheckCircle2 className="w-5 h-5 text-primary-500 mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
