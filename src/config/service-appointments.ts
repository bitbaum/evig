/**
 * Service appointment routes — SSOT
 *
 * Domain: RevampIT workshop / professional repair bookings (`service_appointments`).
 * NOT IT-Hilfe peer requests (`it_hilfe_requests`) and NOT workshop registrations.
 *
 * User-facing list + detail live under `/dashboard/appointments/*` only.
 * Legacy `/dashboard/bookings/*` redirects here.
 */

export const SERVICE_APPOINTMENT_ROUTES = {
  list: '/dashboard/appointments',
  listAsRepairer: '/dashboard/appointments?role=repairer',
  detail: (id: string) => `/dashboard/appointments/${id}`,
  /** Notification bell appends related_id to this base */
  notificationBase: '/dashboard/appointments/',
  adminList: '/admin/appointments',
  adminDetail: (id: string) => `/admin/appointments/${id}`,
} as const
