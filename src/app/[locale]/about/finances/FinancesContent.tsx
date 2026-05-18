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
    <span className={`inline-flex items-center text-xs font-medium ${isPositive ? 'text-primary-600' : 'text-error-500'}`}>
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
    <div className="min-h-screen bg-neutral-50">
      <PageHero
        theme="about"
        icon={Wallet}
        title={t('hero.title')}
        subtitle={t('hero.subtitle')}
      />
      <AboutSubNav />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl p-6 h-32" />
              ))}
            </div>
            <div className="bg-white rounded-xl p-6 h-64" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-error-400 mx-auto mb-4" />
            <p className="text-neutral-600">{t('errorMessage')}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-600">{t('noData')}</p>
          </div>
        ) : (
          <>
            {/* Key Metrics Cards */}
            {latest && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600">{t('metrics.totalRevenue', { year: latest.year })}</span>
                    {previous && <TrendIndicator current={latest.totals.total} previous={previous.totals.total} />}
                  </div>
                  <p className="text-2xl font-bold text-neutral-900">{formatCHF(latest.totals.total)}</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {t('metrics.selfFinancing')}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-primary-600">{latest.derived.eigenfinanzierungPct}%</p>
                  <p className="text-xs text-neutral-600 mt-1">
                    {formatCHF(latest.derived.earnedTotal)} {t('metrics.selfFinancingEarned')}
                  </p>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-neutral-600 flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {t('metrics.donationsFunding')}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-neutral-900">{formatCHF(latest.derived.donationsTotal)}</p>
                  <p className="text-xs text-neutral-600 mt-1">
                    {(100 - latest.derived.eigenfinanzierungPct).toFixed(1)}% {t('metrics.donationsPct')}
                  </p>
                </div>
              </div>
            )}

            {/* Revenue Breakdown Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] overflow-hidden mb-10">
              <div className="px-6 py-4 border-b border-neutral-100">
                <Heading level={2} className="text-lg text-neutral-900">{t('table.title')}</Heading>
                <p className="text-sm text-neutral-600">{t('table.subtitle')}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50">
                      <th className="text-left px-6 py-3 font-medium text-neutral-600">{t('table.source')}</th>
                      {data.map(d => (
                        <th key={d.year} className="text-right px-6 py-3 font-medium text-neutral-600">{d.year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {tableRows.map(row => (
                      <tr key={row.key} className="hover:bg-neutral-50">
                        <td className="px-6 py-3 text-neutral-700">{t(`table.${row.labelKey}` as Parameters<typeof t>[0])}</td>
                        {data.map(d => (
                          <td key={d.year} className="px-6 py-3 text-right font-mono text-neutral-900">
                            {formatCHF(d.totals[row.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-neutral-50 font-bold">
                      <td className="px-6 py-3 text-neutral-900">{t('table.rows.total')}</td>
                      {data.map(d => (
                        <td key={d.year} className="px-6 py-3 text-right font-mono text-neutral-900">
                          {formatCHF(d.totals.total)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t-2 border-neutral-200">
                      <td className="px-6 py-3 text-neutral-700">{t('table.rows.eigenfinanzierungsquote')}</td>
                      {data.map(d => (
                        <td key={d.year} className="px-6 py-3 text-right font-mono text-primary-600 font-medium">
                          {d.derived.eigenfinanzierungPct}%
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Methodology Note */}
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
              <Heading level={3} className="text-primary-900 mb-2">{t('methodology.title')}</Heading>
              <ul className="text-sm text-primary-800 space-y-1">
                <li>{t('methodology.point1')}</li>
                <li>{t('methodology.point2')}</li>
                <li>{t('methodology.point3')}</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
