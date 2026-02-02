"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Package,
  Eye,
  Edit,
  Trash2,
  Printer,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InventoryProduct } from '@/hooks/useInventoryProducts'

interface InventoryProductsTableProps {
  products: InventoryProduct[]
  searchQuery: string
  onView?: (product: InventoryProduct) => void
  onEdit?: (product: InventoryProduct) => void
  onDelete?: (product: InventoryProduct) => void
}

export function InventoryProductsTable({
  products,
  searchQuery,
  onView,
  onEdit,
  onDelete,
}: InventoryProductsTableProps) {
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.item_uuid.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Artikel-Nr.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produkt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preis
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bestand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lager
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredProducts.map((product) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4">
                  <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {product.item_uuid}
                  </code>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {product.brand} {product.product_name}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {product.short_description || product.category || 'Keine Beschreibung'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span
                      className={cn(
                        "inline-flex px-2 py-1 text-xs font-medium rounded-full w-fit",
                        product.marketplace_status === 'published'
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      )}
                    >
                      {product.marketplace_status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                    <span
                      className={cn(
                        "inline-flex px-2 py-1 text-xs font-medium rounded-full w-fit",
                        product.status === 'approved'
                          ? "bg-blue-100 text-blue-800"
                          : product.status === 'pending_review'
                          ? "bg-orange-100 text-orange-800"
                          : "bg-gray-100 text-gray-800"
                      )}
                    >
                      {product.status === 'approved'
                        ? 'Freigegeben'
                        : product.status === 'pending_review'
                        ? 'Zur Prüfung'
                        : product.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-green-600">
                    CHF {product.estimated_price_chf.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "font-medium",
                      product.quantity_available < 3 ? "text-red-600" : "text-gray-900"
                    )}
                  >
                    {product.quantity_available}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600">
                    {product.location || '-'}
                    {product.box_id && (
                      <span className="text-gray-400"> / {product.box_id}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/products/${product.id}/factsheet`}
                      className="p-1 text-green-600 hover:text-green-800"
                      title="Factsheet drucken"
                    >
                      <Printer className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onView?.(product)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Ansehen"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit?.(product)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Bearbeiten"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete?.(product)}
                      className="p-1 text-red-400 hover:text-red-600"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Keine erfassten Produkte
          </h3>
          <p className="text-gray-600 mb-4">
            Erfassen Sie Ihr erstes Produkt, um zu beginnen.
          </p>
          <Link
            href="/admin/erfassung"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Produkt erfassen
          </Link>
        </div>
      )}
    </div>
  )
}
