import { permanentRedirect } from 'next/navigation'
import { SERVICE_APPOINTMENT_ROUTES } from '@/config/service-appointments'

/** Legacy route — service appointments SSOT is `/dashboard/appointments`. */
export default function LegacyBookingsRedirect() {
  permanentRedirect(SERVICE_APPOINTMENT_ROUTES.list)
}
