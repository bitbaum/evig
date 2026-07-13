import { Star } from 'lucide-react'

interface RatingBreakdownProps {
  average: number
  total: number
  /** Keys '1'..'5' → count. */
  histogram: Record<string, number>
  /** Parent-translated count label, e.g. "128 Bewertungen". */
  countLabel: string
  className?: string
}

/**
 * Aggregate-rating summary: average + a 5★…1★ distribution. Presentational and
 * i18n-free (the parent passes the translated count label) so it can back a
 * seller profile or a listing's review header alike. Bar widths are data-driven
 * proportions — a legitimate inline width, not a hardcoded design token.
 */
export function RatingBreakdown({ average, total, histogram, countLabel, className = '' }: RatingBreakdownProps) {
  return (
    <div className={`flex flex-col gap-4 sm:flex-row sm:items-center ${className}`}>
      <div className="flex shrink-0 flex-col items-center justify-center sm:w-32">
        <div className="flex items-center gap-1">
          <Star className="h-6 w-6 text-warning-400 fill-warning-400" aria-hidden="true" />
          <span className="font-mono text-3xl font-semibold tabular-nums text-text-primary">
            {average.toFixed(1)}
          </span>
        </div>
        <div className="mt-1 text-xs text-text-tertiary">{countLabel}</div>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = histogram[String(star)] ?? 0
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="flex w-8 items-center gap-0.5 tabular-nums text-text-tertiary">
                {star}
                <Star className="h-3 w-3 text-warning-400 fill-warning-400" aria-hidden="true" />
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-raised">
                <div className="h-full rounded-full bg-warning-400" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 text-right tabular-nums text-text-tertiary">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
