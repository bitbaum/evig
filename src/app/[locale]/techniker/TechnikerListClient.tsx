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
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
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
      className="block card-shell p-5 hover:border-strong transition-all"
    >
      {/* Name + tier badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <Heading level={3} className="text-base font-semibold text-text-primary line-clamp-1">
          {technician.name}
        </Heading>
        <span
          className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            technician.profileTier === REPAIRER_PROFILE_TIER.PROFESSIONAL
              ? 'bg-action-muted-muted text-action'
              : 'bg-surface-raised text-text-secondary'
          }`}
        >
          {technician.profileTier === REPAIRER_PROFILE_TIER.PROFESSIONAL ? t('list.professional') : t('list.community')}
        </span>
      </div>

      {/* Bio */}
      {technician.bio && (
        <p className="text-sm text-text-secondary line-clamp-2 mb-3">{technician.bio}</p>
      )}

      {/* Rating + jobs */}
      {(technician.averageRating || technician.totalJobsCompleted > 0) && (
        <div className="flex items-center gap-3 text-sm text-text-secondary mb-3">
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
            <span className="text-action font-medium">✓ {t('list.verified')}</span>
          )}
        </div>
      )}

      {/* Location */}
      {technician.city && (
        <div className="flex items-center gap-1.5 text-sm text-text-tertiary mb-3">
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
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-raised text-text-secondary"
              >
                {skill.name}
              </span>
            )
          })}
          {remaining > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-raised text-text-tertiary">
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-action-muted-muted text-action">
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
      <div className="bg-surface-raised border-b border-subtle dark:border-white/6 py-6 sm:py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <Heading level={1} className="text-2xl sm:text-3xl font-bold text-text-primary">
                {t('list.title')}
              </Heading>
              <p className="text-sm text-text-secondary mt-1">
                {t('list.available', { count: pagination.total })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button as={Link} href={session?.user ? '/profil/techniker' : '/auth/login?callbackUrl=/profil/techniker'} variant="primary">
                <Wrench className="w-4 h-4" />
                {t('list.becomeTechnician')}
              </Button>
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-tertiary" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('list.searchPlaceholder')}
                aria-label={t('list.searchAriaLabel')}
                className="pl-12 pr-24 py-3"
              />
              <Button type="submit" variant="primary" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2">
                {t('list.searchButton')}
              </Button>
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
                  ? 'bg-action text-white'
                  : 'bg-surface-raised text-text-secondary hover:bg-neutral-200'
              }`}
              aria-pressed={tier === tab.value}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Skills filter */}
        <div className="mb-6">
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
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-3 text-sm text-action hover:text-action font-medium"
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
              className="p-2 rounded-lg border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-raised transition-colors"
              aria-label={t('list.prevPage')}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-text-secondary px-4" aria-current="page">
              {t('list.pageOf', { current: currentPage, total: totalPages })}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-2 rounded-lg border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-surface-raised transition-colors"
              aria-label={t('list.nextPage')}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </nav>
        )}

        {/* CTA for non-logged-in */}
        {!session?.user && (
          <div className="mt-12 card-shell rounded-2xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <IconBadge icon={Wrench} theme="repairers" size="lg" />
            </div>
            <Heading level={3} className="text-xl font-bold text-text-primary mb-2">
              {t('list.ctaTitle')}
            </Heading>
            <p className="text-base text-text-secondary mb-6 max-w-md mx-auto">
              {t('list.ctaDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button as={Link} href="/auth/login?callbackUrl=/profil/techniker" variant="primary">
                {t('list.ctaCreateProfile')}
              </Button>
              <Link
                href={ROUTES.public.itHilfe}
                className="px-6 py-2.5 bg-surface-base hover:bg-action-muted-muted text-action border border-action rounded-lg font-semibold transition-colors"
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
