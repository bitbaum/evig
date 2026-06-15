import type { MilestoneKey } from '@/data/upcycling-status'

export interface MilestoneTimelineItem {
  key: MilestoneKey
  label: string
}

export interface NextDeadline {
  key: MilestoneKey
  label: string
  daysLeft: number
  isoDate: string
}

/** Resolve which dated milestone to feature in the countdown chip. */
export function pickNextDeadline(
  deadlines: Record<MilestoneKey, string | null>,
  items: MilestoneTimelineItem[],
): NextDeadline | null {
  const today = new Date()
  const todayMs = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())

  const dated = Object.entries(deadlines)
    .filter(([, iso]) => !!iso)
    .map(([k, iso]) => {
      const [y, mo, d] = (iso as string).split('-').map(Number)
      const ms = Date.UTC(y, mo - 1, d)
      const daysLeft = Math.round((ms - todayMs) / 86_400_000)
      const label = items.find((it) => it.key === (k as MilestoneKey))?.label ?? k
      return { key: k as MilestoneKey, label, daysLeft, isoDate: iso as string }
    })
    .sort((a, b) => {
      const aHidden = a.daysLeft < -14
      const bHidden = b.daysLeft < -14
      if (aHidden !== bHidden) return aHidden ? 1 : -1
      return a.daysLeft - b.daysLeft
    })

  return dated[0] ?? null
}

type CountdownTranslate = (
  key: 'daysLeft' | 'today' | 'overdue',
  values: Record<string, string | number>,
) => string

/** Render ICU countdown strings via next-intl (no manual plural regex). */
export function formatDeadlineMessage(
  t: CountdownTranslate,
  nextDeadline: Pick<NextDeadline, 'label' | 'daysLeft'>,
): string {
  const { daysLeft, label } = nextDeadline
  const abs = Math.abs(daysLeft)
  if (daysLeft === 0) return t('today', { milestone: label })
  if (daysLeft > 0) return t('daysLeft', { days: abs, milestone: label })
  return t('overdue', { days: abs, milestone: label })
}

/** Locale-aware snapshot date from ISO `YYYY-MM-DD`. */
export function formatSnapshotDate(iso: string, locale: string): string {
  const [y, mo, d] = iso.split('-').map((s) => Number(s))
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, mo - 1, d)))
}

/** Sub-nav active state — guide pages live under build-your-own in IA. */
export function isUpcyclingSubNavActive(pathname: string, href: string): boolean {
  if (href === '/projects/upcycling') {
    return pathname === '/projects/upcycling'
  }
  if (href === '/projects/upcycling/build-your-own') {
    return (
      pathname.startsWith(href)
      || pathname.startsWith('/projects/upcycling/lenovo')
    )
  }
  return pathname.startsWith(href)
}
