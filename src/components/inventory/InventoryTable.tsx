'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Package,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Zap
} from 'lucide-react'
import { logger } from '@/lib/logger'

interface InventoryItem {
  id: string
  kivitendo_article_number: string
  quantity_available: number
  selling_price_chf: number
  condition_override: string
  medusa_product_id: string | null
  marketplace_status: string
  created_at: string
  ai_extracted_products: {
    id: string
    product_name: string
    brand: string | null
    category: string | null
    condition: string
    product_images: Array<{
      id: string
      filename: string
      file_path: string
    }>
    sustainability_scores: Array<{
      overall_score: number
      environmental_score: number
      social_score: number
      economic_score: number
    }>
  } | null
}

interface InventoryTableProps {
  items: InventoryItem[]
  onPublishSuccess?: (itemId: string) => void
}

export function InventoryTable({ items, onPublishSuccess }: InventoryTableProps) {
  const [publishingItems, setPublishingItems] = useState<Set<string>>(new Set())

  const handlePublish = async (itemId: string) => {
    setPublishingItems(prev => new Set(prev).add(itemId))

    try {
      const response = await fetch('/api/inventory/publish-medusa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inventoryItemId: itemId }),
      })

      const result = await response.json()

      if (result.success) {
        onPublishSuccess?.(itemId)
        // Could show success toast here
      } else {
        logger.error('Publish failed', { errors: result.errors, itemId })
        // Could show error toast here
      }
    } catch (error) {
      logger.error('Publish error', { error, itemId })
      // Could show error toast here
    } finally {
      setPublishingItems(prev => {
        const newSet = new Set(prev)
        newSet.delete(itemId)
        return newSet
      })
    }
  }

  const getConditionLabel = (condition: string) => {
    switch (condition) {
      case 'new': return { label: 'Neu', color: 'bg-green-100 text-green-800' }
      case 'like_new': return { label: 'Wie neu', color: 'bg-blue-100 text-blue-800' }
      case 'good': return { label: 'Gut', color: 'bg-yellow-100 text-yellow-800' }
      case 'fair': return { label: 'Akzeptabel', color: 'bg-orange-100 text-orange-800' }
      default: return { label: 'Unbekannt', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'draft': return <Clock className="w-4 h-4 text-yellow-600" />
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Produkt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Artikel Nr.
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Zustand
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Preis
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Nachhaltigkeit
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => {
              const aiProduct = item.ai_extracted_products;
              const conditionInfo = getConditionLabel(item.condition_override || aiProduct?.condition || 'unknown');
              const sustainabilityScore = aiProduct?.sustainability_scores?.[0];
              const isPublishing = publishingItems.has(item.id);

              return (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {aiProduct?.product_images?.[0] && (
                        <img
                          className="w-12 h-12 rounded-lg object-cover mr-4 flex-shrink-0"
                          src={aiProduct.product_images[0].file_path}
                          alt={aiProduct.product_name}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {aiProduct?.product_name || 'Unbenanntes Produkt'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {aiProduct?.brand && `${aiProduct.brand} • `}
                          {aiProduct?.category}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item.kivitendo_article_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${conditionInfo.color}`}>
                      {conditionInfo.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    CHF {item.selling_price_chf}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(item.marketplace_status)}
                      <span className="text-sm text-gray-900 dark:text-white capitalize">
                        {item.marketplace_status === 'published' ? 'Veröffentlicht' :
                         item.marketplace_status === 'draft' ? 'Entwurf' : item.marketplace_status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {sustainabilityScore ? (
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <span className="text-xs font-bold text-green-600">
                            {sustainabilityScore.overall_score}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      {item.marketplace_status === 'published' && item.medusa_product_id && (
                        <Link
                          href={`/shop/products/${item.medusa_product_id}`}
                          className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                          title="Im Shop ansehen"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}

                      {item.marketplace_status === 'draft' && (
                        <button
                          onClick={() => handlePublish(item.id)}
                          disabled={isPublishing}
                          className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-50"
                          title="Zu MedusaJS veröffentlichen"
                        >
                          {isPublishing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Zap className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <button
                        className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        title="Löschen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}



