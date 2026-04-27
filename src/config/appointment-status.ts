/**
 * Service Appointment Status Configuration
 *
 * SSOT for service appointment lifecycle statuses.
 * Distinct from IT-Hilfe booking statuses (see booking-status.ts).
 * Used by: appointment booking API routes
 */

export const APPOINTMENT_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  REQUESTED: 'requested',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const

export type AppointmentStatus = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS]

export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  [APPOINTMENT_STATUS.PENDING_APPROVAL]: 'Genehmigung ausstehend',
  [APPOINTMENT_STATUS.REQUESTED]: 'Angefragt',
  [APPOINTMENT_STATUS.CONFIRMED]: 'Bestätigt',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'In Bearbeitung',
  [APPOINTMENT_STATUS.CANCELLED]: 'Storniert',
  [APPOINTMENT_STATUS.COMPLETED]: 'Abgeschlossen',
}

export function getAppointmentStatusLabel(status: string): string {
  return APPOINTMENT_STATUS_LABELS[status] ?? status
}
