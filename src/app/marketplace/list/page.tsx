import { Metadata } from 'next'
import { requireAuth } from '@/middleware/auth'
import ProductListingForm from '@/components/marketplace/ProductListingForm'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Produkt auflisten | RevampIT Marketplace',
  description: 'Listen Sie Ihr gebrauchtes IT-Equipment auf dem RevampIT Marketplace.',
}

export default async function ListProductPage() {
  // Require authentication
  await requireAuth()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Zurück zum Marketplace
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Produkt auflisten
              </h1>
              <p className="text-gray-600 mt-1">
                Verkaufen Sie Ihr gebrauchtes IT-Equipment auf dem RevampIT Marketplace
              </p>
            </div>
          </div>
        </div>

        {/* Listing Form */}
        <ProductListingForm />
      </div>
    </div>
  )
}



