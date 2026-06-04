/**
 * Admin Decisions Page - Server Component
 *
 * Shows decision list with filters and stats.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { buttonClass } from '@/components/ui/button-class'
import { auth } from '@/auth'
import { isSuperAdmin } from '@/lib/permissions'
import { Plus, Vote } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import DecisionListClient from './DecisionListClient'
import { ROUTES } from '@/config/routes'
import { getDecisionStats } from '@/lib/services/decisions'

export const metadata: Metadata = {
  title: 'Entscheidungen',
  description: 'Vorschläge und Abstimmungen im Team',
}

export default async function DecisionsAdminPage() {
  const session = await auth()
  if (!session?.user?.email) {
    return null
  }

  // session.user.id is populated by Auth.js — no need for an extra users lookup.
  const currentUserId = session.user.id
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
        <Link href={ROUTES.admin.decisionNew} className={buttonClass({ variant: 'primary', size: 'sm' })}>
          <Plus className="w-4 h-4" />
          Neuer Vorschlag
        </Link>
      }
    >
      <DecisionListClient currentUserId={currentUserId} isSuperAdmin={isAdmin} stats={stats} />
    </AdminPageWrapper>
  )
}
