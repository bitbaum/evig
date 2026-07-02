import { redirect } from 'next/navigation'

/**
 * Workshops are created through the proposal flow (Vorschlag → Freigabe →
 * insert). The form that used to live here validated, waited 1s and silently
 * discarded everything — a fake submit. Redirect to the real flow.
 */
export default function AdminWorkshopNewRedirect() {
  redirect('/admin/workshops/proposals')
}
