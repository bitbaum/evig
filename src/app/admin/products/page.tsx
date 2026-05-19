import { Metadata } from 'next'
import ProductManagement from '@/components/admin/ProductManagement'
import Link from 'next/link'
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
        <Link
          href={ROUTES.admin.erfassung}
          className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          Neues Produkt
        </Link>
      }
    >
      <ProductManagement />
    </AdminPageWrapper>
  )
}