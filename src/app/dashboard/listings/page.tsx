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
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/button'
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

export default function MyListingsPage() {
  const t = useTranslations('dashboard.listings')
  const { data: session, status: sessionStatus } = useSession()

  const STATUS_TABS: { value: string; label: string }[] = [
    { value: '', label: t('tabAll') },
    { value: LISTING_STATUS.ACTIVE, label: t('tabActive') },
    { value: LISTING_STATUS.SOLD, label: t('tabSold') },
    { value: LISTING_STATUS.DRAFT, label: t('tabDraft') },
    { value: LISTING_STATUS.RESERVED, label: t('tabReserved') },
  ]
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
      setError(result.error || t('loadError'))
    }
    setIsLoading(false)
  }, [statusFilter, t])

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
        setError(result.error || t('loadError'))
      }
      setIsLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [session, sessionStatus, router, statusFilter, t])

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return
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
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level={1} className="text-2xl font-bold text-neutral-900 dark:text-white">{t('pageTitle')}</Heading>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {t('pageSubtitle')}
          </p>
        </div>
        <Link
          href="/marketplace/sell"
          className="inline-flex items-center justify-center gap-2 rounded-md font-medium h-9 px-3 bg-primary-600 text-white hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('newListing')}
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleStatusFilterChange(tab.value)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          <span className="ml-3 text-neutral-600 dark:text-neutral-400">{t('loading')}</span>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-xl p-6 text-center">
          <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <p className="text-error-600 dark:text-error-300 mb-4">{error}</p>
          <Button onClick={() => fetchListings(page)} variant="destructive" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('retry')}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && listings.length === 0 && (
        <EmptyState
          icon={Package}
          iconBg="bg-violet-50 dark:bg-violet-900/20"
          iconColor="text-violet-500 dark:text-violet-400"
          title={statusFilter ? t('emptyFilteredTitle') : t('emptyTitle')}
          description={t('emptyDesc')}
          action={
            <Link
              href="/marketplace/sell"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('createFirst')}
            </Link>
          }
        />
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
                className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-4 flex items-center gap-4"
              >
                {/* Thumbnail */}
                <Link href={`/marketplace/${listing.id}`} className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                  <ListingImage src={listing.thumbnail} alt={listing.title} fallbackIconSize="w-6 h-6" />
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/marketplace/${listing.id}`} className="hover:text-primary-600 transition-colors">
                    <Heading level={3} className="font-medium text-neutral-900 dark:text-white truncate">{listing.title}</Heading>
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    <span className="font-semibold text-neutral-900 dark:text-white">
                      {formatCHF(Number(listing.price_chf))}
                    </span>
                    <span>{listing.category}</span>
                    <span className={`inline-flex px-1.5 py-0.5 text-xs rounded ${conditionInfo.color}`}>
                      {conditionInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
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
                    className="p-2 rounded-lg text-neutral-500 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                    title={t('actionEdit')}
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDuplicate(listing.id)}
                    disabled={duplicatingId === listing.id}
                    className="p-2 rounded-lg text-neutral-500 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                    title={t('actionDuplicate')}
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
                    className="p-2 rounded-lg text-neutral-500 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors disabled:opacity-50"
                    title={t('actionDelete')}
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
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('totalCount', { count: total })}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchListings(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('prevPage')}
            </button>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {t('paginationPage', { page, total: totalPages })}
            </span>
            <button
              onClick={() => fetchListings(page + 1)}
              disabled={page >= totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('nextPage')}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
