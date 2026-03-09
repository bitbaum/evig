"use client"

import { motion } from 'framer-motion'
import { getConditionBadge } from '@/config/erfassung/conditions'
import {
  Package,
  Eye,
  Edit,
  Trash2,
  EyeOff,
  Image as ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ShopProduct } from './types'

interface ShopProductsTableProps {
  products: ShopProduct[]
  searchQuery: string
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  onSelectAll?: (ids: string[]) => void
  onView?: (product: ShopProduct) => void
  onEdit?: (product: ShopProduct) => void
  onUnpublish?: (product: ShopProduct) => void
  onDelete?: (product: ShopProduct) => void
}

// Condition labels and colors from SSOT: @/config/erfassung/conditions

export function ShopProductsTable({
  products,
  searchQuery,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onView,
  onEdit,
  onUnpublish,
  onDelete,
}: ShopProductsTableProps) {
  // Filter products by search query
  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      product.title.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query) ||
      product.model.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query)
    )
  })

  const selectable = !!selectedIds && !!onToggleSelect
  const filteredIds = filteredProducts.map(p => p.id)
  const allSelected = selectable && filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => onSelectAll?.(filteredIds)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Produkt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preis
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Zustand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Zielgruppen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bestand
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
                className={cn("hover:bg-gray-50", selectable && selectedIds.has(product.id) && "bg-indigo-50")}
              >
                {selectable && (
                  <td className="w-10 px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => onToggleSelect(product.id)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                )}
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-3 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{product.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {product.category && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mr-2">
                            {product.category}
                          </span>
                        )}
                        {product.description?.substring(0, 40)}
                        {product.description && product.description.length > 40 && '...'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-gray-900">
                    CHF {product.price.toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "inline-flex px-2 py-1 text-xs font-medium rounded-full",
                      getConditionBadge(product.condition).color
                    )}
                  >
                    {getConditionBadge(product.condition).label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {product.customer_profiles.length > 0 ? (
                      product.customer_profiles.slice(0, 3).map((profile) => (
                        <span
                          key={profile.slug}
                          className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
                          style={{
                            backgroundColor: `${profile.color}20`,
                            color: profile.color,
                          }}
                        >
                          {profile.name_de}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">Keine</span>
                    )}
                    {product.customer_profiles.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{product.customer_profiles.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "font-medium",
                      product.quantity < 3 ? "text-red-600" : "text-gray-900"
                    )}
                  >
                    {product.quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onView?.(product)}
                      className="p-1 text-gray-500 hover:text-gray-600"
                      title="Im Shop ansehen"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit?.(product)}
                      className="p-1 text-gray-500 hover:text-gray-600"
                      title="Bearbeiten"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onUnpublish?.(product)}
                      className="p-1 text-yellow-400 hover:text-yellow-600"
                      title="Aus Shop entfernen"
                    >
                      <EyeOff className="w-4 h-4" />
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
            {searchQuery ? 'Keine Produkte gefunden' : 'Keine veröffentlichten Produkte'}
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? 'Versuchen Sie eine andere Suche.'
              : 'Veröffentlichen Sie Produkte aus dem "Erfasste Produkte" Tab.'}
          </p>
        </div>
      )}
    </div>
  )
}
