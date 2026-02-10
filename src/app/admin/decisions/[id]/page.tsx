/**
 * Decision Detail Page - Server Component
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { Vote } from 'lucide-react'
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

  return (
    <AdminPageWrapper
      title="Entscheidung"
      icon={Vote}
      iconColor="blue"
      backButton={{ href: '/admin/decisions', label: 'Zurück' }}
    >
      <DecisionDetailClient decisionId={id} />
    </AdminPageWrapper>
  )
}
