import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Link } from '@/i18n/navigation'
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
import { getSkillById, BUDGET_TIERS, SERVICE_TYPE } from '@/config/it-hilfe'
import { ORG } from '@/config/org'
import { getTranslations } from 'next-intl/server'
import { getTechnicianById } from '@/lib/services/technician-service'
import { logger } from '@/lib/logger'

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
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/techniker"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('detail.backToList')}
        </Link>

        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Heading level={1} className="text-2xl font-bold text-neutral-900">
                  {technician.name}
                </Heading>
                {technician.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t('detail.verified')}
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isProfessional
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {isProfessional ? t('detail.professional') : t('detail.community')}
                </span>
              </div>

              {/* Rating */}
              {(technician.averageRating || technician.totalJobsCompleted > 0) && (
                <div className="flex items-center gap-4 text-sm text-neutral-600 mb-3">
                  {technician.averageRating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{technician.averageRating.toFixed(1)}</span>
                      {technician.totalReviews > 0 && (
                        <span className="text-neutral-400">{t('detail.reviews', { count: technician.totalReviews })}</span>
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
                <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {[technician.postalCode, technician.city].filter(Boolean).join(' ')}
                  </span>
                  {technician.maxTravelKm && (
                    <span className="text-neutral-400">{t('detail.travelRange', { km: technician.maxTravelKm })}</span>
                  )}
                </div>
              )}

              {/* Response time */}
              {technician.responseTimeHours && (
                <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
                  <Clock className="w-4 h-4" />
                  <span>{t('detail.responseTime', { hours: technician.responseTimeHours })}</span>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex flex-col gap-2 sm:min-w-[180px]">
              {isProfessional ? (
                <Link
                  href={`/it-hilfe/create?technician=${technician.id}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors shadow-sm"
                >
                  <Wrench className="w-4 h-4" />
                  {t('detail.submitRequest')}
                </Link>
              ) : (
                <Link
                  href={`/it-hilfe/create?technician=${technician.id}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors shadow-sm"
                >
                  <Users className="w-4 h-4" />
                  {t('detail.contact')}
                </Link>
              )}
            </div>
          </div>

          {/* Pricing badges */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-100">
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
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-primary-50 text-primary-700">
                <Euro className="w-3.5 h-3.5" />
                {t('detail.hourlyRate', { rate: (technician.hourlyRateCents / 100).toFixed(0) })}
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        {technician.bio && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 mb-6">
            <Heading level={2} className="text-lg font-semibold text-neutral-900 mb-3">
              {t('detail.aboutMe')}
            </Heading>
            <p className="text-neutral-700 whitespace-pre-line">{technician.bio}</p>
          </div>
        )}

        {/* Skills */}
        {technician.skills.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 mb-6">
            <Heading level={2} className="text-lg font-semibold text-neutral-900 mb-4">
              {t('detail.skills')}
            </Heading>
            <div className="flex flex-wrap gap-2">
              {technician.skills.map((skillId) => {
                const skill = getSkillById(skillId)
                if (!skill) return null
                return (
                  <span
                    key={skillId}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
                    title={skill.description}
                  >
                    {skill.name}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Services (professional only) */}
        {isProfessional && technician.services.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 mb-6">
            <Heading level={2} className="text-lg font-semibold text-neutral-900 mb-4">
              {t('detail.offeredServices')}
            </Heading>
            <div className="space-y-4">
              {technician.services.map((service) => (
                <div key={service.id} className="flex items-start justify-between gap-4 py-4 border-b border-neutral-100 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">{service.serviceName}</p>
                    {service.description && (
                      <p className="text-sm text-neutral-600 mt-1">{service.description}</p>
                    )}
                    {service.estimatedHours && (
                      <p className="text-xs text-neutral-400 mt-1">{t('detail.estimatedDuration', { hours: service.estimatedHours })}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {service.basePriceCents && (
                      <p className="font-semibold text-neutral-900">
                        {t('detail.priceFrom', { price: (service.basePriceCents / 100).toFixed(0) })}
                      </p>
                    )}
                    {service.hourlyRateCents && (
                      <p className="text-sm text-neutral-600">
                        {t('detail.hourlyRate', { rate: (service.hourlyRateCents / 100).toFixed(0) })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link
                href={`/it-hilfe/create?technician=${technician.id}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors shadow-sm"
              >
                <Wrench className="w-4 h-4" />
                {t('detail.requestBooking')}
              </Link>
            </div>
          </div>
        )}

        {/* Delivery types */}
        {technician.serviceDeliveryTypes && technician.serviceDeliveryTypes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 mb-6">
            <Heading level={2} className="text-lg font-semibold text-neutral-900 mb-3">
              {t('detail.deliveryTypes')}
            </Heading>
            <div className="flex flex-wrap gap-2">
              {technician.serviceDeliveryTypes.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-neutral-100 text-neutral-700"
                >
                  {type === SERVICE_TYPE.REMOTE ? t('detail.deliveryRemote') : type === SERVICE_TYPE.ONSITE ? t('detail.deliveryOnsite') : type}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
