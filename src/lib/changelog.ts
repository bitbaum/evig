import { CHANGELOG_RELEASES, type ChangelogRelease, type LocalizedCopy } from '@/config/changelog'

const EN_LOCALES = new Set(['en', 'fr', 'it', 'es', 'ja', 'ko', 'ru'])

/** Pick German or English copy; other locales fall back to English. */
export function pickLocalized(locale: string, copy: LocalizedCopy): string {
  if (locale === 'de') return copy.de
  if (EN_LOCALES.has(locale)) return copy.en
  return copy.en
}

export function getChangelogReleases(): ChangelogRelease[] {
  return CHANGELOG_RELEASES
}

export function getLatestRelease(): ChangelogRelease {
  return CHANGELOG_RELEASES[0]
}

export interface ChangelogNavItem {
  id: string
  label: string
}

export function buildChangelogNav(locale: string): ChangelogNavItem[] {
  return CHANGELOG_RELEASES.map((release) => ({
    id: release.id,
    label: `v${release.version}`,
  }))
}

/** Long date for release headers — e.g. "15. Juni 2026" / "June 15, 2026". */
export function formatChangelogDate(date: string, locale: string): string {
  const parsed = new Date(`${date}T12:00:00`)
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-CH' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

/** Short date for sticky bar and rail — e.g. "15.06.2026" / "Jun 15, 2026". */
export function formatChangelogDateShort(date: string, locale: string): string {
  const parsed = new Date(`${date}T12:00:00`)
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-CH' : 'en-US', {
    day: 'numeric',
    month: locale === 'de' ? '2-digit' : 'short',
    year: 'numeric',
  }).format(parsed)
}
