'use client'

import { useSession } from 'next-auth/react'
import { Link } from '@/i18n/navigation'
import {
  Search,
  Users,
  ChevronLeft,
  ChevronRight,
  Wrench,
  Star,
  MapPin,
  Euro,
  Sparkles,
} from 'lucide-react'
import { SERVICE_CATEGORIES, IT_SKILLS, getSkillById, BUDGET_TIERS } from '@/config/it-hilfe'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'
import { EmptyState } from '@/components/common/EmptyState'
import { LoadingSkeleton } from '@/components/common/LoadingState'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import Heading from '@/components/ui/Heading'
import { IconBadge } from '@/components/ui/IconBadge'
import type { ITSkill } from '@/config/it-hilfe'
import { useTranslations } from 'next-intl'
import { formatCentsToChf } from '@/lib/pricing'
import { useTechnicianList, type Technician } from '@/hooks/useTechnicianList'
import { ROUTES } from '@/config/routes'

function TechnicianCard({ technician }: { technician: Technician }) {
  const t = useTranslations('techniker')
  const displayedSkills = technician.skills.slice(0, 4)
  const remaining = technician.skills.length - 4

  return (
    <Link
      href={ROUTES.public.technicianProfile(technician.id)}
      className="block bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-white/[0.06] p-5 hover:border-neutral-300 dark:hover:border-white/[0.12] hover:shadow-sm transition-all"
    >
      {/* Name + tier badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <Heading level={3} className="text-base font-semibold text-neutral-900 line-clamp-1">
          {technician.name}
        </Heading>
        <span
          className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            technician.profileTier === REPAIRER_PROFILE_TIER.PROFESSIONAL
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
              : 'bg-neutral-100 text-neutral-700'
          }`}
        >
          {technician.profileTier === REPAIRER_PROFILE_TIER.PROFESSIONAL ? t('list.professional') : t('list.community')}
        </span>
      </div>

      {/* Bio */}
      {technician.bio && (
        <p className="text-sm text-neutral-600 line-clamp-2 mb-3">{technician.bio}</p>
      )}

      {/* Rating + jobs */}
      {(technician.averageRating || technician.totalJobsCompleted > 0) && (
        <div className="flex items-center gap-3 text-sm text-neutral-600 mb-3">
          {technician.averageRating && (
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-warning-400 text-warning-400" />
              {technician.averageRating.toFixed(1)}
            </span>
          )}
          {technician.totalJobsCompleted > 0 && (
            <span>{t('list.jobs', { count: technician.totalJobsCompleted })}</span>
          )}
          {technician.isVerified && (
            <span className="text-primary-600 font-medium">✓ {t('list.verified')}</span>
          )}
        </div>
      )}

      {/* Location */}
      {technician.city && (
        <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span>{technician.city}</span>
        </div>
      )}

      {/* Skills */}
      {displayedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {displayedSkills.map((skillId) => {
            const skill = getSkillById(skillId)
            if (!skill) return null
            return (
              <span
                key={skillId}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700"
              >
                {skill.name}
              </span>
            )
          })}
          {remaining > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500">
              +{remaining}
            </span>
          )}
        </div>
      )}

      {/* Pricing badges */}
      <div className="flex flex-wrap gap-1.5">
        {technician.acceptsGratis && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${BUDGET_TIERS[0].badgeClass}`}>
            <Users className="w-3 h-3" />
            {t('list.gratis')}
          </span>
        )}
        {technician.acceptsKulturlegi && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${BUDGET_TIERS[1].badgeClass}`}>
            <Sparkles className="w-3 h-3" />
            {t('list.kulturlegi')}
          </span>
        )}
        {technician.hourlyRateCents && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400">
            <Euro className="w-3 h-3" />
            {formatCentsToChf(technician.hourlyRateCents)}/h
          </span>
        )}
      </div>
    </Link>
  )
}

