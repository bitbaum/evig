// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { buttonClass } from '@/components/ui/button-class'
import { Eye, Target, BarChart3, Briefcase, FileText, Users } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { IconBadge } from '@/components/ui/IconBadge'
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
  const compactMetrics = getCompactMetrics({
    devicesRescued: t('compactMetrics.devicesRescued'),
    peopleTrained: t('compactMetrics.peopleTrained'),
    reuseRate: t('compactMetrics.reuseRate'),
    lifespanExtension: t('compactMetrics.lifespanExtension'),
    internshipSuccess: t('compactMetrics.internshipSuccess'),
    careerReentries: t('compactMetrics.careerReentries'),
  })

  const platforms = t.raw('platforms') as Array<{ title: string; description: string; href: string }>

  return (
    <div className="bg-surface-base">
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
            <IconBadge icon={Target} theme="about" size="md" />
            <Heading level={2} className="tracking-tight text-text-primary">
              {t('mission.title')}
            </Heading>
          </div>
          <p className="text-lg text-text-secondary leading-8">
            {ORG.description}{' '}
            {t('mission.body', { legalForm: ORG.legalForm, foundingYear: ORG.foundingYear })}
          </p>
        </div>
      </div>

      {/* Section 2: Stats */}
      <div className="bg-surface-raised py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <IconBadge icon={BarChart3} theme="about" size="md" />
            </div>
            <Heading level={2} className="tracking-tight text-text-primary">
              {t('stats.title')}
            </Heading>
          </div>

          <dl className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {compactMetrics.map((metric, index) => (
              <div key={index} className="bg-surface-base rounded-xl p-4 sm:p-6 text-center border border-subtle">
                <dd className="text-2xl sm:text-3xl font-bold text-action">{metric.value}</dd>
                <dt className="mt-1 text-xs sm:text-sm text-text-secondary">{metric.label}</dt>
              </div>
            ))}
          </dl>

          <div className="mt-8 text-center">
            <Link
              href="/about/impact"
              className="text-sm font-semibold text-action hover:text-action underline underline-offset-2"
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-raised" aria-hidden="true">
                <Briefcase className="h-5 w-5 text-text-secondary" />
              </div>
            </div>
            <Heading level={2} className="tracking-tight text-text-primary">
              {t('howWeWork.title')}
            </Heading>
            <p className="mt-4 text-lg text-text-secondary max-w-2xl mx-auto">
              {t('howWeWork.subtitle')}
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
            {platforms.map((platform) => (
              <Link
                key={platform.href}
                href={platform.href}
                className="card-shell-inset rounded-xl p-6 hover:border-strong transition-colors group"
              >
                <Heading level={3} className="text-lg font-bold text-text-primary group-hover:text-action transition-colors">
                  {platform.title}
                </Heading>
                <p className="mt-2 text-sm text-text-secondary">{platform.description}</p>
                <span className="mt-4 inline-block text-sm font-semibold text-action">
                  {t('howWeWork.platformCta')} <span aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4: Finances */}
      <div className="bg-surface-raised py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4 mb-6">
            <IconBadge icon={FileText} theme="marketplace" size="md" />
            <Heading level={2} className="tracking-tight text-text-primary">
              {t('finances.title')}
            </Heading>
          </div>
          <p className="text-lg text-text-secondary leading-8">
            {t('finances.body')}
          </p>
          <div className="mt-6">
            <Link
              href="/mitglied-werden"
              className="text-sm font-semibold text-action hover:text-action underline underline-offset-2"
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
            <IconBadge icon={Users} theme="about" size="md" />
            <Heading level={2} className="tracking-tight text-text-primary">
              {t('board.title')}
            </Heading>
          </div>
          <p className="text-lg text-text-secondary leading-8">
            {t('board.body', { orgName: ORG.name })}{' '}
            <a
              href={`mailto:${CONTACT.email}`}
              className="font-semibold text-action hover:text-action underline"
            >
              {CONTACT.email}
            </a>
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link href="/mitglied-werden" className={buttonClass({ variant: 'primary', size: 'sm' })}>
              {t('board.joinBtn')}
            </Link>
            <Link
              href="/get-involved/donate"
              className="rounded-md bg-surface-base px-5 py-2.5 text-sm font-semibold text-action border border-action hover:bg-action-muted text-center"
            >
              {t('board.donateBtn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
