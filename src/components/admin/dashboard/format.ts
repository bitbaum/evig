/**
 * Format the age of the oldest pending item in a queue.
 * Returns null when no date is given so callers can hide the badge.
 */
export function formatQueueAge(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null
  const days = Math.floor((Date.now() - new Date(isoDate).getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'heute eingegangen'
  if (days === 1) return 'seit gestern'
  return `ältestes: vor ${days} Tagen`
}
