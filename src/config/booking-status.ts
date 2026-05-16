/**
 * Booking Status Configuration
 *
 * SSOT for booking/appointment lifecycle status labels and badges.
 * Used by: customer bookings, repairer bookings, admin booking views
 *
 * The booking lifecycle:
 *   requested → accepted → quoted → quote_approved → in_progress → completed
 *                                  → quote_rejected (back to quoted)
 *                       → rejected
 *   Any state → cancelled
 *
 * Repairer view uses simplified aliases:
 *   pending = requested, confirmed = accepted/quote_approved
 */

export const BOOKING_STATUS = {
  REQUESTED: 'requested',
  ACCEPTED: 'accepted',
  QUOTED: 'quoted',
  QUOTE_APPROVED: 'quote_approved',
  QUOTE_REJECTED: 'quote_rejected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  // Repairer-view aliases
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
} as const

export type BookingStatus = typeof BOOKING_STATUS[keyof typeof BOOKING_STATUS]

export interface BookingStatusBadge {
  label: string
  color: string
  description?: string
}

export const BOOKING_STATUS_BADGES: Record<string, BookingStatusBadge> = {
  [BOOKING_STATUS.REQUESTED]: {
    label: 'Angefragt',
    color: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
    description: 'Wartet auf Bestätigung',
  },
  [BOOKING_STATUS.ACCEPTED]: {
    label: 'Angenommen',
    color: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    description: 'Reparateur hat angenommen',
  },
  [BOOKING_STATUS.QUOTED]: {
    label: 'Angebot erhalten',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    description: 'Bitte bestätigen',
  },
  [BOOKING_STATUS.QUOTE_APPROVED]: {
    label: 'Bestätigt',
    color: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    description: 'Wartet auf Start',
  },
  [BOOKING_STATUS.QUOTE_REJECTED]: {
    label: 'Angebot abgelehnt',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    description: 'Neues Angebot erwartet',
  },
  [BOOKING_STATUS.IN_PROGRESS]: {
    label: 'In Bearbeitung',
    color: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    description: 'Wird repariert',
  },
  [BOOKING_STATUS.COMPLETED]: {
    label: 'Abgeschlossen',
    color: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    description: 'Reparatur fertig',
  },
  [BOOKING_STATUS.REJECTED]: {
    label: 'Abgelehnt',
    color: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300',
    description: 'Reparateur hat abgelehnt',
  },
  [BOOKING_STATUS.CANCELLED]: {
    label: 'Storniert',
    color: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-300',
    description: 'Termin abgebrochen',
  },
  // Repairer-view aliases
  [BOOKING_STATUS.PENDING]: {
    label: 'Ausstehend',
    color: 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300',
  },
  [BOOKING_STATUS.CONFIRMED]: {
    label: 'Bestätigt',
    color: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  },
}

export function getBookingStatusBadge(status: string): BookingStatusBadge {
  return BOOKING_STATUS_BADGES[status] ?? {
    label: status,
    color: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-300',
  }
}

export function getBookingStatusLabel(status: string): string {
  return BOOKING_STATUS_BADGES[status]?.label ?? status
}

/**
 * Urgency levels for booking requests
 */
export const URGENCY_BADGES: Record<string, { label: string; color: string }> = {
  urgent: {
    label: 'Dringend',
    color: 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300',
  },
  high: {
    label: 'Hoch',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  },
  normal: {
    label: 'Normal',
    color: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300',
  },
}

export function getUrgencyBadge(urgency: string): { label: string; color: string } {
  return URGENCY_BADGES[urgency] ?? URGENCY_BADGES.normal
}
