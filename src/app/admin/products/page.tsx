import { Metadata } from 'next'
import ProductManagement from '@/components/admin/ProductManagement'
import Link from 'next/link'
import { Package } from 'lucide-react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'

export const metadata: Metadata = {
  title: 'Produktverwaltung | RevampIT Admin',
  description: 'Verwalte die RevampIT Shop-Produkte.',
}

export default async function ProductsAdminPage() {
  return (
    <AdminPageWrapper
      title="Produktverwaltung"
      description="Verwalte die Shop-Produkte und deren Details"
      icon={Package}
      iconColor="indigo"
      backButton={{ href: '/admin', label: 'Zurück zum Dashboard' }}
      actions={
        <Link
          href="/admin/erfassung"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Neues Produkt
        </Link>
      }
    >
      <ProductManagement />
    </AdminPageWrapper>
  )
}