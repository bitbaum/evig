'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { useTranslations } from 'next-intl'
import {
  Search,
  Plus,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Heart,
  Users,
} from 'lucide-react'
import {
  IT_HILFE,
  DEVICE_CATEGORIES,
  URGENCY_LEVELS,
  SWISS_CANTONS,
  SORT_OPTIONS,
} from '@/config/it-hilfe'
import { RequestCard, RequestCardGrid } from '@/components/it-hilfe/RequestCard'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSkeleton } from '@/components/common/LoadingState'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import Heading from '@/components/ui/Heading'
import type { ITHilfeRequest } from '@/components/it-hilfe/detail/types'

export default function ITHilfePage() {
  const { data: session } = useSession()
  const t = useTranslations('itHelp.page')
  const [requests, setRequests] = useState<ITHilfeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Search and Sort
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')

  // Pagination
  const [limit] = useState(20)
  const [offset, setOffset] = useState(0)

  // Filters
  const [category, setCategory] = useState('')
  const [canton, setCanton] = useState('')
  const [urgency, setUrgency] = useState('')
  const [budgetType, setBudgetType] = useState('')

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()

      if (category) params.set('category', category)
      if (canton) params.set('canton', canton)
      if (urgency) params.set('urgency', urgency)
      if (budgetType) params.set('budgetType', budgetType)
      if (search) params.set('search', search)
      if (sort) params.set('sort', sort)
      params.set('limit', String(limit))
      params.set('offset', String(offset))

      const result = await apiFetch<{ requests: ITHilfeRequest[]; total: number }>(
        `/api/it-hilfe/requests?${params}`,
      )

      if (result.success && result.data) {
        setRequests(result.data.requests)
        setTotal(result.data.total)
      } else {
        logger.warn('Error fetching IT-Hilfe requests', { error: result.error })
        setError(result.error ?? t('retryButton'))
        setRequests([])
      }
    } finally {
      setLoading(false)
    }
  }, [category, canton, urgency, budgetType, search, sort, limit, offset, t])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setOffset(0)
  }

  const clearFilters = () => {
    setCategory('')
    setCanton('')
    setUrgency('')
    setBudgetType('')
    setSearch('')
    setSearchInput('')
    setSort('newest')
    setOffset(0)
  }

  const hasActiveFilters = category || canton || urgency || budgetType || search

  const totalPages = Math.ceil(total / limit)
  const currentPage = Math.floor(offset / limit) + 1

  const goToPage = (page: number) => {
    setOffset((page - 1) * limit)
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Compact hero — requests visible without scrolling */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <Heading level={1} className="text-2xl sm:text-3xl text-gray-900">{t('title')}</Heading>
              <p className="text-sm text-gray-600 mt-1">
                {t('requestCount', { count: total })} · {t('tagline')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={session?.user ? IT_HILFE.routes.create : `/auth/login?callbackUrl=${IT_HILFE.routes.create}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-base font-semibold transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {t('getHelp')}
              </Link>
              <Link
                href={IT_HILFE.routes.helpers}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-600 rounded-lg text-base font-semibold transition-colors"
              >
                <Users className="w-4 h-4" />
                {t('findTechnician')}
              </Link>
            </div>
          </div>
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchAriaLabel')}
                className="w-full pl-12 pr-24 py-3 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-md transition-colors text-sm font-semibold shadow-sm"
              >
                {t('searchButton')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Secondary actions for logged-in users */}
        {session?.user && (
          <div className="mb-6 flex flex-wrap gap-2">
            <Link
              href={session?.user ? IT_HILFE.routes.register : `/auth/login?callbackUrl=${IT_HILFE.routes.register}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm font-medium transition-colors"
            >
              <Wrench className="w-4 h-4" />
              {t('becomeTechnician')}
            </Link>
            <Link
              href={IT_HILFE.routes.my}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              {t('myRequests')}
            </Link>
            <Link
              href={IT_HILFE.routes.myOffers}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm font-medium transition-colors"
            >
              <Heart className="w-4 h-4" />
              {t('myOffers')}
            </Link>
          </div>
        )}

        {/* Filter Bar */}
        <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              aria-expanded={showFilters}
              aria-controls="filter-panel"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t('filterButton')}
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-500" aria-label={t('activeFiltersIndicator')} />
              )}
            </button>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setOffset(0)
              }}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              aria-label={t('sortLabel')}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <X className="w-4 h-4" />
                {t('resetFilters')}
              </button>
            )}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div id="filter-panel" className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="filter-category" className="block text-xs font-medium text-gray-700 mb-2">
                    {t('filterCategory')}
                  </label>
                  <select
                    id="filter-category"
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value)
                      setOffset(0)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">{t('filterCategoryAll')}</option>
                    {DEVICE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filter-canton" className="block text-xs font-medium text-gray-700 mb-2">
                    {t('filterCanton')}
                  </label>
                  <select
                    id="filter-canton"
                    value={canton}
                    onChange={(e) => {
                      setCanton(e.target.value)
                      setOffset(0)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">{t('filterCantonAll')}</option>
                    {SWISS_CANTONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filter-urgency" className="block text-xs font-medium text-gray-700 mb-2">
                    {t('filterUrgency')}
                  </label>
                  <select
                    id="filter-urgency"
                    value={urgency}
                    onChange={(e) => {
                      setUrgency(e.target.value)
                      setOffset(0)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">{t('filterUrgencyAll')}</option>
                    {URGENCY_LEVELS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="filter-budget" className="block text-xs font-medium text-gray-700 mb-2">
                    {t('filterBudget')}
                  </label>
                  <select
                    id="filter-budget"
                    value={budgetType}
                    onChange={(e) => {
                      setBudgetType(e.target.value)
                      setOffset(0)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">{t('filterBudgetAll')}</option>
                    <option value="free">{t('filterBudgetFree')}</option>
                    <option value="paid">{t('filterBudgetPaid')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <LoadingSkeleton count={limit} />
        )}

        {/* Error State */}
        {error && !loading && (
          <ErrorAlert
            message={error}
            variant="card"
            onRetry={() => {
              setError(null)
              fetchRequests()
            }}
            retryLabel={t('retryButton')}
          />
        )}

        {/* Empty State */}
        {!loading && !error && requests.length === 0 && (
          <EmptyState
            icon={Wrench}
            title={t('emptyTitle')}
            message={
              hasActiveFilters
                ? t('emptyMessageFiltered')
                : t('emptyMessageEmpty')
            }
            action={
              session?.user
                ? {
                    label: t('createRequestButton'),
                    href: IT_HILFE.routes.create,
                  }
                : undefined
            }
          />
        )}

        {/* Requests Grid */}
        {!loading && !error && requests.length > 0 && (
          <RequestCardGrid>
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </RequestCardGrid>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-2 pt-8" aria-label={t('pagination')}>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              aria-label={t('prevPage')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-600 px-4" aria-current="page">
              {t('pageOf', { current: currentPage, total: totalPages })}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              aria-label={t('nextPage')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        )}

        {/* CTA Section for Becoming a Technician */}
        {!session?.user && (
          <div className="mt-12 bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                <Wrench className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <Heading level={3} className="text-xl text-gray-900 mb-2">
              {t('ctaTitle')}
            </Heading>
            <p className="text-base text-gray-600 mb-6 max-w-md mx-auto">
              {t('ctaDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href={`/auth/login?callbackUrl=${IT_HILFE.routes.register}`}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                {t('ctaCreateProfile')}
              </Link>
              <Link
                href="/it-hilfe"
                className="px-6 py-2.5 bg-white hover:bg-emerald-50 text-emerald-600 border border-emerald-600 rounded-lg font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                {t('ctaMoreInfo')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
