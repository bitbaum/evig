// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Eyebrow } from '@/components/ui/Eyebrow'
import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Mail, MessageCircle } from 'lucide-react'
import { ORG, CONTACT } from '@/config/org'
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
            <Eyebrow as="div">{t('hero.title').toUpperCase()}</Eyebrow>
            <Heading level={2} className="ui-public-display-md mt-3 sr-only">{t('hero.title')}</Heading>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 max-w-md mx-auto">
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
              <Eyebrow as="div" className="mb-3">{t('form.title').toUpperCase()}</Eyebrow>
              <Heading level={2} className="ui-public-display-md mb-6 text-center">{t('form.title')}</Heading>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  )
}
