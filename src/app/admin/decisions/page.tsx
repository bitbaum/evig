/**
 * Admin Decisions Page - Server Component
 *
 * Shows decision list with filters and stats.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/auth'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { isSuperAdmin } from '@/lib/permissions'
import { Plus, Vote } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import DecisionListClient from './DecisionListClient'
import { getDecisionStats } from '@/lib/services/decisions'

export const metadata: Metadata = {
  title: 'Entscheidungen | RevampIT Admin',
  description: 'Vorschläge und Abstimmungen im Team',
}

export default async function DecisionsAdminPage() {
  const session = await auth()
  if (!session?.user?.email) {
    return null
  }

  const userResult = await query<{ id: string }>(
    `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
    [session.user.email]
  )
  const currentUserId = userResult.rows[0]?.id || ''
  const isAdmin = isSuperAdmin(session.user.email, session.user.isSuperAdmin)

  const stats = currentUserId
    ? await getDecisionStats(currentUserId)
    : { voting: 0, discussion: 0, closed: 0, pendingVotes: 0 }

  return (
    <AdminPageWrapper
      title="Entscheidungen"
      description="Vorschläge und Abstimmungen im Team"
      icon={Vote}
      iconColor="blue"
      actions={
        <Link
          href="/admin/decisions/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Neuer Vorschlag
        </Link>
      }
    >
      <DecisionListClient currentUserId={currentUserId} isSuperAdmin={isAdmin} stats={stats} />
    </AdminPageWrapper>
  )
}
