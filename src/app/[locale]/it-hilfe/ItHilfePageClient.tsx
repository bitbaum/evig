'use client'

import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Heart,
  Users,
} from 'lucide-react'
import { IT_HILFE } from '@/config/it-hilfe'
import { RequestCard, RequestCardGrid } from '@/components/it-hilfe/RequestCard'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSkeleton } from '@/components/common/LoadingState'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { Input } from '@/components/ui/input'
import { useITHilfeRequests } from '@/hooks/useITHilfeRequests'
import { ROUTES } from '@/config/routes'
import { ItHilfeFilters } from './ItHilfeFilters'

export default function ITHilfePage() {
  const { data: session } = useSession()
  const t = useTranslations('itHelp.page')

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
      {/* ── Header ─────────────────────────────────────────────────── */}
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

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Secondary actions for logged-in users */}
        {session?.user && (
          <div className="mb-6 flex flex-wrap gap-3">
            <Link href={IT_HILFE.routes.register} className="ui-public-cta-ghost inline-flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              {t('becomeTechnician')}
            </Link>
            <Link href={IT_HILFE.routes.my} className="ui-public-cta-ghost inline-flex items-center gap-2">
              {t('myRequests')}
            </Link>
            <Link href={IT_HILFE.routes.myOffers} className="ui-public-cta-ghost inline-flex items-center gap-2">
              <Heart className="w-4 h-4" />
              {t('myOffers')}
            </Link>
          </div>
        )}

        <ItHilfeFilters
          sort={sort}
          setSort={setSort}
          filters={filters}
          setFilter={setFilter}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
        />

        {loading && <LoadingSkeleton count={limit} />}

        {error && !loading && (
          <ErrorAlert
            message={error}
            variant="card"
            onRetry={() => retry()}
            retryLabel={t('retryButton')}
          />
        )}

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

        {!loading && !error && requests.length > 0 && (
          <RequestCardGrid>
            {requests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </RequestCardGrid>
        )}

        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-2 pt-10" aria-label={t('pagination')}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              aria-label={t('prevPage')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="ui-public-meta font-mono tabular-nums px-4" aria-current="page">
              {t('pageOf', { current: currentPage, total: totalPages })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label={t('nextPage')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </nav>
        )}

        {/* CTA — become technician */}
        {!session?.user && (
          <section className="mt-16 border-t border-subtle pt-16 text-center">
            <div className="ui-public-eyebrow">MITMACHEN</div>
            <h2 className="ui-public-display-md mt-3">{t('ctaTitle')}</h2>
            <p className="ui-public-section-lede mt-4 mx-auto">{t('ctaDescription')}</p>
            <div className="ui-public-cta-row mt-8">
              <Link
                href={`/auth/login?callbackUrl=${IT_HILFE.routes.register}`}
                className="ui-public-cta"
              >
                {t('ctaCreateProfile')}
              </Link>
              <Link href={ROUTES.public.itHilfe} className="ui-public-cta-ghost">
                {t('ctaMoreInfo')}
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
