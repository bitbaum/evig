/**
 * New Decision Page - Server Component
 */

import { Metadata } from 'next'
import { auth } from '@/auth'
import { Vote } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import DecisionFormClient from './DecisionFormClient'

export const metadata: Metadata = {
  title: 'Neuer Vorschlag | RevampIT Admin',
  description: 'Neue Entscheidung erstellen',
}

export default async function NewDecisionPage() {
  const session = await auth()
  if (!session?.user?.email) {
    return null
  }

  return (
    <AdminPageWrapper
      title="Neuer Vorschlag"
      description="Erstelle einen neuen Vorschlag zur Abstimmung"
      icon={Vote}
      iconColor="blue"
      backButton={{ href: '/admin/decisions', label: 'Zurück' }}
    >
      <DecisionFormClient />
    </AdminPageWrapper>
  )
}
