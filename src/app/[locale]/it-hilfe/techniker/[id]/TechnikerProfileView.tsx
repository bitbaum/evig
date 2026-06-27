import { Link } from '@/i18n/navigation'
import { ArrowLeft, ArrowRight, BadgeCheck, MapPin, Star, Wrench } from 'lucide-react'
import { getServiceTypeById, getSkillById, IT_HILFE } from '@/config/it-hilfe'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'
import { ROUTES } from '@/config/routes'
import { formatCentsToChf } from '@/lib/pricing'
import type { TechnicianDetail } from '@/lib/services/technician-service'

export type TechnikerProfileCopy = {
  backToList: string
  verified: string
  professional: string
  community: string
  aboutMe: string
  skills: string
  offeredServices: string
  requestBooking: string
  estimatedDuration: string
  priceFrom: string
  hourlyRate: string
  deliveryTypes: string
  submitRequest: string
  contact: string
  gratisHelp: string
  kulturlegiRate: string
}

export type TechnikerProfileMeta = {
  eyebrow: string
  statsLine?: string
  locationLine?: string
  pricingLine?: string
  ctaLabel: string
}

interface TechnikerProfileViewProps {
  technician: TechnicianDetail
  copy: TechnikerProfileCopy
  meta: TechnikerProfileMeta
}

