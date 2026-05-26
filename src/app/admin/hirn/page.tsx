/**
 * Admin Hirn Page - Server Component (auth gate)
 *
 * Belt-and-suspenders page-level access check for the sensitive `hirn`
 * section (AI chat assistant — can be configured to expose org data via
 * future tools). Layout-level sidebar filtering already hides the entry
 * point but a direct URL would otherwise render the client chat UI; only
 * the per-message API calls would then fail auth-side, producing a
 * confusing partial-render. Matches the pattern used by
 * /admin/users/page.tsx and /admin/team/page.tsx.
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import HirnPageClient from './HirnPageClient'

export const metadata: Metadata = {
  title: 'Hirn AI',
  description: 'AI-Assistent für RevampIT.',
}

export default async function AdminHirnPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/hirn')
  }

  const hasAccess = canAccessSection({
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }, 'hirn')

  if (!hasAccess) {
    redirect('/admin?error=no_hirn_access')
  }

  return <HirnPageClient />
}
