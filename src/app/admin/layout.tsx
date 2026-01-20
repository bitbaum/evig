/**
 * Admin Layout - Server Component
 *
 * Handles authentication and authorization for the admin area.
 * Uses the simplified permission system.
 */

import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { getAccessibleSections, isSuperAdmin, type AdminSection } from '@/lib/permissions'
import { AdminLayoutClient } from './AdminLayoutClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get session
  const session = await auth()

  // Check if user is authenticated
  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin')
  }

  // Check if user is staff
  if (!session.user.isStaff) {
    redirect('/?error=not_staff')
  }

  // Get accessible sections for this user
  const accessibleSections = getAccessibleSections({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  })

  // If user has no permissions at all, redirect
  if (accessibleSections.length === 0) {
    redirect('/?error=no_admin_access')
  }

  return (
    <AdminLayoutClient
      user={{
        name: session.user.name ?? null,
        email: session.user.email,
        isStaff: session.user.isStaff,
        staffPermissions: session.user.staffPermissions,
      }}
      accessibleSections={accessibleSections}
    >
      {children}
    </AdminLayoutClient>
  )
}
