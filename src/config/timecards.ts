/**
 * Timecard Configuration - SSOT
 *
 * Defines the canonical workflow and entry taxonomy for staff time tracking.
 * Used by validation, database-facing code, and future admin UI.
 */

export const TIMECARD_STATUSES = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const

export type TimecardStatus = typeof TIMECARD_STATUSES[keyof typeof TIMECARD_STATUSES]

export const TIMECARD_STATUS_OPTIONS = Object.values(TIMECARD_STATUSES)

export const TIMECARD_STATUS_LABELS: Record<TimecardStatus, string> = {
  draft: 'Entwurf',
  submitted: 'Eingereicht',
  approved: 'Genehmigt',
  rejected: 'Abgelehnt',
}

export const TIMECARD_STATUS_COLORS: Record<TimecardStatus, string> = {
  draft: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300',
  submitted: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
  approved: 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300',
  rejected: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300',
}

export const TIMECARD_ENTRY_CATEGORIES = {
  // Worked-time categories
  WORKSHOP: 'workshop',
  REPAIR: 'repair',
  INTAKE: 'intake',
  SALES: 'sales',
  ADMIN: 'admin',
  EDUCATION: 'education',
  LOGISTICS: 'logistics',
  MEETING: 'meeting',
  VOLUNTEERING: 'volunteering',
  OTHER: 'other',
  // Absence categories (Swiss timecard) — see TIMECARD_ABSENCE_TYPES.
  FERIEN: 'ferien',
  KRANK: 'krank',
  UNFALL: 'unfall',
  FEIERTAG: 'feiertag',
  MILITAER: 'militaer',
  UNBEZAHLT: 'unbezahlt',
} as const

export type TimecardEntryCategory =
  typeof TIMECARD_ENTRY_CATEGORIES[keyof typeof TIMECARD_ENTRY_CATEGORIES]

export const TIMECARD_ENTRY_CATEGORY_OPTIONS = Object.values(TIMECARD_ENTRY_CATEGORIES)

/**
 * SSOT for absences (what a Swiss employee realistically records when NOT
 * present). One entry here drives: the one-click bulk buttons, the day-editor
 * quick actions, the grid label, and the paid/0h math — add a type and it
 * appears everywhere. `paid` absences record the day's scheduled hours (paid
 * leave still counts toward the month); unpaid ones record 0h but stay labelled
 * so the day reads as a deliberate absence, not a gap.
 */
export const TIMECARD_ABSENCE_TYPES = [
  { value: TIMECARD_ENTRY_CATEGORIES.FERIEN,    label: 'Ferien',     paid: true },
  { value: TIMECARD_ENTRY_CATEGORIES.KRANK,     label: 'Krank',      paid: true },
  { value: TIMECARD_ENTRY_CATEGORIES.UNFALL,    label: 'Unfall',     paid: true },
  { value: TIMECARD_ENTRY_CATEGORIES.FEIERTAG,  label: 'Feiertag',   paid: true },
  { value: TIMECARD_ENTRY_CATEGORIES.MILITAER,  label: 'Militär/ZS', paid: true },
  { value: TIMECARD_ENTRY_CATEGORIES.UNBEZAHLT, label: 'Unbezahlt',  paid: false },
] as const

export type TimecardAbsenceType = typeof TIMECARD_ABSENCE_TYPES[number]

export const TIMECARD_ABSENCE_CATEGORIES: readonly TimecardEntryCategory[] =
  TIMECARD_ABSENCE_TYPES.map(a => a.value)

export function isAbsenceCategory(category: string): boolean {
  return (TIMECARD_ABSENCE_CATEGORIES as readonly string[]).includes(category)
}

export function getAbsenceType(category: string): TimecardAbsenceType | undefined {
  return TIMECARD_ABSENCE_TYPES.find(a => a.value === category)
}

const WORK_CATEGORY_LABELS: Record<string, string> = {
  workshop: 'Workshop',
  repair: 'Reparatur',
  intake: 'Annahme',
  sales: 'Verkauf',
  admin: 'Administration',
  education: 'Bildung',
  logistics: 'Logistik',
  meeting: 'Meeting',
  volunteering: 'Freiwilligenarbeit',
  other: 'Andere',
}

// Built from the two SSOTs above — never hand-maintain absence labels twice.
export const TIMECARD_ENTRY_CATEGORY_LABELS = {
  ...WORK_CATEGORY_LABELS,
  ...Object.fromEntries(TIMECARD_ABSENCE_TYPES.map(a => [a.value, a.label])),
} as Record<TimecardEntryCategory, string>

export const TIMECARD_ENTRY_SOURCES = {
  MANUAL: 'manual',
  AI_ASSISTED: 'ai_assisted',
  TEMPLATE: 'template',
  TASK_COMPLETION: 'task_completion',
} as const

export type TimecardEntrySource = typeof TIMECARD_ENTRY_SOURCES[keyof typeof TIMECARD_ENTRY_SOURCES]

export const TIMECARD_ENTRY_SOURCE_OPTIONS = Object.values(TIMECARD_ENTRY_SOURCES)

export const TIMECARD_PERIOD_TYPES = {
  WEEK: 'week',
  MONTH: 'month',
} as const

export type TimecardPeriodType = typeof TIMECARD_PERIOD_TYPES[keyof typeof TIMECARD_PERIOD_TYPES]

export const TIMECARD_PERIOD_TYPE_OPTIONS = Object.values(TIMECARD_PERIOD_TYPES)

export const TIMECARD_LIMITS = {
  MIN_ENTRY_MINUTES: 1,
  MAX_ENTRY_MINUTES: 16 * 60,
  MAX_DAILY_MINUTES: 24 * 60,
  MAX_PERIOD_ENTRIES: 100,
  MAX_NOTE_LENGTH: 2000,
  MAX_REVIEW_NOTE_LENGTH: 2000,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_AI_PROMPT_LENGTH: 2000,
} as const

export function getTimecardStatusLabel(status: string | null | undefined): string {
  if (!status) return 'Unbekannt'
  return TIMECARD_STATUS_LABELS[status as TimecardStatus] || status
}

export function getTimecardStatusColor(status: string | null | undefined): string {
  if (!status) return TIMECARD_STATUS_COLORS.draft
  return TIMECARD_STATUS_COLORS[status as TimecardStatus] || TIMECARD_STATUS_COLORS.draft
}

export function getTimecardEntryCategoryLabel(category: string | null | undefined): string {
  if (!category) return 'Andere'
  return TIMECARD_ENTRY_CATEGORY_LABELS[category as TimecardEntryCategory] || category
}

export function sumTimecardMinutes(entries: Array<{ duration_minutes: number }>): number {
  return entries.reduce((total, entry) => total + entry.duration_minutes, 0)
}

export function formatTimecardDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) return `${minutes} Min.`
  if (minutes === 0) return `${hours} Std.`
  return `${hours} Std. ${minutes} Min.`
}
