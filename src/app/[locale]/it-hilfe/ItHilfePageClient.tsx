'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
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
import { IconBadge } from '@/components/ui/IconBadge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useITHilfeRequests } from '@/hooks/useITHilfeRequests'
import { ROUTES } from '@/config/routes'

export default function ITHilfePage() {
  const { data: session } = useSession()
  const t = useTranslations('itHelp.page')
  const [showFilters, setShowFilters] = useState(false)

  const {
    requests,
    loading,
    total,
    error,
    searchInput,
    setSearchInput,
    sort,
    setSort,
    filters,
    setFilter,
    handleSearch,
    clearFilters,
    hasActiveFilters,
    totalPages,
    currentPage,
    goToPage,
    retry,
    limit,
  } = useITHilfeRequests()

  return (
    <div className="bg-canvas min-h-screen">
      {/* Compact hero — requests visible without scrolling */}
      <div className="bg-surface-base border-b border-subtle dark:border-white/6 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <Heading level={1} className="text-2xl sm:text-3xl text-text-primary">{t('title')}</Heading>
              <p className="text-sm text-text-secondary mt-1">
                {t('requestCount', { count: total })} · {t('tagline')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button as={Link} href={session?.user ? IT_HILFE.routes.create : `/auth/login?callbackUrl=${IT_HILFE.routes.create}`} variant="primary">
                <Plus className="w-4 h-4" />
                {t('getHelp')}
              </Button>
              <Link
                href={IT_HILFE.routes.helpers}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-surface-base dark:bg-transparent hover:bg-action-muted text-action border border-action dark:border-action rounded-lg text-base font-semibold transition-colors"
              >
                <Users className="w-4 h-4" />
                {t('findTechnician')}
              </Link>
            </div>
          </div>
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchAriaLabel')}
                className="pl-12 pr-24 py-3"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {t('searchButton')}
              </Button>
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface-base dark:bg-transparent hover:bg-action-muted text-action border border-strong dark:border-action/40 rounded-lg text-sm font-medium transition-colors"
            >
              <Wrench className="w-4 h-4" />
              {t('becomeTechnician')}
            </Link>
            <Link
              href={IT_HILFE.routes.my}
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface-base hover:bg-surface-raised text-text-secondary border rounded-lg text-sm font-medium transition-colors"
            >
              {t('myRequests')}
            </Link>
            <Link
              href={IT_HILFE.routes.myOffers}
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface-base hover:bg-surface-raised text-text-secondary border rounded-lg text-sm font-medium transition-colors"
            >
              <Heart className="w-4 h-4" />
              {t('myOffers')}
            </Link>
          </div>
        )}

        {/* Filter Bar */}
        <div className="mb-6 card-shell rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-default text-sm font-medium text-text-secondary hover:bg-surface-raised transition-colors"
              aria-expanded={showFilters}
              aria-controls="filter-panel"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t('filterButton')}
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-action" aria-label={t('activeFiltersIndicator')} />
              )}
            </button>

            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-auto"
              aria-label={t('sortLabel')}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-action hover:text-action font-medium"
              >
                <X className="w-4 h-4" />
                {t('resetFilters')}
              </button>
            )}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div id="filter-panel" className="mt-4 pt-4 border-t border">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="filter-category" className="block text-xs font-medium text-text-secondary mb-2">
                    {t('filterCategory')}
                  </label>
                  <Select
                    id="filter-category"
                    value={filters.category}
                    onChange={(e) => setFilter('category', e.target.value)}
                  >
                    <option value="">{t('filterCategoryAll')}</option>
                    {DEVICE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label htmlFor="filter-canton" className="block text-xs font-medium text-text-secondary mb-2">
                    {t('filterCanton')}
                  </label>
                  <Select
                    id="filter-canton"
                    value={filters.canton}
                    onChange={(e) => setFilter('canton', e.target.value)}
                  >
                    <option value="">{t('filterCantonAll')}</option>
                    {SWISS_CANTONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label htmlFor="filter-urgency" className="block text-xs font-medium text-text-secondary mb-2">
                    {t('filterUrgency')}
                  </label>
                  <Select
                    id="filter-urgency"
                    value={filters.urgency}
                    onChange={(e) => setFilter('urgency', e.target.value)}
                  >
                    <option value="">{t('filterUrgencyAll')}</option>
                    {URGENCY_LEVELS.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label htmlFor="filter-budget" className="block text-xs font-medium text-text-secondary mb-2">
                    {t('filterBudget')}
                  </label>
                  <Select
                    id="filter-budget"
                    value={filters.budgetType}
                    onChange={(e) => setFilter('budgetType', e.target.value)}
                  >
                    <option value="">{t('filterBudgetAll')}</option>
                    <option value="free">{t('filterBudgetFree')}</option>
                    <option value="paid">{t('filterBudgetPaid')}</option>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && <LoadingSkeleton count={limit} />}

        {/* Error State */}
        {error && !loading && (
          <ErrorAlert
            message={error}
            variant="card"
            onRetry={() => retry()}
            retryLabel={t('retryButton')}
          />
        )}

        {/* Empty State */}
        {!loading && !error && requests.length === 0 && (
          <EmptyState
            icon={Wrench}
            title={t('emptyTitle')}
            message={hasActiveFilters ? t('emptyMessageFiltered') : t('emptyMessageEmpty')}
            action={
              session?.user
                ? { label: t('createRequestButton'), href: IT_HILFE.routes.create }
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
              className="p-2 rounded-lg border border-default disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-raised transition-colors"
              aria-label={t('prevPage')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-text-secondary px-4" aria-current="page">
              {t('pageOf', { current: currentPage, total: totalPages })}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-default disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-raised transition-colors"
              aria-label={t('nextPage')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        )}

        {/* CTA Section for Becoming a Technician */}
        {!session?.user && (
          <div className="mt-12 card-shell rounded-2xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <IconBadge icon={Wrench} theme="itHilfe" size="lg" />
            </div>
            <Heading level={3} className="text-xl text-text-primary mb-2">
              {t('ctaTitle')}
            </Heading>
            <p className="text-base text-text-secondary mb-6 max-w-md mx-auto">
              {t('ctaDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button as={Link} href={`/auth/login?callbackUrl=${IT_HILFE.routes.register}`} variant="primary">
                {t('ctaCreateProfile')}
              </Button>
              <Link
                href={ROUTES.public.itHilfe}
                className="px-6 py-2.5 bg-surface-base dark:bg-transparent hover:bg-action-muted text-action border border-action dark:border-action rounded-lg font-semibold transition-colors focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
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
