'use client'

import Link from 'next/link'
import { Package, Printer, Plus, FileText } from 'lucide-react'
import Heading from '@/components/ui/Heading'

interface SuccessScreenProps {
  itemUUID: string
  productId: string
  onReset: () => void
}

export function SuccessScreen({ itemUUID, productId, onReset }: SuccessScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-green-600" />
        </div>
        <Heading level={2} className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Produkt erfasst!
        </Heading>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Item UUID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{itemUUID}</code>
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link
            href={`/admin/products/${productId}/factsheet`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Printer className="w-5 h-5" />
            Factsheet drucken
          </Link>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Weiteres Produkt erfassen
          </button>
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FileText className="w-5 h-5" />
            Zur Produktübersicht
          </Link>
        </div>
      </div>
    </div>
  )
}
