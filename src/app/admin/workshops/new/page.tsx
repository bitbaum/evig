import { redirect } from 'next/navigation'

/**
 * Workshops are created through the proposal flow (Vorschlag → Freigabe →
 * insert). The form that used to live here validated, waited 1s and silently
 * discarded everything — a fake submit. Redirect straight to /admin/workshops
 * (proposals are triaged there; /admin/workshops/proposals is itself only a
 * redirect stub for old email deep links — avoid the double hop).
 */
export default function AdminWorkshopNewRedirect() {
  redirect('/admin/workshops')
}
