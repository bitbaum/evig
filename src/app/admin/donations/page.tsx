/**
 * Admin Donations Page - Server Component (auth gate)
 *
 * Belt-and-suspenders page-level access check for the sensitive
 * `donations` section. Layout-level sidebar filtering already hides the
 * link, but a direct URL would otherwise bypass that check and render the
 * client UI (which then would only fail at API-call time, with a confusing
 * error). This redirects to the admin home with a flag, matching the
 * pattern used by /admin/users/page.tsx and /admin/team/page.tsx.
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import DonationsPageClient from './DonationsPageClient'

export const metadata: Metadata = {
  title: 'Spenden',
  description: 'Geld- und Sachspenden verwalten.',
}

export default async function AdminDonationsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/donations')
  }

  const hasAccess = canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'donations')

  if (!hasAccess) {
    redirect('/admin?error=no_donations_access')
  }

  return <DonationsPageClient />
}
