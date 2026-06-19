// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

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
    title: { absolute: title },
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
      <section className="py-12 sm:py-16 md:py-20 bg-surface-base">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="ui-public-eyebrow">{t('hero.title').toUpperCase()}</div>
            <Heading level={2} className="ui-public-display-md mt-3 sr-only">{t('hero.title')}</Heading>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
            {contactInfo.map((info, index) => (
              <article key={index} className="ui-public-card text-center bg-action-muted/30 border-action/20">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <info.icon className="w-6 h-6 sm:w-8 sm:h-8 text-action" aria-hidden="true" />
                </div>
                <h3 className="ui-public-card-title text-action">{info.title}</h3>
                {info.link ? (
                  <a
                    href={info.link}
                    className="text-text-secondary hover:text-action transition-colors duration-200"
                  >
                    {info.value}
                  </a>
                ) : (
                  <p className="ui-public-card-body whitespace-pre-line">{info.value}</p>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="ui-public-band py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="ui-public-eyebrow mb-3">{t('form.title').toUpperCase()}</div>
              <Heading level={2} className="ui-public-display-md mb-6 text-center">{t('form.title')}</Heading>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-surface-base">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="ui-public-eyebrow">{t('map.title').toUpperCase()}</div>
              <Heading level={2} className="ui-public-display-md mt-3">{t('map.title')}</Heading>
            </div>
            <div className="aspect-w-16 aspect-h-9 rounded-xl overflow-hidden border">
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
              <div className="flex flex-wrap justify-center gap-3">
                <a
                  href={STORE_GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-public-cta inline-flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" /> {t('map.openGoogleMaps')}
                </a>
                <a
                  href={STORE_OSM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-public-cta-ghost inline-flex items-center gap-2"
                >
                  <MapIcon className="w-4 h-4" /> {t('map.openOSM')}
                </a>
              </div>

              {/* Explanation about map choices */}
              <div className="mt-6 rounded-lg border bg-surface-raised p-4 text-sm text-text-secondary max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 w-4 h-4 text-action shrink-0" />
                  <div>
                    <p className="font-medium text-text-primary mb-1">{t('map.mapChoiceTitle')}</p>
                    <p>
                      {t('map.mapChoiceDescription')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border">
                <p className="text-text-secondary mb-3">{t('map.warehouseNote', { address: LOCATIONS.warehouse.full, note: LOCATIONS.warehouse.note })}</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <a
                    href={WAREHOUSE_GOOGLE_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-action hover:text-action"
                  >
                    <MapPin className="w-4 h-4 mr-1" /> {t('map.warehouseGoogleMaps')}
                  </a>
                  <a
                    href={WAREHOUSE_OSM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-action hover:text-action"
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
