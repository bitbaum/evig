import { Link } from '@/i18n/navigation'
import { ArrowLeft, ExternalLink, Code2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import Heading from '@/components/ui/Heading'
import {
  type OSSAlternative,
  getCategoryById,
  getProprietaryAppById,
  PRICING_MODEL_LABELS,
} from '@/config/open-source-registry'
import { MaturityBadge } from './MaturityBadge'
import { MigrationDifficultyBadge } from './MigrationDifficultyBadge'
import { PlatformIcons } from './PlatformIcons'
import { RevampITServicesCTA } from './RevampITServicesCTA'
import { RelatedAlternatives } from './RelatedAlternatives'
import { getTranslations } from 'next-intl/server'

interface AlternativeDetailProps {
  alternative: OSSAlternative
  locale: string
}

export async function AlternativeDetail({ alternative, locale }: AlternativeDetailProps) {
  const t = await getTranslations({ locale, namespace: 'services.openSourceSolutions' })
  const category = getCategoryById(alternative.categoryId)

  return (
    <main className="bg-neutral-50 min-h-screen">
      {/* Back nav */}
      <div className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/services/open-source-solutions"
            className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('detail.backToOverview')}
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              {category && (
                <span className="text-sm text-neutral-500 mb-2 block">
                  {category.icon} {category.label}
                </span>
              )}
              <Heading level={1} className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
                {alternative.name}
              </Heading>
              <p className="text-lg text-neutral-600 max-w-2xl">
                {alternative.tagline}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <MaturityBadge maturity={alternative.maturity} />
              <PlatformIcons platforms={alternative.platforms} className="text-base" />
            </div>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section className="bg-white rounded-xl border border-neutral-200 p-6">
              <Heading level={2} className="text-xl font-bold text-neutral-900 mb-4">{t('detail.description')}</Heading>
              <p className="text-neutral-700 leading-relaxed">{alternative.description}</p>
            </section>

            {/* What it replaces */}
            {alternative.replaces.length > 0 && (
              <section className="bg-white rounded-xl border border-neutral-200 p-6">
                <Heading level={2} className="text-xl font-bold text-neutral-900 mb-4">{t('detail.replaces')}</Heading>
                <div className="space-y-4">
                  {alternative.replaces.map(r => {
                    const app = getProprietaryAppById(r.appId)
                    if (!app) return null
                    return (
                      <div key={r.appId} className="rounded-lg border border-neutral-200 p-4">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-900">{app.name}</span>
                            <ArrowRight className="w-4 h-4 text-neutral-400" />
                            <span className="font-semibold text-blue-700">{alternative.name}</span>
                          </div>
                          <MigrationDifficultyBadge difficulty={r.migrationDifficulty} />
                        </div>
                        {app.typicalCost && (
                          <p className="text-sm text-neutral-500 mb-2">
                            {PRICING_MODEL_LABELS[app.pricingModel]} — {app.typicalCost}
                          </p>
                        )}
                        {r.compatibilityNote && (
                          <p className="text-sm text-neutral-600 mb-2">{r.compatibilityNote}</p>
                        )}
                        {r.migrationTips && r.migrationTips.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-1.5">
                              {t('detail.migrationTips')}
                            </p>
                            <ul className="space-y-1">
                              {r.migrationTips.map((tip, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-neutral-600">
                                  <span className="text-blue-500 mt-0.5">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Highlights */}
            <section className="bg-white rounded-xl border border-neutral-200 p-6">
              <Heading level={2} className="text-xl font-bold text-neutral-900 mb-4">{t('detail.highlights')}</Heading>
              <ul className="space-y-2">
                {alternative.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                    <span className="text-neutral-700">{h}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Limitations */}
            <section className="bg-white rounded-xl border border-neutral-200 p-6">
              <Heading level={2} className="text-xl font-bold text-neutral-900 mb-4">{t('detail.limitations')}</Heading>
              <ul className="space-y-2">
                {alternative.limitations.map((l, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-neutral-700">{l}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Related */}
            <RelatedAlternatives current={alternative} locale={locale} />
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            {/* Quick links */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <Heading level={3} className="text-base font-bold text-neutral-900 mb-4">{t('detail.links')}</Heading>
              <div className="space-y-3">
                <a
                  href={alternative.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg',
                    'bg-blue-600 text-white font-medium text-sm',
                    'hover:bg-blue-700 transition-colors'
                  )}
                >
                  <ExternalLink className="w-4 h-4" />
                  {t('detail.visitWebsite')}
                </a>
                {alternative.sourceCode && (
                  <a
                    href={alternative.sourceCode}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg',
                      'border border-neutral-200 text-neutral-700 font-medium text-sm',
                      'hover:bg-neutral-50 transition-colors'
                    )}
                  >
                    <Code2 className="w-4 h-4" />
                    {t('detail.viewSourceCode')}
                  </a>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              <Heading level={3} className="text-base font-bold text-neutral-900 mb-4">{t('detail.details')}</Heading>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-neutral-500">{t('detail.license')}</dt>
                  <dd className="font-medium text-neutral-900">{alternative.license}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">{t('detail.platforms')}</dt>
                  <dd className="font-medium text-neutral-900">
                    {alternative.platforms.map(p => {
                      const labels: Record<string, string> = { windows: 'Windows', macos: 'macOS', linux: 'Linux', web: 'Web', android: 'Android', ios: 'iOS' }
                      return labels[p] || p
                    }).join(', ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">{t('detail.maturity')}</dt>
                  <dd><MaturityBadge maturity={alternative.maturity} /></dd>
                </div>
              </dl>
            </div>

            {/* RevampIT CTA */}
            <RevampITServicesCTA alternative={alternative} />

            {/* General CTA */}
            <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-5">
              <Heading level={3} className="text-base font-bold text-primary-900 mb-2">
                {t('detail.helpWithMigration')}
              </Heading>
              <p className="text-sm text-primary-800 mb-3">
                {t('detail.helpDescription')}
              </p>
              <Link
                href="/contact"
                className={cn(
                  'inline-flex items-center px-4 py-2 rounded-lg',
                  'bg-primary-600 text-white text-sm font-medium',
                  'hover:bg-primary-700 transition-colors'
                )}
              >
                {t('detail.contactUs')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
