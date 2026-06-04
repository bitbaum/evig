"use client"

import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'
import Heading from '@/components/admin/AdminHeading'
import { buttonClass } from '@/components/ui/button-class'
import {
  Package,
  Eye,
  Edit,
  Trash2,
  Printer,
  Plus,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/config/routes'
import type { InventoryProduct } from '@/hooks/useInventoryProducts'
import {
  MARKETPLACE_STATUS,
  PRODUCT_STATUS,
  getMarketplaceStatusLabel,
  getMarketplaceStatusBadgeColor,
  getProductStatusLabel,
  getProductStatusBadgeColor,
} from '@/config/marketplace-status'

interface InventoryProductsTableProps {
  products: InventoryProduct[]
  searchQuery: string
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
  onSelectAll?: (ids: string[]) => void
  onView?: (product: InventoryProduct) => void
  onEdit?: (product: InventoryProduct) => void
  onDelete?: (product: InventoryProduct) => void
  onPublish?: (product: InventoryProduct) => void
}

export function InventoryProductsTable({
  products,
  searchQuery,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
  onPublish,
}: InventoryProductsTableProps) {
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.item_uuid.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const selectable = !!selectedIds && !!onToggleSelect
  const filteredIds = filteredProducts.map(p => p.id)
  const allSelected = selectable && filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id))

  return (
    <div className="bg-surface-base rounded-xl shadow-sm border border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead className="bg-surface-raised border-b border">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => onSelectAll?.(filteredIds)}
                    className="h-4 w-4 rounded border-neutral-300 text-action focus:ring-primary-500"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Artikel-Nr.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Produkt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Preis
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Bestand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Lager
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {filteredProducts.map((product) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn("hover:bg-neutral-50", selectable && selectedIds.has(product.id) && "bg-primary-50 dark:bg-primary-900/20")}
              >
                {selectable && (
                  <td className="w-10 px-3 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={() => onToggleSelect(product.id)}
                      className="h-4 w-4 rounded border-neutral-300 text-action focus:ring-primary-500"
                    />
                  </td>
                )}
                <td className="px-6 py-4">
                  <code className="text-sm font-mono bg-surface-raised px-2 py-1 rounded">
                    {product.item_uuid}
                  </code>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-surface-raised rounded-lg flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={`${product.brand} ${product.product_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-text-muted" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">
                        {product.brand} {product.product_name}
                      </div>
                      <div className="text-sm text-text-tertiary truncate max-w-xs">
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
                        getMarketplaceStatusBadgeColor(product.marketplace_status)
                      )}
                    >
                      {getMarketplaceStatusLabel(product.marketplace_status)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex px-2 py-1 text-xs font-medium rounded-full w-fit",
                        getProductStatusBadgeColor(product.status)
                      )}
                    >
                      {getProductStatusLabel(product.status)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-action">
                    CHF {Number(product.estimated_price_chf).toFixed(2)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={cn(
                      "font-medium",
                      product.quantity_available < 3 ? "text-error-600" : "text-text-primary"
                    )}
                  >
                    {product.quantity_available}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-text-secondary">
                    {product.location || '-'}
                    {product.box_id && (
                      <span className="text-text-muted"> / {product.box_id}</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Quick publish button for unpublished products */}
                    {product.marketplace_status !== MARKETPLACE_STATUS.PUBLISHED && (
                      <button
                        onClick={() => onPublish?.(product)}
                        className="p-1 text-primary-500 hover:text-primary-700"
                        title="Im Shop veröffentlichen"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    )}
                    <Link
                      href={ROUTES.admin.productFactsheet(product.id)}
                      className="p-1 text-primary-500 hover:text-primary-700"
                      title="Factsheet drucken"
                    >
                      <Printer className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => onView?.(product)}
                      className="p-1 text-text-tertiary hover:text-neutral-600"
                      title="Ansehen"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit?.(product)}
                      className="p-1 text-text-tertiary hover:text-neutral-600"
                      title="Bearbeiten"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete?.(product)}
                      className="p-1 text-error-400 hover:text-error-600"
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
          <Package className="w-12 h-12 text-text-muted mx-auto mb-4" />
          <Heading level={3} className="text-lg font-medium text-text-primary mb-2">
            Keine erfassten Produkte
          </Heading>
          <p className="text-text-secondary mb-4">
            Erfasse dein erstes Produkt, um zu beginnen.
          </p>
          <Link href={ROUTES.admin.erfassung} className={buttonClass({ variant: 'primary', size: 'sm' })}>
            <Plus className="w-4 h-4" />
            Produkt erfassen
          </Link>
        </div>
      )}
    </div>
  )
}
