import { Metadata } from 'next'
import Link from 'next/link'
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
          <a
            href="#get-started"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white transition-colors"
          >
            {t('hero.startBtn')}
          </a>
          <a
            href="#learn-more"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium px-6 py-3 bg-white text-purple-600 hover:bg-gray-50 border-2 border-purple-600 transition-colors"
          >
            {t('hero.learnBtn')}
          </a>
        </div>
      </PageHero>

      {/* Core Values Section */}
      <section id="learn-more" className={`${responsiveSpacing.section} bg-gray-50`}>
        <div className={`${responsiveSpacing.container} mx-auto`}>
          <Heading level={2} className={`${responsiveTypography.section} text-center ${responsiveSpacing.mbLarge}`}>
            {t('coreValues.heading')}
          </Heading>
          <div className={responsiveGrid.cards}>
            {coreValueItems.map((value, index) => {
              const Icon = CORE_VALUE_ICONS[index]
              return (
                <div key={index} className={`bg-white rounded-xl ${responsiveSpacing.cardPadding} shadow-lg hover:shadow-xl transition-all duration-300`}>
                  <div className={`text-green-600 ${responsiveSpacing.mbMedium}`}>
                    <Icon className="w-10 h-10 sm:w-12 sm:h-12" />
                  </div>
                  <Heading level={3} className={`${responsiveTypography.cardTitle} ${responsiveSpacing.mbSmall}`}>
                    {value.title}
                  </Heading>
                  <p className={`${responsiveTypography.body} text-gray-600`}>
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
              <div key={index} className={`bg-white rounded-xl shadow-lg ${responsiveSpacing.cardPadding} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 flex flex-col h-full`}>
                <div className={`text-green-600 ${responsiveSpacing.mbMedium}`}>
                  <Users className="w-10 h-10 sm:w-12 sm:h-12" />
                </div>
                <Heading level={3} className={`${responsiveTypography.cardTitle} ${responsiveSpacing.mbSmall}`}>
                  {option.title}
                </Heading>
                <p className={`${responsiveTypography.body} text-gray-600 ${responsiveSpacing.mbMedium} flex-grow`}>
                  {option.description}
                </p>
                <ul className={`space-y-2 sm:space-y-3 ${responsiveSpacing.mbMedium}`}>
                  {option.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start text-gray-600">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className={responsiveTypography.small}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={INVOLVEMENT_HREFS[index]}
                  className={`${responsiveButtons.primary} bg-green-600 text-white hover:bg-green-700 w-full text-center mt-auto`}
                >
                  {option.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className={`${responsiveSpacing.section} bg-gray-50`}>
        <div className={`${responsiveSpacing.container} mx-auto`}>
          <Heading level={2} className={`${responsiveTypography.section} text-center ${responsiveSpacing.mbLarge}`}>
            {t('testimonials.heading')}
          </Heading>
          <div className="max-w-3xl mx-auto">
            {testimonialItems.map((testimonial, index) => (
              <div key={index} className={`bg-white rounded-xl ${responsiveSpacing.cardPadding} shadow-lg`}>
                <div className={`text-green-600 ${responsiveSpacing.mbSmall}`}>
                  <Heart className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <blockquote className={`${responsiveTypography.lead} text-gray-600 ${responsiveSpacing.mbMedium} italic`}>
                  &ldquo;{testimonial.quote}&rdquo;
                </blockquote>
                <div className={`${responsiveTypography.cardTitle} font-semibold`}>{testimonial.author}</div>
                <div className={`${responsiveTypography.body} text-gray-500`}>{testimonial.role}</div>
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
                  className={`flex items-center ${responsiveSpacing.cardPadding} bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-green-200 group`}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-3 sm:mr-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`${responsiveTypography.body} text-gray-700 group-hover:text-green-600 transition-colors duration-300`}>
                    {name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`${responsiveSpacing.section} bg-gradient-to-br from-green-600 to-emerald-700 text-white`}>
        <div className={`${responsiveSpacing.container} mx-auto text-center`}>
          <Heading level={2} className={`${responsiveTypography.section} ${responsiveSpacing.mbSmall}`}>
            {t('cta.heading')}
          </Heading>
          <p className={`${responsiveTypography.lead} ${responsiveSpacing.mbMedium} max-w-2xl mx-auto text-green-100`}>
            {t('cta.body')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <ContactLink variant="outline" size="lg" className="bg-white text-green-800 hover:bg-green-50">
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
