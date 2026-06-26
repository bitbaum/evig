/**
 * HR job application pipeline — SSOT (separate from generic approval-status).
 */

export const APPLICATION_STATUS = {
  NEW: 'new',
  SCREENING: 'screening',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  HIRED: 'hired',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const

export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS]

export const APPLICATION_STATUS_OPTIONS = Object.values(APPLICATION_STATUS)

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  new: 'Neu',
  screening: 'Sichtung',
  interview: 'Gespräch',
  offer: 'Angebot',
  hired: 'Eingestellt',
  rejected: 'Abgelehnt',
  withdrawn: 'Zurückgezogen',
}

const APPLICATION_STATUS_BADGE_STYLES: Record<ApplicationStatus, { color: string; bg: string }> = {
  new: {
    color: 'text-info-800 dark:text-info-300',
    bg: 'bg-info-100 dark:bg-info-900/30',
  },
  screening: {
    color: 'text-warning-800 dark:text-warning-300',
    bg: 'bg-warning-100 dark:bg-warning-900/30',
  },
  interview: {
    color: 'text-primary-800 dark:text-primary-300',
    bg: 'bg-primary-100 dark:bg-primary-900/30',
  },
  offer: {
    color: 'text-purple-800 dark:text-purple-300',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
  },
  hired: {
    color: 'text-primary-800 dark:text-primary-300',
    bg: 'bg-primary-100 dark:bg-primary-900/30',
  },
  rejected: {
    color: 'text-error-800 dark:text-error-300',
    bg: 'bg-error-100 dark:bg-error-900/30',
  },
  withdrawn: {
    color: 'text-neutral-700 dark:text-neutral-400',
    bg: 'bg-neutral-100 dark:bg-neutral-800',
  },
}

export const APPLICATION_STATUS_BADGES: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string }
> = Object.fromEntries(
  APPLICATION_STATUS_OPTIONS.map((status) => [
    status,
    {
      label: APPLICATION_STATUS_LABELS[status],
      ...APPLICATION_STATUS_BADGE_STYLES[status],
    },
  ]),
) as Record<ApplicationStatus, { label: string; color: string; bg: string }>

/** Pipeline statuses (not terminal) — retention, hire eligibility */
export const OPEN_APPLICATION_STATUSES: ApplicationStatus[] = [
  APPLICATION_STATUS.NEW,
  APPLICATION_STATUS.SCREENING,
  APPLICATION_STATUS.INTERVIEW,
  APPLICATION_STATUS.OFFER,
]

export const HIREABLE_APPLICATION_STATUSES = OPEN_APPLICATION_STATUSES

export function isTerminalApplicationStatus(status: ApplicationStatus): boolean {
  return TERMINAL_APPLICATION_STATUSES.includes(status)
}

export function isHireableApplicationStatus(status: ApplicationStatus): boolean {
  return HIREABLE_APPLICATION_STATUSES.includes(status)
}

export function isOpenApplicationStatus(status: ApplicationStatus): boolean {
  return OPEN_APPLICATION_STATUSES.includes(status)
}

/** Forward pipeline (admin advance) */
export const APPLICATION_FORWARD_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  new: ['screening', 'interview', 'offer', 'rejected'],
  screening: ['interview', 'offer', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: ['hired', 'rejected'],
  hired: [],
  rejected: [],
  withdrawn: [],
}

export const TERMINAL_APPLICATION_STATUSES: ApplicationStatus[] = [
  APPLICATION_STATUS.HIRED,
  APPLICATION_STATUS.REJECTED,
  APPLICATION_STATUS.WITHDRAWN,
]

export function getApplicationStatusLabel(status: string): string {
  return APPLICATION_STATUS_LABELS[status as ApplicationStatus] ?? status
}

export function getApplicationStatusBadge(status: string) {
  return APPLICATION_STATUS_BADGES[status as ApplicationStatus] ?? APPLICATION_STATUS_BADGES.new
}
