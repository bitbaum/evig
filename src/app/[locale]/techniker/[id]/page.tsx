// SSR only — lucide-react in server component scope causes React-null in certain Turbopack SSG bundles
export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { buttonClass } from '@/components/ui/button-class'
import {
  ArrowLeft,
  MapPin,
  Star,
  Users,
  Sparkles,
  Euro,
  CheckCircle,
  Wrench,
  Clock,
} from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { Card } from '@/components/ui/card'
import { getSkillById, BUDGET_TIERS, SERVICE_TYPE, IT_HILFE } from '@/config/it-hilfe'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'
import { getTechnicianById } from '@/lib/services/technician-service'
import { logger } from '@/lib/logger'
import { ROUTES } from '@/config/routes'
import { PageShell } from '@/components/layout/PageShell'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Props {
  params: Promise<{ id: string; locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'techniker' })

  if (!UUID_RE.test(id)) return { title: `${t('meta.title')} | ${ORG.name}` }

  try {
    const tech = await getTechnicianById(id)
    if (!tech) return { title: `${t('meta.title')} | ${ORG.name}` }
    const tierLabel = tech.profileTier === 'professional' ? t('detail.professional') : t('detail.community')
    const displayName = tech.name ?? t('meta.title')
    const title = `${displayName} – ${tierLabel} | ${ORG.name}`
    const description = tech.bio ?? `${displayName} · ${tierLabel} · ${ORG.name}`
    return {
      title,
      description,
      openGraph: { title, description, type: 'website' },
    }
  } catch (err) {
    logger.warn('Failed to generate technician metadata', { error: err })
    return { title: `${t('meta.title')} | ${ORG.name}` }
  }
}

