'use client'

import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Wrench,
} from 'lucide-react'
import { SERVICE_CATEGORIES, IT_SKILLS } from '@/config/it-hilfe'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSkeleton } from '@/components/common/LoadingState'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { ITSkill } from '@/config/it-hilfe'
import { useTranslations } from 'next-intl'
import { useTechnicianList } from '@/hooks/useTechnicianList'
import { ROUTES } from '@/config/routes'
import { TechnicianCard } from './TechnicianCard'

export default function TechnikerListClient() {
  const t = useTranslations('techniker')
  const tEye = useTranslations('common.eyebrows')
  const { data: session } = useSession()

  const {
    technicians,
    pagination,
    loading,
    error,
    tier,
    searchInput,
    setSearchInput,
    selectedSkill,
    limit,
    totalPages,
    currentPage,
    hasActiveFilters,
    handleSearch,
    setTierFilter,
    setSkillFilter,
    clearFilters,
    goToPage,
    retry,
  } = useTechnicianList(t('list.loadingError'))

  const tierTabs = [
    { value: '',                                        label: t('list.tierAll') },
    { value: REPAIRER_PROFILE_TIER.COMMUNITY,           label: t('list.tierCommunity') },
    { value: REPAIRER_PROFILE_TIER.PROFESSIONAL,        label: t('list.tierProfessional') },
  ]

  return (
    <div className="bg-canvas min-h-screen">
      {/* ── Header — fleetcrown discipline ─────────────────────────── */}
      <section className="border-b border-subtle py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="ui-public-eyebrow">{tEye('technicians')}</div>
              <h1 className="ui-public-display-md mt-3">{t('list.title')}</h1>
              <p className="ui-public-meta mt-3 font-mono tabular-nums">
                {t('list.available', { count: pagination.total })}
              </p>
            </div>
            <Link
              href={session?.user ? '/profil/techniker' : '/auth/login?callbackUrl=/profil/techniker'}
              className="ui-public-cta inline-flex items-center gap-2 md:justify-self-end"
            >
              <Wrench className="w-4 h-4" />
              {t('list.becomeTechnician')}
            </Link>
          </div>

          <form onSubmit={handleSearch} className="mt-8 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('list.searchPlaceholder')}
                aria-label={t('list.searchAriaLabel')}
                className="pl-10 pr-28 text-sm"
              />
              <Button type="submit" variant="primary" size="sm" className="absolute right-1.5 top-1/2 -translate-y-1/2">
                {t('list.searchButton')}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* ── Main content ───────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Tier filter — text-only tab pills (no bg-action white) */}
        <div className="mb-5 flex flex-wrap gap-2 font-mono text-xs uppercase tracking-[0.14em]" role="group" aria-label={t('list.tierFilterLabel')}>
          {tierTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setTierFilter(tab.value)}
              className={`px-3 py-1.5 rounded-md border transition-colors ${
                tier === tab.value
                  ? 'border-strong bg-text-primary text-canvas'
                  : 'border text-text-secondary hover:border-strong'
              }`}
              aria-pressed={tier === tab.value}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Skills filter */}
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <Select
            value={selectedSkill}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="w-auto"
            aria-label={t('list.skillsFilterLabel')}
          >
            <option value="">{t('list.skillsFilterAll')}</option>
            {SERVICE_CATEGORIES.map((cat) => (
              <optgroup key={cat.id} label={cat.name}>
                {(IT_SKILLS[cat.id] || []).map((skill: ITSkill) => (
                  <option key={skill.id} value={skill.id}>{skill.name}</option>
                ))}
              </optgroup>
            ))}
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              {t('list.resetFilters')}
            </Button>
          )}
        </div>

        {loading && <LoadingSkeleton count={limit} />}

        {error && !loading && (
          <ErrorAlert message={error} variant="card" onRetry={retry} retryLabel={t('list.retryButton')} />
        )}

        {!loading && !error && technicians.length === 0 && (
          <EmptyState
            icon={Users}
            title={t('list.emptyTitle')}
            message={hasActiveFilters ? t('list.emptyMessageFiltered') : t('list.emptyMessageEmpty')}
            action={
              hasActiveFilters
                ? { label: t('list.emptyActionFiltered'), onClick: clearFilters }
                : { label: t('list.emptyActionEmpty'), href: '/profil/techniker' }
            }
          />
        )}

        {!loading && !error && technicians.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicians.map((tech) => (
              <TechnicianCard key={tech.id} technician={tech} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-2 pt-10" aria-label={t('list.pagination')}>
            <Button variant="outline" size="icon" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1} aria-label={t('list.prevPage')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="ui-public-meta font-mono tabular-nums px-4" aria-current="page">
              {t('list.pageOf', { current: currentPage, total: totalPages })}
            </span>
            <Button variant="outline" size="icon" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages} aria-label={t('list.nextPage')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </nav>
        )}

        {/* CTA for non-logged-in */}
        {!session?.user && (
          <section className="mt-16 border-t border-subtle pt-16 text-center">
            <div className="ui-public-eyebrow">{tEye('getInvolved')}</div>
            <h2 className="ui-public-display-md mt-3">{t('list.ctaTitle')}</h2>
            <p className="ui-public-section-lede mt-4 mx-auto">{t('list.ctaDescription')}</p>
            <div className="ui-public-cta-row mt-8">
              <Link href="/auth/login?callbackUrl=/profil/techniker" className="ui-public-cta">
                {t('list.ctaCreateProfile')}
              </Link>
              <Link href={ROUTES.public.itHilfe} className="ui-public-cta-ghost">
                {t('list.ctaToITHelp')}
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
