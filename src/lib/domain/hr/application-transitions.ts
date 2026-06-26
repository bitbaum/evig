import {
  APPLICATION_FORWARD_TRANSITIONS,
  APPLICATION_STATUS,
  TERMINAL_APPLICATION_STATUSES,
  type ApplicationStatus,
} from '@/config/hr-application-status'

export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus): boolean {
  if (from === to) return false
  if (TERMINAL_APPLICATION_STATUSES.includes(from)) return false
  if (to === APPLICATION_STATUS.WITHDRAWN) return true
  return APPLICATION_FORWARD_TRANSITIONS[from]?.includes(to) ?? false
}

export function canHireApplication(status: ApplicationStatus): boolean {
  return status === APPLICATION_STATUS.OFFER || status === APPLICATION_STATUS.INTERVIEW
}
