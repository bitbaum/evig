export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { Leaf, ExternalLink, Calculator, FileText } from 'lucide-react'
import { ORG, CONTACT } from '@/config/org'
import { ORG_NUMBERS_DEFAULTS } from '@/lib/org-numbers.defaults'
import { CATEGORY_CO2_FACTORS, CO2_SOURCES, REFURB_OVERHEAD_SHARE, estimateCO2Savings } from '@/config/co2-impact'
import { cn } from '@/lib/utils'
import { designPrimitive } from '@/lib/design-system'
import { PageHero } from '@/components/layout/PageHero'
import { Section } from '@/components/layout/Section'
import { getTranslations } from 'next-intl/server'

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'transparenz' })
  return {
    title: t('co2.meta.title' as never, { orgName: ORG.name } as never),
    description: t('co2.meta.description' as never, { orgName: ORG.name } as never),
    openGraph: {
      title: t('co2.meta.ogTitle' as never, { orgName: ORG.name } as never),
      description: t('co2.meta.ogDescription' as never),
      type: 'article',
    },
  }
}

const CO2_NUMBER_KEYS = [
  'co2_savings_per_device',
  'co2_production_new_laptop',
  'co2_refurbishment',
  'annual_co2_saved_tons',
] as const

export default async function Co2MethodologyPage({ params }: PageProps) {
  const { locale } = await params
  // Use top-level transparenz namespace + prefix every key with co2. — the
  // incremental TS type cache for nested message namespaces has been flaky
  // after adding new branches, this avoids the symbolic-namespace error.
  const tRoot = await getTranslations({ locale, namespace: 'transparenz' })
  const t = ((key: string, args?: Record<string, unknown>) =>
    tRoot(`co2.${key}` as never, args as never)) as (
      key: string,
      args?: Record<string, unknown>,
    ) => string
  // For t.raw access we need the root translator directly
  const tRawCo2 = tRoot.raw as (key: string) => unknown

  const numbers = CO2_NUMBER_KEYS
    .map(k => ORG_NUMBERS_DEFAULTS[k])
    .filter(Boolean)

  // Only main categories WITH a defensible factor appear in the table;
  // the ones without get an explicit "no claim" note below it.
  const mainCategories = Object.entries(CATEGORY_CO2_FACTORS)
    .filter(([k]) => k.length === 2)
    .sort(([a], [b]) => a.localeCompare(b))
  const deductionPct = Math.round(REFURB_OVERHEAD_SHARE * 100)

  const limits = tRawCo2('co2.limits.items') as string[]

  return (
    <div className="min-h-screen">
      <PageHero
        theme="about"
        icon={Leaf}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />

      <Section tone="tinted" density="compact">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="h-5 w-5 text-action" />
            <h2 className="text-2xl font-bold tracking-tight text-text-primary">
              {t('formula.heading')}
            </h2>
          </div>
          <div className={cn(designPrimitive.surface.card, 'p-6 font-mono text-sm leading-relaxed')}>
            <p className="text-text-primary">
              {t('formula.expression')}
            </p>
            <p className="mt-3 text-text-secondary">
              {t('formula.exampleLead')} {t('formula.exampleResult')} <strong className="text-text-primary">{t('formula.exampleValue')}</strong>
            </p>
            <p className="mt-3 text-xs text-text-tertiary not-italic">
              {t('formula.note')}
            </p>
          </div>
        </div>
      </Section>

      <Section tone="surface" density="compact">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary mb-6">
            {t('inputs.heading')}
          </h2>
          <div className="space-y-4">
            {numbers.map(n => (
              <article
                key={n.key}
                className={cn(designPrimitive.surface.card, 'p-5')}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <h3 className="text-base font-semibold text-text-primary">
                    {n.label}
                  </h3>
                  <span className="text-xl font-bold text-action tabular-nums">
                    {n.value}
                  </span>
                </div>
                {n.methodology && (
                  <p className="text-sm text-text-secondary mb-2">
                    {n.methodology}
                  </p>
                )}
                {n.calculation && (
                  <p className="text-xs text-text-tertiary font-mono mb-3">
                    {n.calculation}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-tertiary pt-3 border-t border-subtle">
                  {n.sourceDocument && (
                    <span className="inline-flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{n.sourceDocument}</span>
                    </span>
                  )}
                  {n.externalLink && (
                    <a
                      href={n.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-action hover:underline"
                    >
                      {t('inputs.openSource')} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  <span className="ml-auto">{t('inputs.asOf', { date: n.lastVerified ?? '—' })}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section tone="tinted" density="compact">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary mb-4">
            {t('weights.heading')}
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            {t('weights.intro')}
          </p>
          <div className={cn(designPrimitive.surface.card, 'overflow-hidden')}>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-raised dark:bg-surface-base/3 text-xs uppercase tracking-wider text-text-tertiary">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{t('weights.col.category')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('weights.col.newDevice')}</th>
                  <th className="px-4 py-3 text-right font-medium">{t('weights.col.co2')}</th>
                  <th className="px-4 py-3 text-left font-medium">{t('weights.col.source')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {mainCategories.map(([catId, factor]) => {
                  const co2 = estimateCO2Savings(catId)
                  return (
                    <tr key={catId}>
                      <td className="px-4 py-3 text-text-primary">
                        {t(`categories.${catId}`)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-text-secondary">
                        {factor.newDeviceProductionKg.toFixed(0)} kg
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-action font-medium">
                        ~{co2} kg
                      </td>
                      <td className="px-4 py-3 text-xs text-text-tertiary">
                        {factor.ademeItem}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
            <p className="text-xs text-text-tertiary p-4 border-t border-subtle">
              {t('weights.footer', { pct: deductionPct })}
            </p>
          </div>
          <p className="mt-4 text-sm text-text-secondary">
            {t('weights.noFactor')}
          </p>
        </div>
      </Section>

      <Section tone="surface" density="compact">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary mb-4">
            {t('sources.heading')}
          </h2>
          <p className="text-sm text-text-secondary mb-5">
            {t('sources.intro')}
          </p>
          <ul className="space-y-2 text-sm">
            {Object.values(CO2_SOURCES).map(source => (
              <li key={source.url} className="flex gap-3">
                <FileText className="h-4 w-4 shrink-0 mt-0.5 text-text-tertiary" aria-hidden="true" />
                {source.url.startsWith('http') ? (
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-action hover:underline">
                    {source.name} ({source.year})
                  </a>
                ) : (
                  <Link href={source.url} className="text-action hover:underline">
                    {source.name} ({source.year})
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="tinted" density="compact">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary mb-4">
            {t('limits.heading')}
          </h2>
          <ul className="space-y-3 text-sm text-text-secondary">
            {limits.map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-action shrink-0">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="tinted" density="compact">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold tracking-tight text-text-primary mb-4">
            {t('contribute.heading')}
          </h2>
          <p className="text-sm text-text-secondary mb-3">
            {t('contribute.intro')}
          </p>
          <Link
            href="https://github.com/g-but/revampit/blob/main/src/config/co2-impact.ts"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-action hover:underline"
          >
            {t('contribute.githubLabel')}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <p className="text-sm text-text-secondary mt-4">
            {t('contribute.closing')}{' '}
            <a href={`mailto:${CONTACT.email}`} className="text-action hover:underline">
              {CONTACT.email}
            </a>
          </p>
        </div>
      </Section>
    </div>
  )
}
