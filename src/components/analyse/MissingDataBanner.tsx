'use client'

import { AlertCircle, Database } from 'lucide-react'
import type { MetricDefinition } from '@/config/analyse/metrics'

interface MissingDataBannerProps {
  metrics: MetricDefinition[]
  compact?: boolean
}

/**
 * Banner showing what data is missing and who should provide it.
 * Groups missing metrics by responsible team.
 */
export function MissingDataBanner({ metrics, compact = false }: MissingDataBannerProps) {
  if (metrics.length === 0) return null

  // Group by responsible team
  const byTeam: Record<string, MetricDefinition[]> = {}
  for (const metric of metrics) {
    const team = metric.responsibleTeam || 'Unbekannt'
    if (!byTeam[team]) {
      byTeam[team] = []
    }
    byTeam[team].push(metric)
  }

  if (compact) {
    return (
      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            {metrics.length} Kennzahl{metrics.length !== 1 ? 'en' : ''} benötigt Daten
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 mb-3">
        <Database className="w-5 h-5" />
        <span className="font-semibold">Daten benötigt ({metrics.length})</span>
      </div>

      <div className="space-y-4">
        {Object.entries(byTeam).map(([team, teamMetrics]) => (
          <div key={team}>
            <div className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
              {team}
            </div>
            <ul className="space-y-2">
              {teamMetrics.map(metric => (
                <li
                  key={metric.id}
                  className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300"
                >
                  <span className="text-amber-500 mt-0.5">•</span>
                  <div>
                    <span className="font-medium">{metric.name}</span>
                    {metric.dataNeeded && (
                      <span className="text-amber-600 dark:text-amber-400">
                        {' '}— {metric.dataNeeded}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

interface SingleMissingDataProps {
  metric: MetricDefinition
}

/**
 * Inline indicator for a single metric that needs data.
 */
export function MissingDataIndicator({ metric }: SingleMissingDataProps) {
  return (
    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
      <AlertCircle className="w-4 h-4" />
      <div className="text-sm">
        <span className="font-medium">Daten benötigt</span>
        {metric.dataNeeded && (
          <span className="block text-xs text-amber-500">
            {metric.dataNeeded}
          </span>
        )}
        {metric.responsibleTeam && (
          <span className="block text-xs text-amber-500">
            Verantwortlich: {metric.responsibleTeam}
          </span>
        )}
      </div>
    </div>
  )
}
