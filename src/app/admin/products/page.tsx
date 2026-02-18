import { Metadata } from 'next'
import ProductManagement from '@/components/admin/ProductManagement'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { MEDUSA_CONFIG } from '@/config/medusa'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'

export const metadata: Metadata = {
  title: 'Produktverwaltung | RevampIT Admin',
  description: 'Verwalten Sie Ihre RevampIT Shop-Produkte.',
}

export default async function ProductsAdminPage() {
  return (
    <AdminPageWrapper
      title="Produktverwaltung"
      description="Verwalten Sie Ihre Shop-Produkte und deren Details"
      icon={Package}
      iconColor="indigo"
      backButton={{ href: '/admin', label: 'Zurück zum Dashboard' }}
      actions={
        <>
          <Link
            href={MEDUSA_CONFIG.ADMIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded-lg transition-colors"
          >
            Medusa Admin öffnen
          </Link>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Neues Produkt
          </Link>
        </>
      }
    >
      <ProductManagement />
    </AdminPageWrapper>
  )
}