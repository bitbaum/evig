/**
 * MissionStrip — compact above-the-fold banner for commerce pages.
 *
 * Frames the shop/marketplace not as "second-hand vendor" but as the
 * circular-economy nonprofit it actually is. Shows live cumulative
 * impact (devices kept out of landfill, CO₂ avoided) and a one-line
 * mission anchor. Methodology link on the CO₂ number — credibility
 * lives one click away, never asserted blindly.
 *
 * Server component. Pulls from the same `fetchImpactStats` helper as
 * the full ImpactStatsSection, so numbers stay consistent across the
 * site without ever drifting between two sources.
 */

import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { Recycle, Leaf, Heart } from 'lucide-react'
import { fetchImpactStats } from '@/lib/impact-stats'
import { cn } from '@/lib/utils'

interface MissionStripProps {
  /** Optional className passthrough — defaults to standard section spacing. */
  className?: string
}

export async function MissionStrip({ className }: MissionStripProps) {
  const [stats, t] = await Promise.all([
    fetchImpactStats(),
    getTranslations('components.missionStrip'),
  ])

  return (
    <section
      className={cn(
        'border-y border-primary-100 dark:border-primary-900/30',
        'bg-primary-50/60 dark:bg-primary-900/10',
        className,
      )}
      aria-label={t('ariaLabel')}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Mission anchor */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-500/15">
              <Recycle className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-snug">
              <strong className="text-neutral-900 dark:text-white">{t('anchor')}</strong>
              <span className="block sm:inline sm:ml-1 text-neutral-600 dark:text-neutral-400">
                {t('subAnchor')}
              </span>
            </p>
          </div>

          {/* Live stats — devices + CO₂ */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm shrink-0">
            <span className="inline-flex items-center gap-1.5">
              <Heart className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
              <span className="font-semibold text-neutral-900 dark:text-white tabular-nums">
                {stats.soldDevices || stats.totalDevices}+
              </span>
              <span className="text-neutral-600 dark:text-neutral-400">{t('devicesRehomed')}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Leaf className="h-4 w-4 text-primary-600 dark:text-primary-400" aria-hidden="true" />
              <span className="font-semibold text-neutral-900 dark:text-white tabular-nums">
                ~{stats.co2SavedTons} t
              </span>
              <span className="text-neutral-600 dark:text-neutral-400">{t('co2Avoided')}</span>
              <Link
                href="/transparenz/co2"
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline underline-offset-2 ml-1"
              >
                {t('methodologyLink')}
              </Link>
            </span>
            {!stats.live && (
              <span className="text-xs text-neutral-500 dark:text-neutral-500 italic">
                {t('estimateNote')}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
