import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
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
import { getSkillById } from '@/config/it-hilfe'
import { BUDGET_TIERS } from '@/config/it-hilfe'
import { ORG } from '@/config/org'

interface Service {
  id: string
  serviceCategory: string
  serviceName: string
  description: string | null
  basePriceCents: number | null
  hourlyRateCents: number | null
  estimatedHours: string | null
}

interface Technician {
  id: string
  userId: string
  name: string
  bio: string | null
  hourlyRateCents: number | null
  averageRating: number | null
  totalJobsCompleted: number
  totalReviews: number
  profileTier: string
  city: string | null
  postalCode: string | null
  acceptsGratis: boolean
  acceptsKulturlegi: boolean
  isVerified: boolean
  serviceDeliveryTypes: string[] | null
  maxTravelKm: number | null
  responseTimeHours: number | null
  createdAt: string
  skills: string[]
  services: Service[]
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ORG.website

  try {
    const res = await fetch(`${baseUrl}/api/technicians/${id}`, { cache: 'no-store' })
    if (!res.ok) return { title: `Techniker | ${ORG.name}` }
    const data = await res.json()
    const t: Technician = data.data?.technician
    if (!t) return { title: `Techniker | ${ORG.name}` }
    return {
      title: `${t.name} – Techniker | ${ORG.name}`,
      description: t.bio ?? `${t.name} ist ${t.profileTier === 'professional' ? 'professioneller' : 'Community-'} Techniker bei ${ORG.name}.`,
    }
  } catch {
    return { title: `Techniker | ${ORG.name}` }
  }
}

export default async function TechnikerDetailPage({ params }: Props) {
  const { id } = await params
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ORG.website

  const res = await fetch(`${baseUrl}/api/technicians/${id}`, { cache: 'no-store' })
  if (!res.ok) notFound()

  const data = await res.json()
  const technician: Technician | undefined = data.data?.technician
  if (!technician) notFound()

  const isProfessional = technician.profileTier === 'professional'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/techniker"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Alle Techniker
        </Link>

        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Heading level={1} className="text-2xl font-bold text-gray-900">
                  {technician.name}
                </Heading>
                {technician.isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verifiziert
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    isProfessional
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {isProfessional ? 'Professionell' : 'Community'}
                </span>
              </div>

              {/* Rating */}
              {(technician.averageRating || technician.totalJobsCompleted > 0) && (
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  {technician.averageRating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{technician.averageRating.toFixed(1)}</span>
                      {technician.totalReviews > 0 && (
                        <span className="text-gray-400">({technician.totalReviews} Bewertungen)</span>
                      )}
                    </span>
                  )}
                  {technician.totalJobsCompleted > 0 && (
                    <span>{technician.totalJobsCompleted} abgeschlossene Jobs</span>
                  )}
                </div>
              )}

              {/* Location */}
              {(technician.city || technician.postalCode) && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {[technician.postalCode, technician.city].filter(Boolean).join(' ')}
                  </span>
                  {technician.maxTravelKm && (
                    <span className="text-gray-400">· bis {technician.maxTravelKm} km Anfahrt</span>
                  )}
                </div>
              )}

              {/* Response time */}
              {technician.responseTimeHours && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Clock className="w-4 h-4" />
                  <span>Antwortet in ca. {technician.responseTimeHours}h</span>
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
                  Anfrage stellen
                </Link>
              ) : (
                <Link
                  href={`/it-hilfe/create?technician=${technician.id}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition-colors shadow-sm"
                >
                  <Users className="w-4 h-4" />
                  Kontaktieren
                </Link>
              )}
            </div>
          </div>

          {/* Pricing badges */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
            {technician.acceptsGratis && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${BUDGET_TIERS[0].badgeClass}`}>
                <Users className="w-3.5 h-3.5" />
                Gratis-Hilfe möglich
              </span>
            )}
            {technician.acceptsKulturlegi && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${BUDGET_TIERS[1].badgeClass}`}>
                <Sparkles className="w-3.5 h-3.5" />
                KulturLegi-Tarif
              </span>
            )}
            {technician.hourlyRateCents && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
                <Euro className="w-3.5 h-3.5" />
                CHF {(technician.hourlyRateCents / 100).toFixed(0)}/h
              </span>
            )}
          </div>
        </div>

        {/* Bio */}
        {technician.bio && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <Heading level={2} className="text-lg font-semibold text-gray-900 mb-3">
              Über mich
            </Heading>
            <p className="text-gray-700 whitespace-pre-line">{technician.bio}</p>
          </div>
        )}

        {/* Skills */}
        {technician.skills.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <Heading level={2} className="text-lg font-semibold text-gray-900 mb-4">
              Skills
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <Heading level={2} className="text-lg font-semibold text-gray-900 mb-4">
              Angebotene Dienstleistungen
            </Heading>
            <div className="space-y-4">
              {technician.services.map((service) => (
                <div key={service.id} className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{service.serviceName}</p>
                    {service.description && (
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    )}
                    {service.estimatedHours && (
                      <p className="text-xs text-gray-400 mt-1">Geschätzte Dauer: {service.estimatedHours}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {service.basePriceCents && (
                      <p className="font-semibold text-gray-900">
                        ab CHF {(service.basePriceCents / 100).toFixed(0)}
                      </p>
                    )}
                    {service.hourlyRateCents && (
                      <p className="text-sm text-gray-600">
                        CHF {(service.hourlyRateCents / 100).toFixed(0)}/h
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
                Buchung anfragen
              </Link>
            </div>
          </div>
        )}

        {/* Delivery types */}
        {technician.serviceDeliveryTypes && technician.serviceDeliveryTypes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <Heading level={2} className="text-lg font-semibold text-gray-900 mb-3">
              Art der Hilfe
            </Heading>
            <div className="flex flex-wrap gap-2">
              {technician.serviceDeliveryTypes.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                >
                  {type === 'remote' ? 'Remote / Online' : type === 'onsite' ? 'Vor Ort' : type}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
