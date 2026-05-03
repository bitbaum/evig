import { CheckCircle2 } from 'lucide-react'
import Heading from '@/components/ui/Heading'
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
          <div className="bg-primary-50 rounded-lg p-6 text-left">
            <Heading level={3} className="text-primary-800 mb-2">{t('consultationTitle')}</Heading>
            <p className="text-primary-700">
              {t('consultationText')}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, index) => (
            <div key={index} className="bg-neutral-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-start mb-6">
                <div className="p-3 bg-primary-100 rounded-lg text-primary-600 mr-4">
                  <service.icon className="w-8 h-8" />
                </div>
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
