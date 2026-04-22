import type { Metadata } from 'next'
import Link from 'next/link'
import { Eye, Target, BarChart3, Briefcase, FileText, Users } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { getCompactMetrics } from '@/data/impact-metrics'
import { ORG, CONTACT } from '@/config/org'
import { getTranslations } from 'next-intl/server'

interface TransparenzPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: TransparenzPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'transparenz' })
  return {
    title: `${t('meta.title')} | ${ORG.name}`,
    description: t('meta.description', { orgName: ORG.name }),
    openGraph: {
      title: `${t('meta.title')} | ${ORG.name}`,
      description: t('meta.description', { orgName: ORG.name }),
      type: 'website',
      url: `${ORG.website}/transparenz`,
      siteName: ORG.name,
    },
  }
}

export default async function TransparenzPage({ params }: TransparenzPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'transparenz' })
  const tHome = await getTranslations({ locale, namespace: 'home.impact' })
  const compactMetrics = getCompactMetrics({
    devicesRescued: tHome('compactMetrics.devicesRescued'),
    peopleTrained: tHome('compactMetrics.peopleTrained'),
    reuseRate: tHome('compactMetrics.reuseRate'),
    lifespanExtension: tHome('compactMetrics.lifespanExtension'),
    internshipSuccess: tHome('compactMetrics.internshipSuccess'),
    careerReentries: tHome('compactMetrics.careerReentries'),
  })

  const platforms = t.raw('platforms') as Array<{ title: string; description: string; href: string }>

  return (
    <div className="bg-white">
      {/* Hero */}
      <PageHero
        theme="about"
        icon={Eye}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />

      {/* Section 1: Mission */}
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 flex-shrink-0" aria-hidden="true">
              <Target className="h-5 w-5 text-green-600" />
            </div>
            <Heading level={2} className="tracking-tight text-gray-900">
              {t('mission.title')}
            </Heading>
          </div>
          <p className="text-lg text-gray-600 leading-8">
            {ORG.description}{' '}
            {t('mission.body', { legalForm: ORG.legalForm, foundingYear: ORG.foundingYear })}
          </p>
        </div>
      </div>

      {/* Section 2: Stats */}
      <div className="bg-green-50 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100" aria-hidden="true">
                <BarChart3 className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <Heading level={2} className="tracking-tight text-gray-900">
              {t('stats.title')}
            </Heading>
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {compactMetrics.map((metric, index) => (
              <div key={index} className="bg-white rounded-xl p-4 sm:p-6 text-center border border-gray-100">
                <dd className="text-2xl sm:text-3xl font-bold text-green-600">{metric.value}</dd>
                <dt className="mt-1 text-xs sm:text-sm text-gray-600">{metric.label}</dt>
              </div>
            ))}
          </dl>

          <div className="mt-8 text-center">
            <Link
              href="/about/impact"
              className="text-sm font-semibold text-green-600 hover:text-green-700 underline underline-offset-2"
            >
              {t('stats.moreLink')} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Section 3: How We Work */}
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100" aria-hidden="true">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <Heading level={2} className="tracking-tight text-gray-900">
              {t('howWeWork.title')}
            </Heading>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              {t('howWeWork.subtitle')}
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            {platforms.map((platform) => (
              <Link
                key={platform.href}
                href={platform.href}
                className="bg-gray-50 rounded-xl p-6 border border-gray-100 hover:shadow-md transition-shadow group"
              >
                <Heading level={3} className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                  {platform.title}
                </Heading>
                <p className="mt-2 text-sm text-gray-600">{platform.description}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-green-600">
                  {t('howWeWork.platformCta')} <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: Finances */}
      <div className="bg-gray-50 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 flex-shrink-0" aria-hidden="true">
              <FileText className="h-5 w-5 text-orange-600" />
            </div>
            <Heading level={2} className="tracking-tight text-gray-900">
              {t('finances.title')}
            </Heading>
          </div>
          <p className="text-lg text-gray-600 leading-8">
            {t('finances.body')}
          </p>
          <div className="mt-6">
            <Link
              href="/mitglied-werden"
              className="text-sm font-semibold text-green-600 hover:text-green-700 underline underline-offset-2"
            >
              {t('finances.memberLink')} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Section 5: Board */}
      <div className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 flex-shrink-0" aria-hidden="true">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <Heading level={2} className="tracking-tight text-gray-900">
              {t('board.title')}
            </Heading>
          </div>
          <p className="text-lg text-gray-600 leading-8">
            {t('board.body', { orgName: ORG.name })}{' '}
            <a
              href={`mailto:${CONTACT.email}`}
              className="font-semibold text-green-600 hover:text-green-700 underline"
            >
              {CONTACT.email}
            </a>
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/mitglied-werden"
              className="rounded-md bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 text-center"
            >
              {t('board.joinBtn')}
            </Link>
            <Link
              href="/get-involved/donate"
              className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-green-600 border border-green-600 hover:bg-green-50 text-center"
            >
              {t('board.donateBtn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
