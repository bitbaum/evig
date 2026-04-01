'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Package,
  Plus,
  Eye,
  Heart,
  Loader2,
  AlertCircle,
  RefreshCw,
  Pencil,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { ListingImage } from '@/components/marketplace/ListingImage'
import { LISTING_STATUS_CONFIG, LISTING_STATUS, formatCHF } from '@/config/marketplace'
import type { ListingStatus } from '@/config/marketplace'
import { getConditionBadge } from '@/config/erfassung/conditions'

interface MyListing {
  id: string
  title: string
  price_chf: number
  category: string
  condition: string
  status: string
  view_count: number
  favorite_count: number
  created_at: string
  thumbnail: string | null
}

const STATUS_TABS: { value: string; label: string }[] = [
  { value: '', label: 'Alle' },
  { value: LISTING_STATUS.ACTIVE, label: 'Aktiv' },
  { value: LISTING_STATUS.SOLD, label: 'Verkauft' },
  { value: LISTING_STATUS.DRAFT, label: 'Entwurf' },
  { value: LISTING_STATUS.RESERVED, label: 'Reserviert' },
]

export default function MyListingsPage() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState<MyListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchListings = useCallback(async (fetchPage = 1) => {
    setIsLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    params.set('page', String(fetchPage))

    const result = await apiFetch<{ items: MyListing[]; page: number; totalPages: number; total: number }>(`/api/listings/mine?${params.toString()}`)

    if (result.success && result.data) {
      setListings(result.data.items)
      setPage(result.data.page)
      setTotalPages(result.data.totalPages)
      setTotal(result.data.total)
    } else {
      setError(result.error || 'Fehler beim Laden')
    }
    setIsLoading(false)
  }, [statusFilter])

  useEffect(() => {
    if (sessionStatus === 'loading') return
    if (!session?.user) {
      router.push('/auth/login')
      return
    }
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      params.set('page', '1')
      const result = await apiFetch<{ items: MyListing[]; page: number; totalPages: number; total: number }>(`/api/listings/mine?${params.toString()}`)
      if (cancelled) return
      if (result.success && result.data) {
        setListings(result.data.items)
        setPage(result.data.page)
        setTotalPages(result.data.totalPages)
        setTotal(result.data.total)
      } else {
        setError(result.error || 'Fehler beim Laden')
      }
      setIsLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [session, sessionStatus, router, statusFilter])

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie dieses Inserat wirklich löschen?')) return
    setDeletingId(id)
    const result = await apiFetch<void>(`/api/listings/${id}`, { method: 'DELETE' })
    if (result.success) {
      setListings(prev => prev.filter(l => l.id !== id))
      setTotal(prev => prev - 1)
    }
    setDeletingId(null)
  }

  const handleDuplicate = async (id: string) => {
    setDuplicatingId(id)
    const result = await apiFetch<{ id: string }>(`/api/listings/${id}/duplicate`, { method: 'POST' })
    if (result.success && result.data?.id) {
      router.push(`/marketplace/sell?edit=${result.data.id}`)
    }
    setDuplicatingId(null)
  }

  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meine Inserate</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Verwalten Sie Ihre Inserate im Marketplace
          </p>
        </div>
        <Link
          href="/marketplace/sell"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Neues Inserat
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleStatusFilterChange(tab.value)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Inserate werden geladen...</span>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={() => fetchListings(page)}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            <RefreshCw className="w-4 h-4" />
            Erneut versuchen
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && listings.length === 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {statusFilter ? 'Keine Inserate in dieser Kategorie' : 'Noch keine Inserate'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Erstellen Sie Ihr erstes Inserat und verkaufen Sie direkt an die Community.
          </p>
          <Link
            href="/marketplace/sell"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Erstes Inserat erstellen
          </Link>
        </div>
      )}

      {/* Listings List */}
      {!isLoading && !error && listings.length > 0 && (
        <div className="space-y-3">
          {listings.map((listing) => {
            const statusConfig = LISTING_STATUS_CONFIG[listing.status as ListingStatus]
            const conditionInfo = getConditionBadge(listing.condition)
            return (
              <div
                key={listing.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-4"
              >
                {/* Thumbnail */}
                <Link href={`/marketplace/${listing.id}`} className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                  <ListingImage src={listing.thumbnail} alt={listing.title} fallbackIconSize="w-6 h-6" />
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/marketplace/${listing.id}`} className="hover:text-green-600 transition-colors">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">{listing.title}</h3>
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCHF(Number(listing.price_chf))}
                    </span>
                    <span>{listing.category}</span>
                    <span className={`inline-flex px-1.5 py-0.5 text-xs rounded ${conditionInfo.color}`}>
                      {conditionInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {listing.view_count}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {listing.favorite_count}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                {statusConfig && (
                  <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    href={`/marketplace/sell?edit=${listing.id}`}
                    className="p-2 rounded-lg text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Bearbeiten"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDuplicate(listing.id)}
                    disabled={duplicatingId === listing.id}
                    className="p-2 rounded-lg text-gray-500 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    title="Duplizieren"
                  >
                    {duplicatingId === listing.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    disabled={deletingId === listing.id}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    title="Löschen"
                  >
                    {deletingId === listing.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {total} Inserat{total !== 1 ? 'e' : ''} insgesamt
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchListings(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Zurück
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Seite {page} von {totalPages}
            </span>
            <button
              onClick={() => fetchListings(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Weiter
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
