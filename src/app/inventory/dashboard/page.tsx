'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { InventoryTable } from '@/components/inventory/InventoryTable'
import {
  Package,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Image as ImageIcon,
  BarChart3,
  TrendingUp,
  Loader2
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

export default function InventoryDashboardPage() {
  const { data: session, status } = useSession()
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [bulkPublishing, setBulkPublishing] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login')
    }
  }, [status])

  useEffect(() => {
    if (session?.user) {
      fetchInventoryItems()
    }
  }, [session])

  const fetchInventoryItems = async () => {
    try {
      // Mock data for now - replace with real API call
      const mockItems: InventoryItem[] = [
        {
          id: 'inv_1',
          kivitendo_article_number: 'ART-001',
          quantity_available: 1,
          selling_price_chf: 899,
          condition_override: 'like_new',
          medusa_product_id: null,
          marketplace_status: 'draft',
          created_at: '2024-12-15T10:00:00Z',
          ai_extracted_products: {
            id: 'ai_1',
            product_name: 'MacBook Air M1 13"',
            brand: 'Apple',
            category: 'Laptops',
            condition: 'like_new',
            product_images: [
              { id: 'img_1', filename: 'macbook.jpg', file_path: '/uploads/macbook.jpg' }
            ],
            sustainability_scores: [{
              overall_score: 85,
              environmental_score: 82,
              social_score: 88,
              economic_score: 85
            }]
          }
        },
        {
          id: 'inv_2',
          kivitendo_article_number: 'ART-002',
          quantity_available: 1,
          selling_price_chf: 1299,
          condition_override: null,
          medusa_product_id: 'med_123',
          marketplace_status: 'published',
          created_at: '2024-12-14T14:30:00Z',
          ai_extracted_products: {
            id: 'ai_2',
            product_name: 'Gaming Desktop RTX 4070',
            brand: 'Custom Build',
            category: 'Desktop PCs',
            condition: 'new',
            product_images: [
              { id: 'img_2', filename: 'gaming-pc.jpg', file_path: '/uploads/gaming-pc.jpg' }
            ],
            sustainability_scores: [{
              overall_score: 78,
              environmental_score: 75,
              social_score: 80,
              economic_score: 79
            }]
          }
        }
      ]
      setInventoryItems(mockItems)
    } catch (error) {
      logger.error('Error fetching inventory', { error })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePublishSuccess = (itemId: string) => {
    setInventoryItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, marketplace_status: 'published', medusa_product_id: `med_${Date.now()}` }
        : item
    ))
  }

  const handleBulkPublish = async () => {
    const draftItems = inventoryItems.filter(item => item.marketplace_status === 'draft')
    if (draftItems.length === 0) return

    setBulkPublishing(true)
    try {
      // Publish all draft items in parallel
      const publishPromises = draftItems.map(item =>
        fetch('/api/inventory/publish-medusa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inventoryItemId: item.id }),
        }).then(res => res.json())
      )

      const results = await Promise.allSettled(publishPromises)

      // Update items that were successfully published
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          const itemId = draftItems[index].id
          handlePublishSuccess(itemId)
        }
      })
    } catch (error) {
      logger.error('Bulk publish error', { error })
    } finally {
      setBulkPublishing(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!session?.user) {
    return null // Will redirect
  }


  const stats = {
    totalItems: inventoryItems.length,
    publishedItems: inventoryItems.filter(item => item.marketplace_status === 'published').length,
    draftItems: inventoryItems.filter(item => item.marketplace_status === 'draft').length,
    totalValue: inventoryItems.reduce((sum, item) => sum + (item.selling_price_chf * item.quantity_available), 0),
    averageScore: inventoryItems.length > 0 ? inventoryItems.reduce((sum, item) => {
      const score = item.ai_extracted_products?.sustainability_scores?.[0]?.overall_score || 0;
      return sum + score;
    }, 0) / inventoryItems.length : 0
  }


  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inventory Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your AI-powered inventory and sync with the marketplace
          </p>
        </div>
        <Link
          href="/inventory/ai-capture"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Upload className="w-5 h-5" />
          Neues Produkt
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt Produkte</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalItems}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Veröffentlicht</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.publishedItems}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entwürfe</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.draftItems}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamtwert</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                CHF {stats.totalValue.toLocaleString('de-CH')}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ø Nachhaltigkeit</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(stats.averageScore)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <InventoryTable
        items={inventoryItems}
        onPublishSuccess={handlePublishSuccess}
      />

      {/* Publish CTA for Draft Items */}
      {stats.draftItems > 0 && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white text-center">
          <Zap className="w-16 h-16 text-blue-200 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">
            {stats.draftItems} Produkt{stats.draftItems > 1 ? 'e' : ''} bereit zum Veröffentlichen
          </h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Ihre AI-analyzierten Produkte warten darauf, im RevampIT Marketplace veröffentlicht zu werden.
            Mit einem Klick werden sie automatisch in den Shop übertragen.
          </p>
          <button
            onClick={handleBulkPublish}
            disabled={bulkPublishing}
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bulkPublishing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Package className="w-5 h-5" />
            )}
            {bulkPublishing ? 'Wird veröffentlicht...' : 'Alle veröffentlichen'}
          </button>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-200">
              So funktioniert die AI-Inventur
            </h3>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Laden Sie Produktbilder hoch - unsere KI analysiert automatisch Marke, Modell und Zustand</li>
              <li>• Die KI berechnet Nachhaltigkeits-Scores basierend auf Umwelt- und Sozialfaktoren</li>
              <li>• Mit einem Klick werden Produkte in den MedusaJS-Shop übertragen</li>
              <li>• Kunden können Produkte sofort im Marketplace finden und kaufen</li>
              <li>• Vollständige Synchronisation zwischen Ihrem Lager und dem Online-Shop</li>
            </ul>
            <Link
              href="/inventory/ai-capture"
              className="inline-flex items-center gap-1 mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Jetzt Produkt hinzufügen
              <Package className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}



