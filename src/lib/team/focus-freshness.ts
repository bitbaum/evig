/**
 * Focus freshness — SSOT for how "aktueller Fokus" staleness is judged and worded.
 *
 * `team_profiles.current_focus` is a manual, free-text headline. On its own it
 * rots silently. This helper turns its `current_focus_updated_at` timestamp into
 * a human "vor 3 Tagen" label plus a `isStale` flag, so the team board and member
 * profile can nudge people to refresh a focus that has gone quiet — without ever
 * hiding the ground-truth (a person's active tasks always reveal what they do).
 *
 * One threshold, one wording, used everywhere it's shown.
 */

/** A focus headline older than this many days reads as stale. */
export const FOCUS_STALE_DAYS = 14

const MS_PER_DAY = 1000 * 60 * 60 * 24

export interface FocusFreshness {
  /** Whole days since the focus was last updated (0 = today). */
  days: number
  /** Swiss-German relative label, e.g. "vor 3 Tagen", "gestern", "heute". */
  label: string
  /** True once older than {@link FOCUS_STALE_DAYS} — surface a gentle nudge. */
  isStale: boolean
}

/**
 * Relative freshness for a focus timestamp. Returns `null` when no focus has
 * ever been set (nothing to age) so callers can render the "kein Fokus" state.
 */
export function focusFreshness(updatedAt: string | Date | null | undefined, now: Date = new Date()): FocusFreshness | null {
  if (!updatedAt) return null
  const then = updatedAt instanceof Date ? updatedAt : new Date(updatedAt)
  if (Number.isNaN(then.getTime())) return null

  const days = Math.max(0, Math.floor((now.getTime() - then.getTime()) / MS_PER_DAY))
  return {
    days,
    label: relativeLabel(days),
    isStale: days > FOCUS_STALE_DAYS,
  }
}

function relativeLabel(days: number): string {
  if (days <= 0) return 'heute aktualisiert'
  if (days === 1) return 'gestern aktualisiert'
  if (days < 7) return `vor ${days} Tagen`
  if (days < 14) return 'vor einer Woche'
  if (days < 31) return `vor ${Math.floor(days / 7)} Wochen`
  if (days < 62) return 'vor einem Monat'
  return `vor ${Math.floor(days / 30)} Monaten`
}
