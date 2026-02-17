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

export const metadata: Metadata = {
  title: 'Entscheidung | RevampIT Admin',
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

  const userResult = await query<{ id: string }>(
    `SELECT id FROM ${TABLE_NAMES.USERS} WHERE email = $1`,
    [session.user.email]
  )
  const currentUserId = userResult.rows[0]?.id || ''
  const isAdmin = isSuperAdmin(session.user.email, session.user.isSuperAdmin)

  return (
    <AdminPageWrapper
      title="Entscheidung"
      icon={Vote}
      iconColor="blue"
      backButton={{ href: '/admin/decisions', label: 'Zurück' }}
    >
      <DecisionDetailClient
        decisionId={id}
        currentUserId={currentUserId}
        isSuperAdmin={isAdmin}
      />
    </AdminPageWrapper>
  )
}
