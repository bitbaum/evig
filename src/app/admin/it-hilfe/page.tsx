import { Metadata } from 'next'
import { HelpCircle } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import ITHilfeAdminClient from './ITHilfeAdminClient'

export const metadata: Metadata = {
  title: 'IT-Hilfe',
  description: 'Hilfsanfragen und Techniker verwalten.',
}

export default function ITHilfePage() {
  return (
    <AdminPageWrapper
      title="IT-Hilfe"
      description="Hilfsanfragen und Techniker verwalten"
      icon={HelpCircle}
      iconColor="blue"
    >
      <ITHilfeAdminClient />
    </AdminPageWrapper>
  )
}
