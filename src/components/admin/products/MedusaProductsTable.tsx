"use client"

import { motion } from 'framer-motion'
import {
  Package,
  DollarSign,
  Tag,
  Image as ImageIcon,
  Eye,
  Edit,
  Trash2,
  Users,
  Store,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProductWithOwner } from './types'
import { getMarketplaceStatusLabel, getMarketplaceStatusBadgeColor } from '@/config/marketplace-status'

interface MedusaProductsTableProps {
  products: ProductWithOwner[]
  selectedProducts: string[]
  onSelectAll: (checked: boolean) => void
  onSelectProduct: (productId: string, checked: boolean) => void
  searchQuery: string
  onView?: (product: ProductWithOwner) => void
  onEdit?: (product: ProductWithOwner) => void
  onDelete?: (product: ProductWithOwner) => void
}

export function MedusaProductsTable({
  products,
  selectedProducts,
  onSelectAll,
  onSelectProduct,
  searchQuery,
  onView,
  onEdit,
  onDelete,
}: MedusaProductsTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-gray-300"
                />
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
                Kategorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quelle
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={(e) => onSelectProduct(product.id, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3">
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{product.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {product.description?.substring(0, 60)}...
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                      getMarketplaceStatusBadgeColor(product.status ?? '')
                    )}
                  >
                    {getMarketplaceStatusLabel(product.status ?? '')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                    <span className="font-medium">
                      CHF{' '}
                      {product.variants?.[0]?.prices?.[0]?.amount
                        ? (product.variants[0].prices[0].amount / 100).toFixed(2)
                        : 'N/A'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "font-medium",
                      (product.variants?.reduce(
                        (sum, v) => sum + (v.inventory_quantity || 0),
                        0
                      ) || 0) < 5
                        ? "text-red-600"
                        : "text-gray-900"
                    )}
                  >
                    {product.variants?.reduce(
                      (sum, v) => sum + (v.inventory_quantity || 0),
                      0
                    ) || 0}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 text-gray-400 mr-1" />
                    <span className="text-gray-900">
                      {product.collection?.title || 'Keine Kategorie'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {product.owner_id ? (
                      <>
                        <Users className="w-4 h-4 text-purple-400 mr-1" />
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                          User: {product.owner_name}
                        </span>
                      </>
                    ) : (
                      <>
                        <Store className="w-4 h-4 text-indigo-400 mr-1" />
                        <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                          Admin
                        </span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
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

      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Keine Produkte gefunden
          </h3>
          <p className="text-gray-600">
            Erstellen Sie Ihr erstes Produkt, um zu beginnen.
          </p>
        </div>
      )}
    </div>
  )
}
