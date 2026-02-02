/**
 * Admin New Service Page
 *
 * Server component for creating new services.
 */

import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { canAccessSection } from '@/lib/permissions'
import { ServiceForm } from '@/components/admin/ServiceForm'

export const metadata: Metadata = {
  title: 'Neue Dienstleistung | RevampIT Admin',
  description: 'Neue Dienstleistung erstellen',
}

export default async function AdminNewServicePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/services/new')
  }

  const user = {
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }

  if (!canAccessSection(user, 'services')) {
    redirect('/admin')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ServiceForm />
    </div>
  )
}
