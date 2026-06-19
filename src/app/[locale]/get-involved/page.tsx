// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Heart, Recycle, Users, Zap, Globe } from 'lucide-react'
import { ContactLink } from '@/components/ui/contact-link'
import { PageHero } from '@/components/layout/PageHero'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'

// Structural data — icons and hrefs only (text comes from translations)
const CORE_VALUE_ICONS = [Recycle, Users, Zap, Globe]

const INVOLVEMENT_HREFS = [
  '/get-involved/volunteer',
  '/get-involved/technical-experts',
  '/get-involved/internships',
  '/get-involved/work-reintegration',
  '/get-involved/partnerships',
  '/get-involved/donate',
  '/mitglied-werden',
]

// Partner institution URLs (names come from translations)
const PARTNER_URLS = [
  'https://www.integration-uster.ch',
  'https://www.rueti.ch',
  'https://www.heks.ch/',
  'https://www.stadt-zuerich.ch/aoz/de/index.html',
]

interface GetInvolvedPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: GetInvolvedPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'getInvolved' })
  const title = `${t('meta.title')} | ${ORG.name}`
  const description = t('meta.description')
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function GetInvolvedPage({ params }: GetInvolvedPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'getInvolved' })
  const tEye = await getTranslations({ locale, namespace: 'common.eyebrows' })

  const coreValueItems = t.raw('coreValues.items') as Array<{ title: string; description: string }>
  const optionItems = t.raw('options.items') as Array<{
    title: string
    description: string
    features: string[]
    cta: string
  }>
  const testimonialItems = t.raw('testimonials.items') as Array<{
    quote: string
    author: string
    role: string
  }>
  const partnerNames = t.raw('partners.names') as string[]

  return (
    <main className="min-h-screen">
      <PageHero
        theme="getInvolved"
        icon={Users}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      >
        <div className="ui-public-cta-row mt-8">
          <a href="#get-started" className="ui-public-cta">
            {t('hero.startBtn')}
          </a>
          <a href="#learn-more" className="ui-public-cta-ghost">
            {t('hero.learnBtn')}
          </a>
        </div>
      </PageHero>

      {/* Core Values Section */}
      <section id="learn-more" className="ui-public-band py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="ui-public-eyebrow">{t('coreValues.heading').toUpperCase()}</div>
            <h2 className="ui-public-display-lg mt-4">{t('coreValues.heading')}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {coreValueItems.map((value, index) => {
              const Icon = CORE_VALUE_ICONS[index]
              return (
                <article key={index} className="ui-public-card">
                  <Icon className="w-8 h-8 text-action" aria-hidden="true" />
                  <h3 className="ui-public-card-title mt-4">{value.title}</h3>
                  <p className="ui-public-card-body">{value.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      {/* Involvement Options */}
      <section id="get-started" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="ui-public-eyebrow">{t('options.heading').toUpperCase()}</div>
            <h2 className="ui-public-display-lg mt-4">{t('options.heading')}</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {optionItems.map((option, index) => (
              <article key={index} className="ui-public-card flex flex-col h-full">
                <Users className="w-8 h-8 text-action" aria-hidden="true" />
                <h3 className="ui-public-card-title mt-4">{option.title}</h3>
                <p className="ui-public-card-body grow">{option.description}</p>
                <ul className="mt-4 space-y-2">
                  {option.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-sm text-text-secondary">
                      <svg className="w-4 h-4 mr-2 text-action shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button as="a" href={INVOLVEMENT_HREFS[index]} variant="primary" className="w-full mt-6">
                  {option.cta}
                </Button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="ui-public-band py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="ui-public-eyebrow">{t('testimonials.heading').toUpperCase()}</div>
            <h2 className="ui-public-display-lg mt-4">{t('testimonials.heading')}</h2>
          </div>
          <div className="space-y-4">
            {testimonialItems.map((testimonial, index) => (
              <blockquote key={index} className="ui-public-card">
                <Heart className="w-6 h-6 text-action mb-3" aria-hidden="true" />
                <p className="ui-public-body-lg italic">&ldquo;{testimonial.quote}&rdquo;</p>
                <footer className="mt-4">
                  <div className="ui-public-prose-strong">{testimonial.author}</div>
                  <div className="ui-public-meta">{testimonial.role}</div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Institutions */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="ui-public-eyebrow">{t('partners.heading').toUpperCase()}</div>
            <h2 className="ui-public-display-lg mt-4">{t('partners.heading')}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partnerNames.map((name, index) => (
              <a
                key={index}
                href={PARTNER_URLS[index]}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-public-card flex-row items-center gap-3 hover:border-strong group"
              >
                <svg className="w-5 h-5 text-action shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="ui-public-card-body mt-0 group-hover:text-action transition-colors">
                  {name}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-subtle py-20 text-center">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="ui-public-eyebrow">{tEye('ready')}</div>
          <h2 className="ui-public-display-lg mt-4">{t('cta.heading')}</h2>
          <p className="ui-public-section-lede mt-6 mx-auto">{t('cta.body')}</p>
          <div className="ui-public-cta-row mt-10">
            <ContactLink className="ui-public-cta">
              {t('cta.contactBtn')}
            </ContactLink>
            <Link href="/workshops" className="ui-public-cta-ghost">
              {t('cta.workshopsBtn')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