/** Public technician profile — same fleetcrown rhythm as the list cards. */
export function TechnikerProfileView({ technician, copy, meta }: TechnikerProfileViewProps) {
  const isPro = technician.profileTier === REPAIRER_PROFILE_TIER.PROFESSIONAL
  const ctaHref = IT_HILFE.routes.createForTechnician(technician.id)
  const displayName = technician.name ?? copy.community
  const initial = displayName.trim().charAt(0).toUpperCase() || 'T'

  const skillLabels = technician.skills
    .map((id) => getSkillById(id)?.name)
    .filter(Boolean) as string[]

  const deliveryLabels = (technician.serviceDeliveryTypes ?? [])
    .map((type) => getServiceTypeById(type)?.name ?? type)
    .filter(Boolean)

  return (
    <article className="bg-canvas min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Link
          href={ROUTES.public.techniker}
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {copy.backToList}
        </Link>

        <header className="mt-8 border-b border-subtle pb-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border border-subtle bg-action-muted font-mono text-3xl font-semibold text-action">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-text-tertiary">
                {meta.eyebrow}
              </div>
              <h1 className="ui-public-display-md mt-3">{displayName}</h1>

              {meta.locationLine && (
                <p className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
                  <MapPin className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
                  {meta.locationLine}
                </p>
              )}

              {meta.pricingLine && (
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-text-tertiary tabular-nums">
                  {meta.pricingLine}
                </p>
              )}
            </div>
          </div>

          {(meta.statsLine || technician.isVerified || skillLabels.length > 0) && (
            <dl className="mt-8 grid grid-cols-1 divide-y divide-subtle rounded-lg border border-subtle bg-surface-base sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {technician.isVerified && (
                <div className="flex items-center gap-3 p-4">
                  <BadgeCheck className="h-4 w-4 text-action" aria-hidden="true" />
                  <div>
                    <dt className="text-xs text-text-tertiary">{copy.verified}</dt>
                    <dd className="text-sm font-medium text-text-primary">{isPro ? copy.professional : copy.community}</dd>
                  </div>
                </div>
              )}
              {meta.statsLine && (
                <div className="flex items-center gap-3 p-4">
                  <Star className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
                  <div>
                    <dt className="text-xs text-text-tertiary">{copy.contact}</dt>
                    <dd className="font-mono text-xs uppercase tracking-[0.12em] text-text-primary">{meta.statsLine}</dd>
                  </div>
                </div>
              )}
              {skillLabels.length > 0 && (
                <div className="flex items-center gap-3 p-4">
                  <Wrench className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
                  <div>
                    <dt className="text-xs text-text-tertiary">{copy.skills}</dt>
                    <dd className="line-clamp-1 text-sm font-medium text-text-primary">{skillLabels.slice(0, 3).join(' · ')}</dd>
                  </div>
                </div>
              )}
            </dl>
          )}

          <div className="mt-8">
            <Link href={ctaHref} className="ui-public-cta inline-flex items-center gap-2">
              {meta.ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        {technician.bio && (
          <section className="py-8 border-b border-subtle">
            <h2 className="ui-public-eyebrow">{copy.aboutMe}</h2>
            <p className="mt-4 text-sm leading-relaxed text-text-secondary whitespace-pre-line">
              {technician.bio}
            </p>
          </section>
        )}

        {skillLabels.length > 0 && (
          <section className="py-8 border-b border-subtle">
            <h2 className="ui-public-eyebrow">{copy.skills}</h2>
            <p className="mt-4 text-sm text-text-secondary">{skillLabels.join(' · ')}</p>
          </section>
        )}

        {deliveryLabels.length > 0 && (
          <section className="py-8 border-b border-subtle">
            <h2 className="ui-public-eyebrow">{copy.deliveryTypes}</h2>
            <p className="mt-4 text-sm text-text-secondary">{deliveryLabels.join(' · ')}</p>
          </section>
        )}

        {isPro && technician.services.length > 0 && (
          <section className="py-8">
            <h2 className="text-lg font-semibold text-text-primary">{copy.offeredServices}</h2>
            <ul className="mt-6 divide-y divide-subtle border-y border-subtle">
              {technician.services.map((service) => (
                <li
                  key={service.id}
                  className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-6"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-text-primary">{service.serviceName}</p>
                    {service.description && (
                      <p className="mt-1 text-sm text-text-secondary">{service.description}</p>
                    )}
                    {service.estimatedHours != null && (
                      <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-text-tertiary">
                        {copy.estimatedDuration.replace('{hours}', String(service.estimatedHours))}
                      </p>
                    )}
                  </div>
                  <div className="font-mono text-sm tabular-nums text-text-primary sm:text-right">
                    {service.basePriceCents != null && (
                      <div>
                        {copy.priceFrom.replace('{price}', String(Math.round(service.basePriceCents / 100)))}
                      </div>
                    )}
                    {service.hourlyRateCents != null && (
                      <div className="text-text-secondary">
                        {copy.hourlyRate.replace('{rate}', String(Math.round(service.hourlyRateCents / 100)))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Link href={ctaHref} className="ui-public-cta-ghost inline-flex items-center gap-2">
                {copy.requestBooking}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </section>
        )}
      </div>
    </article>
  )
}

export function buildTechnikerProfileMeta(
  technician: TechnicianDetail,
  copy: TechnikerProfileCopy,
  detail: {
    reviews: (values: { count: number }) => string
    jobsCompleted: (values: { count: number }) => string
    responseTime: (values: { hours: number }) => string
    travelRange: (values: { km: number }) => string
  },
): TechnikerProfileMeta {
  const isPro = technician.profileTier === REPAIRER_PROFILE_TIER.PROFESSIONAL

  const eyebrowParts = [
    isPro ? copy.professional.toUpperCase() : copy.community.toUpperCase(),
    technician.postalCode ?? technician.city?.toUpperCase() ?? null,
    technician.isVerified ? copy.verified.toUpperCase() : null,
  ].filter(Boolean)

  const statsParts = [
    technician.averageRating != null && technician.averageRating > 0
      ? `★ ${technician.averageRating.toFixed(1)}${
          technician.totalReviews > 0 ? ` ${detail.reviews({ count: technician.totalReviews })}` : ''
        }`
      : null,
    technician.totalJobsCompleted > 0
      ? detail.jobsCompleted({ count: technician.totalJobsCompleted })
      : null,
    technician.responseTimeHours
      ? detail.responseTime({ hours: technician.responseTimeHours })
      : null,
  ].filter(Boolean)

  const locationParts = [
    [technician.postalCode, technician.city].filter(Boolean).join(' '),
    technician.maxTravelKm ? detail.travelRange({ km: technician.maxTravelKm }) : null,
  ].filter(Boolean)

  const pricingParts = [
    technician.hourlyRateCents ? `${formatCentsToChf(technician.hourlyRateCents)}/h` : null,
    technician.acceptsGratis ? copy.gratisHelp.toUpperCase() : null,
    technician.acceptsKulturlegi ? copy.kulturlegiRate.toUpperCase() : null,
  ].filter(Boolean)

  return {
    eyebrow: eyebrowParts.join(' · '),
    statsLine: statsParts.length > 0 ? statsParts.join(' · ') : undefined,
    locationLine: locationParts.length > 0 ? locationParts.join(' · ') : undefined,
    pricingLine: pricingParts.length > 0 ? pricingParts.join(' · ') : undefined,
    ctaLabel: isPro ? copy.submitRequest : copy.contact,
  }
}
