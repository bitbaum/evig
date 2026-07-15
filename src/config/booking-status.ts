/**
 * Booking Status Configuration
 *
 * SSOT for booking/appointment lifecycle status labels and badges.
 * Used by: customer bookings, technician bookings, admin booking views
 *
 * The booking lifecycle:
 *   requested → accepted → quoted → quote_approved → in_progress → completed
 *                                  → quote_rejected (back to quoted)
 *                       → rejected
 *   Any state → cancelled
 *
 * Technician view uses simplified aliases:
 *   pending = requested, confirmed = accepted/quote_approved
 */

import { TECHNICIAN_LABEL } from '@/config/terminology'
import type { Transition } from '@/lib/lifecycle'

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

/**
 * Lifecycle statuses an appointment row can actually carry in the DB.
 * Excludes the repairer-view aliases (pending/confirmed) — those are
 * display-only synonyms; offering them as filters produced duplicate
 * "Bestätigt"/"Ausstehend" chips that never matched any row.
 */
export const CANONICAL_BOOKING_STATUSES: readonly BookingStatus[] = [
  BOOKING_STATUS.REQUESTED,
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.QUOTED,
  BOOKING_STATUS.QUOTE_APPROVED,
  BOOKING_STATUS.QUOTE_REJECTED,
  BOOKING_STATUS.IN_PROGRESS,
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.REJECTED,
  BOOKING_STATUS.CANCELLED,
]

// ============================================================================
// Appointment Transitions (SSOT) — who can do what, from which state
// ============================================================================
//
// One row per action. `to` is omitted for actions that change no status
// (update, rate). `role` lists who may perform it (cancel: either party).
// `roleError` / `stateError` are the exact user-facing messages the API
// returns — `roleError` maps to 403, `stateError` to 400 (see the
// appointments PATCH route). Validated via resolveTransition() from
// @/lib/lifecycle; the per-action side-effect fields stay in buildActionUpdate.

export type AppointmentRole = 'customer' | 'repairer'

export type AppointmentAction =
  | 'accept' | 'reject' | 'quote' | 'approve_quote' | 'reject_quote'
  | 'start' | 'complete' | 'update' | 'rate' | 'cancel'

export interface AppointmentTransition
  extends Transition<BookingStatus, AppointmentAction, AppointmentRole> {
  /** 403 — actor's role may not perform this action. */
  roleError: string
  /** 400 — action not allowed from the current status. */
  stateError: string
}

export const APPOINTMENT_TRANSITIONS: readonly AppointmentTransition[] = [
  {
    action: 'accept', role: 'repairer',
    from: [BOOKING_STATUS.REQUESTED], to: BOOKING_STATUS.ACCEPTED,
    roleError: 'Nur der Techniker kann annehmen',
    stateError: 'Termin kann nicht angenommen werden',
  },
  {
    action: 'reject', role: 'repairer',
    from: [BOOKING_STATUS.REQUESTED], to: BOOKING_STATUS.REJECTED,
    roleError: 'Nur der Techniker kann ablehnen',
    stateError: 'Termin kann nicht abgelehnt werden',
  },
  {
    action: 'quote', role: 'repairer',
    from: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTE_REJECTED], to: BOOKING_STATUS.QUOTED,
    roleError: 'Nur der Techniker kann Angebote erstellen',
    stateError: 'Angebot kann in diesem Status nicht erstellt werden',
  },
  {
    action: 'approve_quote', role: 'customer',
    from: [BOOKING_STATUS.QUOTED], to: BOOKING_STATUS.QUOTE_APPROVED,
    roleError: 'Nur der Kunde kann Angebote bestätigen',
    stateError: 'Kein Angebot zum Bestätigen',
  },
  {
    action: 'reject_quote', role: 'customer',
    from: [BOOKING_STATUS.QUOTED], to: BOOKING_STATUS.QUOTE_REJECTED,
    roleError: 'Nur der Kunde kann Angebote ablehnen',
    stateError: 'Kein Angebot zum Ablehnen',
  },
  {
    action: 'start', role: 'repairer',
    from: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTE_APPROVED], to: BOOKING_STATUS.IN_PROGRESS,
    roleError: 'Nur der Techniker kann starten',
    stateError: 'Termin kann nicht gestartet werden',
  },
  {
    action: 'complete', role: 'repairer',
    from: [BOOKING_STATUS.IN_PROGRESS], to: BOOKING_STATUS.COMPLETED,
    roleError: 'Nur der Techniker kann abschliessen',
    stateError: 'Termin ist nicht in Bearbeitung',
  },
  {
    action: 'update', role: 'customer',
    from: [BOOKING_STATUS.REQUESTED], // no status change
    roleError: 'Nur der Kunde kann Angaben bearbeiten',
    stateError: 'Angaben können nur im Status "Angefragt" bearbeitet werden',
  },
  {
    action: 'rate', role: 'customer',
    from: [BOOKING_STATUS.COMPLETED], // no status change
    roleError: 'Nur der Kunde kann bewerten',
    stateError: 'Nur abgeschlossene Termine können bewertet werden',
  },
  {
    // Either party may cancel before the job is in progress. No role gate
    // beyond "is a participant" (the route's upfront access check covers that),
    // so roleError is unreachable in practice.
    action: 'cancel', role: ['customer', 'repairer'],
    from: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.QUOTED, BOOKING_STATUS.QUOTE_APPROVED],
    to: BOOKING_STATUS.CANCELLED,
    roleError: 'Kein Zugriff auf diesen Termin',
    stateError: 'Termin kann nicht mehr storniert werden',
  },
]

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
    description: `${TECHNICIAN_LABEL} hat angenommen`,
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
    description: `${TECHNICIAN_LABEL} hat abgelehnt`,
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

/** Statuses where the customer can initiate Payrexx checkout. */
export const PAYABLE_BOOKING_STATUSES: readonly BookingStatus[] = [
  BOOKING_STATUS.QUOTE_APPROVED,
  BOOKING_STATUS.IN_PROGRESS,
] as const

export function isPayableBookingStatus(status: string): boolean {
  return (PAYABLE_BOOKING_STATUSES as readonly string[]).includes(status)
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
