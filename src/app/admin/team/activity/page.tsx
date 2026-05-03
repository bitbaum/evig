/**
 * Team Activity Page - Server Component
 *
 * Unified activity stream showing:
 * - Task completions
 * - Manual activity updates
 * - Help requests
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { canAccessSection } from '@/lib/permissions'
import { Activity, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ActivityPageClient } from './ActivityPageClient'
import Heading from '@/components/admin/AdminHeading'

export const metadata: Metadata = {
  title: 'Aktivitäten',
  description: 'Team-Aktivitäten und Updates.',
}

export default async function TeamActivityPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=/admin/team/activity')
  }

  const user = {
    email: session.user.email,
    is_staff: session.user.isStaff,
    staff_permissions: session.user.staffPermissions,
  }

  if (!canAccessSection(user, 'team')) {
    redirect('/admin?error=no_team_access')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/team"
            className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <Heading level={1} className="text-2xl font-bold text-neutral-900 dark:text-white">
              Team-Aktivitäten
            </Heading>
            <p className="text-neutral-600 dark:text-neutral-400">
              Was im Team passiert - Aufgaben, Updates, Meilensteine
            </p>
          </div>
        </div>
      </div>

      {/* Activity Feed (Client Component) */}
      <ActivityPageClient />
    </div>
  )
}
