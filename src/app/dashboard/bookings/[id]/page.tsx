import { permanentRedirect } from 'next/navigation'
import { SERVICE_APPOINTMENT_ROUTES } from '@/config/service-appointments'

interface Props {
  params: Promise<{ id: string }>
}

/** Legacy route — redirects to unified service appointment detail. */
export default async function LegacyBookingDetailRedirect({ params }: Props) {
  const { id } = await params
  permanentRedirect(SERVICE_APPOINTMENT_ROUTES.detail(id))
}
