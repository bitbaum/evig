import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Mail, Phone, MapPin, Clock, Map as MapIcon, Shield, MessageCircle } from 'lucide-react'
import { STORE_GOOGLE_MAPS_URL, STORE_OSM_URL, WAREHOUSE_GOOGLE_MAPS_URL, WAREHOUSE_OSM_URL } from '@/lib/constants'
import { ORG, CONTACT, LOCATIONS, OPENING_HOURS } from '@/config/org'
import Heading from '@/components/ui/Heading'
import { PageHero } from '@/components/layout/PageHero'
import { getTranslations } from 'next-intl/server'

import ContactForm from './ContactForm'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description')
  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function ContactPage() {
  const t = await getTranslations('contact')

  const contactInfo = [
    {
      title: t('info.email'),
      value: CONTACT.email,
      icon: Mail,
      link: `mailto:${CONTACT.email}`,
    },
    {
      title: t('info.phone'),
      value: CONTACT.phone,
      icon: Phone,
      link: CONTACT.phoneTel,
    },
    {
      title: t('info.address'),
      value: `${LOCATIONS.store.street}\n${LOCATIONS.store.postalCode} ${LOCATIONS.store.city}\n${LOCATIONS.store.country}`,
      icon: MapPin,
      link: LOCATIONS.store.googleMapsUrl,
    },
    {
      title: t('info.openingHours'),
      value: OPENING_HOURS.formatted,
      icon: Clock,
    }
  ]

  return (
    <main>
      {/* Hero Section */}
      <PageHero
        theme="contact"
        icon={MessageCircle}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />

      {/* Contact Information Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {contactInfo.map((info, index) => (
              <div key={index} className="bg-green-50 rounded-xl p-4 sm:p-6 text-center">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <info.icon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
                <Heading level={3} className="text-base sm:text-lg font-semibold text-green-700 mb-2">{info.title}</Heading>
                {info.link ? (
                  <a
                    href={info.link}
                    className="text-gray-600 hover:text-green-600 transition-colors duration-200"
                  >
                    {info.value}
                  </a>
                ) : (
                  <p className="text-gray-600">{info.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <Heading level={2} className="mb-6 sm:mb-8 text-center">{t('map.title')}</Heading>
            <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden shadow-lg">
              <iframe
                src={LOCATIONS.store.googleMapsEmbedUrl}
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
            <div className="mt-6 sm:mt-8 text-center space-y-3 sm:space-y-4">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                <a
                  href={STORE_GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                >
                  <MapPin className="w-4 h-4 mr-2" /> {t('map.openGoogleMaps')}
                </a>
                <a
                  href={STORE_OSM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  <MapIcon className="w-4 h-4 mr-2" /> {t('map.openOSM')}
                </a>
              </div>

              {/* Explanation about map choices */}
              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 w-4 h-4 text-green-700 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 mb-1">{t('map.mapChoiceTitle')}</p>
                    <p>
                      {t('map.mapChoiceDescription')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-600 mb-3">{t('map.warehouseNote', { address: LOCATIONS.warehouse.full, note: LOCATIONS.warehouse.note })}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <a
                    href={WAREHOUSE_GOOGLE_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-green-600 hover:text-green-700"
                  >
                    <MapPin className="w-4 h-4 mr-1" /> {t('map.warehouseGoogleMaps')}
                  </a>
                  <a
                    href={WAREHOUSE_OSM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-green-600 hover:text-green-700"
                  >
                    <MapIcon className="w-4 h-4 mr-1" /> {t('map.warehouseOSM')}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
