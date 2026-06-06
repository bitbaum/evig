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
      {/* ── Header — fleetcrown discipline ─────────────────────────── */}
      <section className="border-b border-subtle py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="ui-public-eyebrow">IT-HILFE</div>
              <h1 className="ui-public-display-md mt-3">{t('title')}</h1>
              <p className="ui-public-meta mt-3 font-mono tabular-nums">
                {t('requestCount', { count: total })} · {t('tagline')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-self-end">
              <Link
                href={session?.user ? IT_HILFE.routes.create : `/auth/login?callbackUrl=${IT_HILFE.routes.create}`}
                className="ui-public-cta inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('getHelp')}
              </Link>
              <Link
                href={IT_HILFE.routes.helpers}
                className="ui-public-cta-ghost inline-flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                {t('findTechnician')}
              </Link>
            </div>
          </div>

          <form onSubmit={handleSearch} className="mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchAriaLabel')}
                className="pl-10 pr-28 text-sm"
              />
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="absolute right-1.5 top-1/2 -translate-y-1/2"
              >
                {t('searchButton')}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Secondary actions for logged-in users */}
        {session?.user && (
          <div className="mb-6 flex flex-wrap gap-3">
            <Link
              href={session?.user ? IT_HILFE.routes.register : `/auth/login?callbackUrl=${IT_HILFE.routes.register}`}
              className="ui-public-cta-ghost inline-flex items-center gap-2"
            >
              <Wrench className="w-4 h-4" />
              {t('becomeTechnician')}
            </Link>
            <Link
              href={IT_HILFE.routes.my}
              className="ui-public-cta-ghost inline-flex items-center gap-2"
            >
              {t('myRequests')}
            </Link>
            <Link
              href={IT_HILFE.routes.myOffers}
              className="ui-public-cta-ghost inline-flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              {t('myOffers')}
            </Link>
          </div>
        )}

        {/* Filter Bar */}
        <div className="mb-6 card-shell rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
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
            </Button>

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
              <Button
                variant="ghost"
                onClick={clearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 text-sm text-action hover:text-action font-medium"
              >
                <X className="w-4 h-4" />
                {t('resetFilters')}
              </Button>
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
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-default disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-raised transition-colors"
              aria-label={t('prevPage')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-text-secondary px-4" aria-current="page">
              {t('pageOf', { current: currentPage, total: totalPages })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-default disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-raised transition-colors"
              aria-label={t('nextPage')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
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