export default async function TechnikerDetailPage({ params }: Props) {
  const { id, locale } = await params
  const t = await getTranslations({ locale, namespace: 'techniker' })

  if (!UUID_RE.test(id)) notFound()

  const technician = await getTechnicianById(id)
  if (!technician) notFound()

  const isProfessional = technician.profileTier === 'professional'

  return (
    <PageShell maxWidth="4xl">
        {/* Back link */}
        <Link
          href={ROUTES.public.techniker}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('detail.backToList')}
        </Link>

        {/* Profile header */}
        <Card className="rounded-2xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Heading level={1} className="text-2xl font-bold text-text-primary">
                  {technician.name}
                </Heading>
                {technician.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-action-muted text-action">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t('detail.verified')}
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isProfessional
                      ? 'bg-action-muted text-action'
                      : 'bg-surface-raised text-text-secondary'
                  }`}
                >
                  {isProfessional ? t('detail.professional') : t('detail.community')}
                </span>
              </div>

              {/* Rating */}
              {(technician.averageRating || technician.totalJobsCompleted > 0) && (
                <div className="flex items-center gap-4 text-sm text-text-secondary mb-3">
                  {technician.averageRating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-warning-400 text-warning-400" />
                      <span className="font-medium">{technician.averageRating.toFixed(1)}</span>
                      {technician.totalReviews > 0 && (
                        <span className="text-text-muted">{t('detail.reviews', { count: technician.totalReviews })}</span>
                      )}
                    </span>
                  )}
                  {technician.totalJobsCompleted > 0 && (
                    <span>{t('detail.jobsCompleted', { count: technician.totalJobsCompleted })}</span>
                  )}
                </div>
              )}

              {/* Location */}
              {(technician.city || technician.postalCode) && (
                <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {[technician.postalCode, technician.city].filter(Boolean).join(' ')}
                  </span>
                  {technician.maxTravelKm && (
                    <span className="text-text-muted">{t('detail.travelRange', { km: technician.maxTravelKm })}</span>
                  )}
                </div>
              )}

              {/* Response time */}
              {technician.responseTimeHours && (
                <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
                  <Clock className="w-4 h-4" />
                  <span>{t('detail.responseTime', { hours: technician.responseTimeHours })}</span>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-2 sm:min-w-[180px]">
              {isProfessional ? (
                <Link href={IT_HILFE.routes.createForTechnician(technician.id)} className={buttonClass({ variant: 'primary' })}>
                  <Wrench className="w-4 h-4" />
                  {t('detail.submitRequest')}
                </Link>
              ) : (
                <Link href={IT_HILFE.routes.createForTechnician(technician.id)} className={buttonClass({ variant: 'primary' })}>
                  <Users className="w-4 h-4" />
                  {t('detail.contact')}
                </Link>
              )}
            </div>
          </div>

          {/* Pricing badges */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-subtle">
            {technician.acceptsGratis && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${BUDGET_TIERS[0].badgeClass}`}>
                <Users className="w-3.5 h-3.5" />
                {t('detail.gratisHelp')}
              </span>
            )}
            {technician.acceptsKulturlegi && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${BUDGET_TIERS[1].badgeClass}`}>
                <Sparkles className="w-3.5 h-3.5" />
                {t('detail.kulturlegiRate')}
              </span>
            )}
            {technician.hourlyRateCents && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-action-muted text-action">
                <Euro className="w-3.5 h-3.5" />
                {t('detail.hourlyRate', { rate: Math.round(technician.hourlyRateCents / 100) })}
              </span>
            )}
          </div>
        </Card>

        {/* Bio */}
        {technician.bio && (
          <Card className="rounded-2xl p-6 mb-6">
            <Heading level={2} className="text-lg font-semibold text-text-primary mb-3">
              {t('detail.aboutMe')}
            </Heading>
            <p className="text-text-secondary whitespace-pre-line">{technician.bio}</p>
          </Card>
        )}

        {/* Skills */}
        {technician.skills.length > 0 && (
          <Card className="rounded-2xl p-6 mb-6">
            <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">
              {t('detail.skills')}
            </Heading>
            <div className="flex flex-wrap gap-2">
              {technician.skills.map((skillId) => {
                const skill = getSkillById(skillId)
                if (!skill) return null
                return (
                  <span
                    key={skillId}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-surface-raised text-text-secondary"
                    title={skill.description}
                  >
                    {skill.name}
                  </span>
                )
              })}
            </div>
          </Card>
        )}

        {/* Services (professional only) */}
        {isProfessional && technician.services.length > 0 && (
          <Card className="rounded-2xl p-6 mb-6">
            <Heading level={2} className="text-lg font-semibold text-text-primary mb-4">
              {t('detail.offeredServices')}
            </Heading>
            <div className="space-y-4">
              {technician.services.map((service) => (
                <div key={service.id} className="flex items-start justify-between gap-4 py-4 border-b border-subtle last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{service.serviceName}</p>
                    {service.description && (
                      <p className="text-sm text-text-secondary mt-1">{service.description}</p>
                    )}
                    {service.estimatedHours && (
                      <p className="text-xs text-text-muted mt-1">{t('detail.estimatedDuration', { hours: service.estimatedHours })}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {service.basePriceCents && (
                      <p className="font-semibold text-text-primary">
                        {t('detail.priceFrom', { price: Math.round(service.basePriceCents / 100) })}
                      </p>
                    )}
                    {service.hourlyRateCents && (
                      <p className="text-sm text-text-secondary">
                        {t('detail.hourlyRate', { rate: Math.round(service.hourlyRateCents / 100) })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link href={IT_HILFE.routes.createForTechnician(technician.id)} className={buttonClass({ variant: 'primary' })}>
                <Wrench className="w-4 h-4" />
                {t('detail.requestBooking')}
              </Link>
            </div>
          </Card>
        )}

        {/* Delivery types */}
        {technician.serviceDeliveryTypes && technician.serviceDeliveryTypes.length > 0 && (
          <Card className="rounded-2xl p-6 mb-6">
            <Heading level={2} className="text-lg font-semibold text-text-primary mb-3">
              {t('detail.deliveryTypes')}
            </Heading>
            <div className="flex flex-wrap gap-2">
              {technician.serviceDeliveryTypes.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-surface-raised text-text-secondary"
                >
                  {type === SERVICE_TYPE.REMOTE ? t('detail.deliveryRemote') : type === SERVICE_TYPE.ONSITE ? t('detail.deliveryOnsite') : type}
                </span>
              ))}
            </div>
          </Card>
        )}
    </PageShell>
  )
}
