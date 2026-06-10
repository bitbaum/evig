import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Store } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import MarketplaceAdminClient from './MarketplaceAdminClient'

export const metadata: Metadata = {
  title: 'Marketplace',
  description: 'Inserate verwalten, Meldungen bearbeiten, Bestellungen einsehen.',
}

export default async function MarketplacePage() {
  const t = await getTranslations('admin.marketplace')
  return (
    <AdminPageWrapper
      title={t('pageTitle')}
      description={t('pageDescription')}
      icon={Store}
      iconColor="green"
    >
      <MarketplaceAdminClient />
    </AdminPageWrapper>
  )
}
