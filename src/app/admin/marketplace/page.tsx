import { Metadata } from 'next'
import { Store } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import MarketplaceAdminClient from './MarketplaceAdminClient'

export const metadata: Metadata = {
  title: 'Marketplace | RevampIT Admin',
  description: 'Inserate verwalten, Meldungen bearbeiten, Bestellungen einsehen.',
}

export default function MarketplacePage() {
  return (
    <AdminPageWrapper
      title="Marketplace"
      description="Inserate, Meldungen und Bestellungen verwalten"
      icon={Store}
      iconColor="green"
    >
      <MarketplaceAdminClient />
    </AdminPageWrapper>
  )
}
