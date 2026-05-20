import { Metadata } from 'next'
import ProductManagement from '@/components/admin/ProductManagement'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Package } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { ROUTES } from '@/config/routes'

export const metadata: Metadata = {
  title: 'Produktverwaltung',
  description: 'Verwalte die RevampIT Shop-Produkte.',
}

export default async function ProductsAdminPage() {
  return (
    <AdminPageWrapper
      title="Produktverwaltung"
      description="Verwalte die Shop-Produkte und deren Details"
      icon={Package}
      iconColor="indigo"
      backButton={{ href: ROUTES.admin.dashboard, label: 'Zurück zum Dashboard' }}
      actions={
        <Button as={Link} href={ROUTES.admin.erfassung} variant="primary" size="sm">
          Neues Produkt
        </Button>
      }
    >
      <ProductManagement />
    </AdminPageWrapper>
  )
}