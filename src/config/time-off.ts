/**
 * Time-off requests — SSOT for kinds, statuses, labels, and limits.
 *
 * A time-off request is FUTURE leave a staff member asks for in advance
 * (vacation, unpaid, military, …) that an approver grants or declines. It is
 * distinct from `timecard_entries` (logged worked/absent days) and from
 * `leave_periods` (HR's authoritative record) — an approved request can be
 * materialised into both.
 */

export const TIME_OFF_KINDS = {
  FERIEN: 'ferien',
  UNBEZAHLT: 'unbezahlt',
  MILITAER: 'militaer',
  UNFALL: 'unfall',
  OTHER: 'other',
} as const

export type TimeOffKind = (typeof TIME_OFF_KINDS)[keyof typeof TIME_OFF_KINDS]

export const TIME_OFF_KIND_OPTIONS = Object.values(TIME_OFF_KINDS)

export const TIME_OFF_KIND_LABELS: Record<TimeOffKind, string> = {
  ferien: 'Ferien',
  unbezahlt: 'Unbezahlter Urlaub',
  militaer: 'Militär / Zivilschutz',
  unfall: 'Unfall',
  other: 'Anderes',
}

export const TIME_OFF_STATUSES = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const

export type TimeOffStatus = (typeof TIME_OFF_STATUSES)[keyof typeof TIME_OFF_STATUSES]

export const TIME_OFF_STATUS_OPTIONS = Object.values(TIME_OFF_STATUSES)

export const TIME_OFF_STATUS_LABELS: Record<TimeOffStatus, string> = {
  pending: 'Ausstehend',
  approved: 'Genehmigt',
  rejected: 'Abgelehnt',
  cancelled: 'Zurückgezogen',
}

export const TIME_OFF_LIMITS = {
  MAX_NOTE_LENGTH: 1000,
  MAX_REVIEW_NOTE_LENGTH: 1000,
  /** A single request can't span more than a year — guards fat-finger ranges. */
  MAX_RANGE_DAYS: 366,
} as const

export function getTimeOffKindLabel(kind: string): string {
  return TIME_OFF_KIND_LABELS[kind as TimeOffKind] ?? kind
}

export function getTimeOffStatusLabel(status: string): string {
  return TIME_OFF_STATUS_LABELS[status as TimeOffStatus] ?? status
}

/** Map a request kind to the timecard entry category used when materialising. */
export function timeOffKindToEntryCategory(kind: TimeOffKind): string {
  // 'other' has no timecard absence category — fall back to unbezahlt's sibling.
  return kind === TIME_OFF_KINDS.OTHER ? 'unbezahlt' : kind
}
