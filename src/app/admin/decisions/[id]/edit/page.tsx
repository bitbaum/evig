/**
 * Edit Decision Page - Server Component
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { Vote } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import DecisionEditFormClient from './DecisionEditFormClient'

export const metadata: Metadata = {
  title: 'Entscheidung bearbeiten | RevampIT Admin',
  description: 'Entscheidung bearbeiten',
}

export default async function EditDecisionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.email) {
    return null
  }

  const { id } = await params

  return (
    <AdminPageWrapper
      title="Entscheidung bearbeiten"
      icon={Vote}
      iconColor="blue"
      backButton={{ href: `/admin/decisions/${id}`, label: 'Zurück' }}
    >
      <DecisionEditFormClient decisionId={id} />
    </AdminPageWrapper>
  )
}