export default function TechnikerListClient() {
  const t = useTranslations('techniker')
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
    { value: '', label: t('list.tierAll') },
    { value: REPAIRER_PROFILE_TIER.COMMUNITY, label: t('list.tierCommunity') },
    { value: REPAIRER_PROFILE_TIER.PROFESSIONAL, label: t('list.tierProfessional') },
  ]

  return (
    <div className="bg-canvas min-h-screen">
      {/* Compact header */}
      <div className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-white/[0.06] py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <Heading level={1} className="text-2xl sm:text-3xl font-bold text-neutral-900">
                {t('list.title')}
              </Heading>
              <p className="text-sm text-neutral-600 mt-1">
                {t('list.available', { count: pagination.total })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={session?.user ? '/profil/techniker' : '/auth/login?callbackUrl=/profil/techniker'}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-base font-semibold transition-colors shadow-sm"
              >
                <Wrench className="w-4 h-4" />
                {t('list.becomeTechnician')}
              </Link>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('list.searchPlaceholder')}
                aria-label={t('list.searchAriaLabel')}
                className="w-full pl-12 pr-24 py-3 rounded-lg border border-neutral-300 text-neutral-900 placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 hover:bg-primary-500 text-white px-5 py-2 rounded-md transition-colors text-sm font-semibold shadow-sm"
              >
                {t('list.searchButton')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Tier filter tabs */}
        <div className="mb-5 flex gap-2" role="group" aria-label={t('list.tierFilterLabel')}>
          {tierTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTierFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tier === tab.value
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
              aria-pressed={tier === tab.value}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Skills filter */}
        <div className="mb-6">
          <select
            value={selectedSkill}
            onChange={(e) => setSkillFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-neutral-300 bg-white text-sm text-neutral-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            aria-label={t('list.skillsFilterLabel')}
          >
            <option value="">{t('list.skillsFilterAll')}</option>
            {SERVICE_CATEGORIES.map((cat) => (
              <optgroup key={cat.id} label={cat.name}>
                {(IT_SKILLS[cat.id] || []).map((skill: ITSkill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('list.resetFilters')}
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && <LoadingSkeleton count={limit} />}

        {/* Error */}
        {error && !loading && (
          <ErrorAlert
            message={error}
            variant="card"
            onRetry={retry}
            retryLabel={t('list.retryButton')}
          />
        )}

        {/* Empty */}
        {!loading && !error && technicians.length === 0 && (
          <EmptyState
            icon={Users}
            title={t('list.emptyTitle')}
            message={
              hasActiveFilters
                ? t('list.emptyMessageFiltered')
                : t('list.emptyMessageEmpty')
            }
            action={
              hasActiveFilters
                ? { label: t('list.emptyActionFiltered'), onClick: clearFilters }
                : { label: t('list.emptyActionEmpty'), href: '/profil/techniker' }
            }
          />
        )}

        {/* Grid */}
        {!loading && !error && technicians.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {technicians.map((tech) => (
              <TechnicianCard key={tech.id} technician={tech} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="flex items-center justify-center gap-2 pt-8" aria-label={t('list.pagination')}>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="p-2 rounded-lg border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
              aria-label={t('list.prevPage')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-neutral-600 px-4" aria-current="page">
              {t('list.pageOf', { current: currentPage, total: totalPages })}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
              aria-label={t('list.nextPage')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        )}

        {/* CTA for non-logged-in */}
        {!session?.user && (
          <div className="mt-12 bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 text-center">
            <div className="flex justify-center mb-4">
              <IconBadge icon={Wrench} theme="repairers" size="lg" />
            </div>
            <Heading level={3} className="text-xl font-bold text-neutral-900 mb-2">
              {t('list.ctaTitle')}
            </Heading>
            <p className="text-base text-neutral-600 mb-6 max-w-md mx-auto">
              {t('list.ctaDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/login?callbackUrl=/profil/techniker"
                className="px-6 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-semibold shadow-sm transition-colors"
              >
                {t('list.ctaCreateProfile')}
              </Link>
              <Link
                href={ROUTES.public.itHilfe}
                className="px-6 py-2.5 bg-white hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 border border-primary-600 rounded-lg font-semibold transition-colors"
              >
                {t('list.ctaToITHelp')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
