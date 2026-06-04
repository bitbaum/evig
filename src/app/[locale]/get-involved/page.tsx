// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Heart, Recycle, Users, Zap, Globe } from 'lucide-react'
import { ContactLink } from '@/components/ui/contact-link'
import { PageHero } from '@/components/layout/PageHero'
import { responsiveTypography, responsiveSpacing, responsiveButtons, responsiveGrid } from '@/lib/responsive'
import Heading from '@/components/ui/Heading'
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
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

export default async function GetInvolvedPage({ params }: GetInvolvedPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'getInvolved' })

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
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8">
          <Button as="a" href="#get-started" variant="primary">
            {t('hero.startBtn')}
          </Button>
          <a
            href="#learn-more"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium px-6 py-3 bg-surface-base text-action hover:bg-neutral-50 border-2 border-primary-600 transition-colors"
          >
            {t('hero.learnBtn')}
          </a>
        </div>
      </PageHero>

      {/* Core Values Section */}
      <section id="learn-more" className={`${responsiveSpacing.section} bg-surface-raised dark:bg-neutral-900`}>
        <div className={`${responsiveSpacing.container} mx-auto`}>
          <Heading level={2} className={`${responsiveTypography.section} text-center ${responsiveSpacing.mbLarge}`}>
            {t('coreValues.heading')}
          </Heading>
          <div className={responsiveGrid.cards}>
            {coreValueItems.map((value, index) => {
              const Icon = CORE_VALUE_ICONS[index]
              return (
                <div key={index} className={`card-shell ${responsiveSpacing.cardPadding} hover:border-neutral-300 transition-all duration-300`}>
                  <div className={`text-action ${responsiveSpacing.mbMedium}`}>
                    <Icon className="w-10 h-10 sm:w-12 sm:h-12" />
                  </div>
                  <Heading level={3} className={`${responsiveTypography.cardTitle} ${responsiveSpacing.mbSmall}`}>
                    {value.title}
                  </Heading>
                  <p className={`${responsiveTypography.body} text-text-secondary`}>
                    {value.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Involvement Options */}
      <section id="get-started" className={responsiveSpacing.section}>
        <div className={`${responsiveSpacing.container} mx-auto`}>
          <Heading level={2} className={`${responsiveTypography.section} text-center ${responsiveSpacing.mbLarge}`}>
            {t('options.heading')}
          </Heading>
          <div className={responsiveGrid.cards}>
            {optionItems.map((option, index) => (
              <div key={index} className={`card-shell ${responsiveSpacing.cardPadding} hover:border-neutral-300 transition-all duration-300 hover:-translate-y-1 flex flex-col h-full`}>
                <div className={`text-action ${responsiveSpacing.mbMedium}`}>
                  <Users className="w-10 h-10 sm:w-12 sm:h-12" />
                </div>
                <Heading level={3} className={`${responsiveTypography.cardTitle} ${responsiveSpacing.mbSmall}`}>
                  {option.title}
                </Heading>
                <p className={`${responsiveTypography.body} text-text-secondary ${responsiveSpacing.mbMedium} grow`}>
                  {option.description}
                </p>
                <ul className={`space-y-2 sm:space-y-3 ${responsiveSpacing.mbMedium}`}>
                  {option.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-text-secondary">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-primary-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={responsiveTypography.small}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button as="a" href={INVOLVEMENT_HREFS[index]} variant="primary" className={`${responsiveButtons.primary} w-full mt-auto`}>
                  {option.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={`${responsiveSpacing.section} bg-surface-raised dark:bg-neutral-900`}>
        <div className={`${responsiveSpacing.container} mx-auto`}>
          <Heading level={2} className={`${responsiveTypography.section} text-center ${responsiveSpacing.mbLarge}`}>
            {t('testimonials.heading')}
          </Heading>
          <div className="max-w-3xl mx-auto">
            {testimonialItems.map((testimonial, index) => (
              <div key={index} className={`card-shell ${responsiveSpacing.cardPadding}`}>
                <div className={`text-action ${responsiveSpacing.mbSmall}`}>
                  <Heart className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <blockquote className={`${responsiveTypography.lead} text-text-secondary ${responsiveSpacing.mbMedium} italic`}>
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className={`${responsiveTypography.cardTitle} font-semibold`}>{testimonial.author}</div>
                <div className={`${responsiveTypography.body} text-text-tertiary`}>{testimonial.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Institutions */}
      <section className={responsiveSpacing.section}>
        <div className={`${responsiveSpacing.container} mx-auto`}>
          <Heading level={2} className={`${responsiveTypography.section} text-center ${responsiveSpacing.mbLarge}`}>
            {t('partners.heading')}
          </Heading>
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {partnerNames.map((name, index) => (
                <a
                  key={index}
                  href={PARTNER_URLS[index]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center ${responsiveSpacing.cardPadding} card-shell hover:border-primary-300 transition-all duration-300 group`}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4 text-primary-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`${responsiveTypography.body} text-text-secondary group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300`}>
                    {name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`${responsiveSpacing.section} bg-primary-700 text-white`}>
        <div className={`${responsiveSpacing.container} mx-auto text-center`}>
          <Heading level={2} className={`${responsiveTypography.section} ${responsiveSpacing.mbSmall}`}>
            {t('cta.heading')}
          </Heading>
          <p className={`${responsiveTypography.lead} ${responsiveSpacing.mbMedium} max-w-2xl mx-auto text-primary-100`}>
            {t('cta.body')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <ContactLink variant="outline" size="lg" className="bg-white text-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20">
              {t('cta.contactBtn')}
            </ContactLink>
            <Link
              href="/workshops"
              className={`${responsiveButtons.large} bg-transparent border-2 border-white text-white hover:bg-white/10`}
            >
              {t('cta.workshopsBtn')}
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
