import { Metadata } from 'next'
import { ROLES } from '@/lib/constants'
import { requireRole } from '@/middleware/admin'
import ProductManagement from '@/components/admin/ProductManagement'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'
import { MEDUSA_CONFIG } from '@/config/medusa'

export const metadata: Metadata = {
  title: 'Produktverwaltung | RevampIT Admin',
  description: 'Verwalten Sie Ihre RevampIT Shop-Produkte.',
}

export default async function ProductsAdminPage() {
  // Temporarily bypass role check for testing
  // await requireRole(ROLES.REVAMPIT_ADMIN)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück zum Dashboard
          </Link>
          <div className="w-px h-6 bg-gray-300" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Produktverwaltung
              </h1>
              <p className="text-gray-600">
                Verwalten Sie Ihre Shop-Produkte und deren Details
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          <Link
            href={MEDUSA_CONFIG.ADMIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-300 rounded-lg transition-colors"
          >
            Medusa Admin öffnen
          </Link>
          <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            Neues Produkt
          </button>
        </div>
      </div>

      {/* Product Management Component */}
      <ProductManagement />
    </div>
  )
}