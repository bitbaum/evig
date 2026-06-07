/**
 * TechnicianCard — fleetcrown discipline (matches ListingCard BBB.1).
 *
 * One symmetric layout regardless of state. No floating colored chips,
 * no warning-yellow star fill, no euro icon, no skill colored pills.
 * State (verified, professional vs community, accepts gratis / kulturlegi,
 * hourly rate) is conveyed inline in the monospace meta line.
 */

'use client'

import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { getSkillById } from '@/config/it-hilfe'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'
import { formatCentsToChf } from '@/lib/pricing'
import { ROUTES } from '@/config/routes'
import type { Technician } from '@/hooks/useTechnicianList'

const MAX_SKILLS_SHOWN = 4

export function TechnicianCard({ technician }: { technician: Technician }) {
  const t = useTranslations('techniker')
  const displayedSkills = technician.skills.slice(0, MAX_SKILLS_SHOWN)
  const remaining = technician.skills.length - MAX_SKILLS_SHOWN
  const isPro = technician.profileTier === REPAIRER_PROFILE_TIER.PROFESSIONAL

  // Eyebrow meta — single monospace line. Order: tier · location · verified.
  const eyebrowParts = [
    isPro ? t('list.professional').toUpperCase() : t('list.community').toUpperCase(),
    technician.city ? technician.city.toUpperCase() : null,
    technician.isVerified ? t('list.verified').toUpperCase() : null,
  ].filter(Boolean) as string[]

  // Pricing meta — single monospace line. "GRATIS · KULTURLEGI · CHF 80/H"
  const pricingParts = [
    technician.acceptsGratis ? t('list.gratis').toUpperCase() : null,
    technician.acceptsKulturlegi ? t('list.kulturlegi').toUpperCase() : null,
    technician.hourlyRateCents ? `${formatCentsToChf(technician.hourlyRateCents)}/h` : null,
  ].filter(Boolean) as string[]

  // Stats meta — rating · jobs count
  const hasStats = technician.averageRating != null || technician.totalJobsCompleted > 0

  return (
    <Link
      href={ROUTES.public.technicianProfile(technician.id)}
      className="block card-shell p-5 hover:border-strong transition-colors"
    >
      {/* Eyebrow */}
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary truncate">
        {eyebrowParts.join(' · ')}
      </div>

      {/* Name */}
      <h3 className="mt-2 text-base font-semibold text-text-primary line-clamp-1">
        {technician.name}
      </h3>

      {/* Bio */}
      {technician.bio && (
        <p className="text-sm text-text-secondary line-clamp-2 mt-2">{technician.bio}</p>
      )}

      {/* Skills — text-only, comma-separated */}
      {displayedSkills.length > 0 && (
        <p className="text-sm text-text-secondary mt-3 line-clamp-2">
          {displayedSkills
            .map((id) => getSkillById(id)?.name)
            .filter(Boolean)
            .join(' · ')}
          {remaining > 0 && <span className="text-text-tertiary"> · +{remaining}</span>}
        </p>
      )}

      {/* Stats + pricing meta — one bottom border, two lines */}
      {(hasStats || pricingParts.length > 0) && (
        <div className="mt-4 pt-3 border-t border-subtle space-y-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary">
          {hasStats && (
            <div className="tabular-nums">
              {technician.averageRating != null && (
                <span>★ {technician.averageRating.toFixed(1)}</span>
              )}
              {technician.averageRating != null && technician.totalJobsCompleted > 0 && ' · '}
              {technician.totalJobsCompleted > 0 && (
                <span>{t('list.jobs', { count: technician.totalJobsCompleted })}</span>
              )}
            </div>
          )}
          {pricingParts.length > 0 && (
            <div className="tabular-nums">{pricingParts.join(' · ')}</div>
          )}
        </div>
      )}
    </Link>
  )
}
