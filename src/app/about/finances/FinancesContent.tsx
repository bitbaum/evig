'use client'

import { useState, useEffect } from 'react'
import { PageHero } from '@/components/layout/PageHero'
import AboutSubNav from '@/components/about/AboutSubNav'
import { Wallet, TrendingUp, Heart, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { logger } from '@/lib/logger'

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

function formatCHF(value: number): string {
  return new Intl.NumberFormat('de-CH', {
    style: 'currency',
    currency: 'CHF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null
  const pctChange = ((current - previous) / Math.abs(previous)) * 100
  const isPositive = pctChange >= 0

  return (
    <span className={`inline-flex items-center text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {Math.abs(pctChange).toFixed(0)}%
    </span>
  )
}

export default function FinancesContent() {
  const [data, setData] = useState<YearData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/public/financials')
      .then(res => res.json())
      .then(result => {
        if (result.success && Array.isArray(result.data)) {
          setData(result.data)
        }
      })
      .catch(error => logger.error('Failed to load financials', { error }))
      .finally(() => setLoading(false))
  }, [])

  const latest = data[0]
  const previous = data[1]

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHero
        theme="about"
        icon={Wallet}
        title="Finanzen & Transparenz"
        subtitle="Als gemeinnütziger Verein legen wir unsere Finanzdaten offen. Hier sehen Sie, woher unsere Einnahmen stammen und wie hoch unsere Eigenfinanzierungsquote ist."
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
        ) : data.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Keine Finanzdaten verfügbar.</p>
          </div>
        ) : (
          <>
            {/* Key Metrics Cards */}
            {latest && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Gesamteinnahmen {latest.year}</span>
                    {previous && <TrendIndicator current={latest.totals.total} previous={previous.totals.total} />}
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCHF(latest.totals.total)}</p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Eigenfinanzierung
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{latest.derived.eigenfinanzierungPct}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCHF(latest.derived.earnedTotal)} selbst erwirtschaftet
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      Spenden & Förderung
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCHF(latest.derived.donationsTotal)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {(100 - latest.derived.eigenfinanzierungPct).toFixed(1)}% der Einnahmen
                  </p>
                </div>
              </div>
            )}

            {/* Revenue Breakdown Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-10">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Einnahmen nach Quelle</h2>
                <p className="text-sm text-gray-500">Alle Beträge in CHF, basierend auf Buchhaltungsdaten (Kivitendo)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Quelle</th>
                      {data.map(d => (
                        <th key={d.year} className="text-right px-6 py-3 font-medium text-gray-500">{d.year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {([
                      { key: 'warenverkauf' as const, label: 'Warenverkauf' },
                      { key: 'dienstleistungen' as const, label: 'Dienstleistungen' },
                      { key: 'integration' as const, label: 'Integration / Projekte' },
                      { key: 'spenden' as const, label: 'Spenden' },
                      { key: 'aufstockung' as const, label: 'Aufstockung Richtpreis' },
                    ]).map(row => (
                      <tr key={row.key} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-gray-700">{row.label}</td>
                        {data.map(d => (
                          <td key={d.year} className="px-6 py-3 text-right font-mono text-gray-900">
                            {formatCHF(d.totals[row.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-3 text-gray-900">Total</td>
                      {data.map(d => (
                        <td key={d.year} className="px-6 py-3 text-right font-mono text-gray-900">
                          {formatCHF(d.totals.total)}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t-2 border-gray-200">
                      <td className="px-6 py-3 text-gray-700">Eigenfinanzierungsquote</td>
                      {data.map(d => (
                        <td key={d.year} className="px-6 py-3 text-right font-mono text-green-600 font-medium">
                          {d.derived.eigenfinanzierungPct}%
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Methodology Note */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="font-semibold text-green-900 mb-2">Zur Methodik</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>Die Eigenfinanzierungsquote berechnet sich aus: (Warenverkauf + Dienstleistungen + Integration) / Total × 100</li>
                <li>Alle Daten stammen aus der Kivitendo-Buchhaltung und sind auf den Franken genau.</li>
                <li>Für 2015–2021 liegen Jahresaggregate vor, ab 2022 monatliche Daten.</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
