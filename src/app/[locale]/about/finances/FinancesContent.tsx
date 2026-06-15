'use client'

import { useState, useEffect } from 'react'
import { PageHero } from '@/components/layout/PageHero'
import AboutSubNav from '@/components/about/AboutSubNav'
import { Wallet, TrendingUp, Heart, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { formatCHF } from '@/lib/hirn/format'
import Heading from '@/components/ui/Heading'
import { AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PageShell } from '@/components/layout/PageShell'

interface YearData {
  year: number
  totals: {
    total: number
    warenverkauf: number
    dienstleistungen: number
    integration: number
    spenden: number
    aufstockung: number
  }
  derived: {
    eigenfinanzierungPct: number
    earnedTotal: number
    donationsTotal: number
  }
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null
  const pctChange = ((current - previous) / Math.abs(previous)) * 100
  const isPositive = pctChange >= 0

  return (
    <span className={`inline-flex items-center text-xs font-medium ${isPositive ? 'text-action' : 'text-error-500'}`}>
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(pctChange).toFixed(0)}%
    </span>
  )
}

export default function FinancesContent() {
  const t = useTranslations('about.finances')
  const [data, setData] = useState<YearData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    apiFetch<YearData[]>('/api/public/financials')
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setData(result.data)
        } else {
          if (result.error) logger.error('Failed to load financials', { error: result.error })
          setError(true)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const latest = data[0]
  const previous = data[1]

  const tableRows: { key: keyof YearData['totals']; labelKey: string }[] = [
    { key: 'warenverkauf', labelKey: 'rows.warenverkauf' },
    { key: 'dienstleistungen', labelKey: 'rows.dienstleistungen' },
    { key: 'integration', labelKey: 'rows.integration' },
    { key: 'spenden', labelKey: 'rows.spenden' },
    { key: 'aufstockung', labelKey: 'rows.aufstockung' },
  ]

  return (
    <>
      <PageHero
        theme="about"
        icon={Wallet}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />
      <AboutSubNav />

      <PageShell maxWidth="5xl" py="py-12">
        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-surface-base rounded-xl p-6 h-32" />
              ))}
            </div>
            <div className="bg-surface-base rounded-xl p-6 h-64" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-error-400 mx-auto mb-4" />
            <p className="text-text-secondary">{t('errorMessage')}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">{t('noData')}</p>
          </div>
        ) : (
          <>
            {/* Key Metrics Cards */}
            {latest && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <article className="ui-public-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="ui-public-card-label mt-0 mb-0">{t('metrics.totalRevenue', { year: latest.year })}</span>
                    {previous && <TrendIndicator current={latest.totals.total} previous={previous.totals.total} />}
                  </div>
                  <p className="text-2xl font-bold text-text-primary tabular-nums">{formatCHF(latest.totals.total)}</p>
                </article>

                <article className="ui-public-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="ui-public-card-label mt-0 mb-0 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {t('metrics.selfFinancing')}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-action tabular-nums">{latest.derived.eigenfinanzierungPct}%</p>
                  <p className="ui-public-meta mt-1">
                    {formatCHF(latest.derived.earnedTotal)} {t('metrics.selfFinancingEarned')}
                  </p>
                </article>

                <article className="ui-public-card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="ui-public-card-label mt-0 mb-0 flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {t('metrics.donationsFunding')}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-text-primary tabular-nums">{formatCHF(latest.derived.donationsTotal)}</p>
                  <p className="ui-public-meta mt-1">
                    {(100 - latest.derived.eigenfinanzierungPct).toFixed(1)}% {t('metrics.donationsPct')}
                  </p>
                </article>
              </div>
            )}

            {/* Revenue Breakdown Table */}
            <div className="card-shell overflow-hidden mb-10">
              <div className="px-6 py-4 border-b border-subtle">
                <Heading level={2} className="text-lg text-text-primary">{t('table.title')}</Heading>
                <p className="text-sm text-text-secondary">{t('table.subtitle')}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface-raised">
                      <th className="text-left px-6 py-3 font-medium text-text-secondary">{t('table.source')}</th>
                      {data.map(d => (
                        <th key={d.year} className="text-right px-6 py-3 font-medium text-text-secondary">{d.year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {tableRows.map(row => (
                      <tr key={row.key} className="hover:bg-surface-raised">
                        <td className="px-6 py-3 text-text-secondary">{t(`table.${row.labelKey}` as Parameters<typeof t>[0])}</td>
                        {data.map(d => (
                          <td key={d.year} className="px-6 py-3 text-right font-mono text-text-primary">
                            {formatCHF(d.totals[row.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-surface-raised font-bold">
                      <td className="px-6 py-3 text-text-primary">{t('table.rows.total')}</td>
                      {data.map(d => (
                        <td key={d.year} className="px-6 py-3 text-right font-mono text-text-primary">
                          {formatCHF(d.totals.total)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t-2 border">
                      <td className="px-6 py-3 text-text-secondary">{t('table.rows.eigenfinanzierungsquote')}</td>
                      {data.map(d => (
                        <td key={d.year} className="px-6 py-3 text-right font-mono text-action font-medium">
                          {d.derived.eigenfinanzierungPct}%
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Methodology Note */}
            <div className="bg-action-muted border border-strong rounded-xl p-6">
              <Heading level={3} className="text-action-text mb-2">{t('methodology.title')}</Heading>
              <ul className="text-sm text-action space-y-1">
                <li>{t('methodology.point1')}</li>
                <li>{t('methodology.point2')}</li>
                <li>{t('methodology.point3')}</li>
              </ul>
            </div>
          </>
        )}
      </PageShell>
    </>
  )
}
