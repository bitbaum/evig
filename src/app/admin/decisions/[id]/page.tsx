/**
 * Decision Detail Page - Server Component
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { Vote } from 'lucide-react'
import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { isSuperAdmin } from '@/lib/permissions'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import DecisionDetailClient from './DecisionDetailClient'
import { DECISION_TYPE_CONFIG } from '@/config/decisions'

export const metadata: Metadata = {
  title: 'Entscheidung',
  description: 'Entscheidungsdetails und Abstimmung',
}

export default async function DecisionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.email) {
    return null
  }

  const { id } = await params

  // session.user.id is populated by Auth.js — no need for an extra users-by-email
  // lookup. We only fetch the decision for the page header (title + type).
  const decisionResult = await query<{ title: string; decision_type: string }>(
    `SELECT title, decision_type FROM ${TABLE_NAMES.DECISIONS} WHERE id = $1`,
    [id]
  )

  const currentUserId = session.user.id
  const isAdmin = isSuperAdmin(session.user.email, session.user.isSuperAdmin)
  const decision = decisionResult.rows[0]
  const decisionTitle = decision?.title || 'Entscheidung'
  const decisionTypeLabel = decision?.decision_type
    ? DECISION_TYPE_CONFIG[decision.decision_type as keyof typeof DECISION_TYPE_CONFIG]?.label
    : undefined

  return (
    <AdminPageWrapper
      title={decisionTitle}
      description={decisionTypeLabel}
      icon={Vote}
      iconColor="blue"
      backButton={{ href: '/admin/decisions', label: 'Entscheidungen' }}
    >
      <DecisionDetailClient
        decisionId={id}
        currentUserId={currentUserId}
        isSuperAdmin={isAdmin}
      />
    </AdminPageWrapper>
  )
}
