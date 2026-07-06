// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import { BarChart3, Leaf, Users, Coins, Building2, ExternalLink, ArrowLeft } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'
import Heading from '@/components/ui/Heading'
import { IconBadge } from '@/components/ui/IconBadge'
import { ORG } from '@/config/org'
import { ROUTES } from '@/config/routes'
import {
  ORG_NUMBERS_DEFAULTS,
  type OrgNumber,
  type OrgNumberCategory,
  type OrgNumberConfidence,
} from '@/lib/org-numbers.defaults'

interface KennzahlenPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: KennzahlenPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'kennzahlen' })
  return {
    title: { absolute: `${t('meta.title')} | ${ORG.name}` },
    description: t('meta.description'),
    openGraph: {
      title: `${t('meta.title')} | ${ORG.name}`,
      description: t('meta.description'),
      type: 'website',
      url: `${ORG.website}/transparenz/kennzahlen`,
      siteName: ORG.name,
    },
  }
}

// Display order for the KPI register. Icons are decorative; the taxonomy is the
// OrgNumberCategory SSOT.
const CATEGORY_ORDER: OrgNumberCategory[] = ['impact', 'social', 'economic', 'operations']

const CATEGORY_ICON: Record<OrgNumberCategory, typeof Leaf> = {
  impact: Leaf,
  social: Users,
  economic: Coins,
  operations: Building2,
}

// Confidence is the honesty signal — palette scales (not arbitrary hex), with
// dark variants so the pill stays legible in both themes.
const CONFIDENCE_BADGE: Record<OrgNumberConfidence, string> = {
  high: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  medium: 'bg-info-50 text-info-700 dark:bg-info-900/30 dark:text-info-300',
  estimated: 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
  target: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300',
}

export default async function KennzahlenPage({ params }: KennzahlenPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'kennzahlen' })

  const metrics = Object.values(ORG_NUMBERS_DEFAULTS)
  const byCategory = (cat: OrgNumberCategory): OrgNumber[] =>
    metrics.filter((m) => m.category === cat)

  return (
    <div className="bg-surface-base">
      <PageHero
        theme="about"
        icon={BarChart3}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <p className="text-lg text-text-secondary leading-8">{t('intro')}</p>
      </div>

      {CATEGORY_ORDER.map((cat, index) => {
        const items = byCategory(cat)
        if (items.length === 0) return null
        const CatIcon = CATEGORY_ICON[cat]
        return (
          <section
            key={cat}
            className={index % 2 === 0 ? 'bg-surface-raised py-12 sm:py-16' : 'py-12 sm:py-16'}
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4 mb-8">
                <IconBadge icon={CatIcon} theme="about" size="md" />
                <Heading level={2} className="tracking-tight text-text-primary">
                  {t(`categories.${cat}`)}
                </Heading>
              </div>

              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
                {items.map((m) => {
                  const detail = m.calculation || m.methodology
                  return (
                    <div
                      key={m.key}
                      className="bg-surface-base rounded-xl p-5 sm:p-6 border border-subtle flex flex-col"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-2xl sm:text-3xl font-bold text-action tabular-nums">
                          {m.value}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${CONFIDENCE_BADGE[m.confidence]}`}
                        >
                          {t(`confidence.${m.confidence}`)}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-text-secondary leading-6">{m.label}</p>

                      {(detail || m.sourceDocument) && (
                        <details className="mt-3 text-xs text-text-tertiary">
                          <summary className="cursor-pointer font-semibold text-text-secondary">
                            {t('howCalculated')}
                          </summary>
                          {detail && <p className="mt-2 leading-6">{detail}</p>}
                          {m.sourceDocument && (
                            <p className="mt-2">
                              {t('source')}:{' '}
                              {m.externalLink ? (
                                <a
                                  href={m.externalLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-action underline inline-flex items-center gap-1"
                                >
                                  {m.sourceDocument}
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                m.sourceDocument
                              )}
                            </p>
                          )}
                          <p className="mt-2">
                            {t('lastVerified')}: {m.lastVerified}
                          </p>
                        </details>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })}

      <div className="border-t border-subtle py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <Link
            href={ROUTES.public.transparenz}
            className="text-sm font-semibold text-action hover:text-action inline-flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> {t('backToTransparenz')}
          </Link>
          <Link
            href="/transparenz/co2"
            className="text-sm font-semibold text-action hover:text-action underline underline-offset-2"
          >
            {t('co2Note')} →
          </Link>
        </div>
      </div>
    </div>
  )
}
