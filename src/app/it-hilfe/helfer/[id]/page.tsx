'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Star,
  Shield,
  Euro,
  Users,
  Sparkles,
  MessageSquare,
  CheckCircle,
} from 'lucide-react'
import {
  IT_HILFE,
  getSkillById,
  getSkillsGroupedByCategory,
  getServiceTypeById,
  BUDGET_TIERS,
} from '@/config/it-hilfe'
import { CONVERSATION_TYPES } from '@/config/database'
import { formatDate } from '@/lib/date-formats'
import { logger } from '@/lib/logger'
import { apiFetch } from '@/lib/api/client'
import Heading from '@/components/ui/Heading'

interface Review {
  id: string
  reviewerName: string | null
  overallRating: number
  content: string | null
  createdAt: string
}

interface HelperProfile {
  userId: string
  name: string
  bio: string | null
  hourlyRateCents: number | null
  acceptsGratis: boolean | null
  acceptsKulturlegi: boolean | null
  serviceTypes: string[] | null
  locationCity: string | null
  locationCanton: string | null
  maxTravelKm: number | null
  isVerified: boolean | null
  averageRating: string | null
  totalHelpsCompleted: number | null
  createdAt: string | null
  skills: string[]
}

export default function HelperDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [helper, setHelper] = useState<HelperProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isContacting, setIsContacting] = useState(false)
  const [contactSuccess, setContactSuccess] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])

  // Fetch reviews for this helper
  useEffect(() => {
    if (!id) return
    apiFetch<{ reviews: Review[] }>(`/api/reviews?targetType=it_hilfe&targetId=${id}`)
      .then(result => {
        if (result.success && result.data) setReviews(result.data.reviews || [])
      })
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function fetchHelper() {
      const result = await apiFetch<{ helper: HelperProfile }>(`/api/it-hilfe/helpers/${id}`)
      if (cancelled) return
      if (result.success && result.data) {
        setHelper(result.data.helper)
      } else {
        setError(result.error || 'Profil nicht gefunden')
      }
      setLoading(false)
    }
    fetchHelper()
    return () => { cancelled = true }
  }, [id])

  async function handleContact() {
    if (!helper) return
    setIsContacting(true)

    const initialMessage = `Hallo ${helper.name},\n\nich brauche IT-Hilfe und habe gesehen, dass du folgende Fähigkeiten hast:\n\n${helper.skills.slice(0, 5).map(sid => {
      const skill = getSkillById(sid)
      return skill ? `- ${skill.name}` : ''
    }).filter(Boolean).join('\n')}\n\nKönntest du mir helfen?`

    const result = await apiFetch<void>('/api/messages', {
      method: 'POST',
      body: {
        recipient_id: helper.userId,
        content: initialMessage,
        context_type: CONVERSATION_TYPES.IT_HILFE,
      },
    })

    if (result.success) {
      setContactSuccess(true)
    } else {
      logger.error('Error contacting helper', { error: result.error, helperId: helper.userId })
    }
    setIsContacting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !helper) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">{error || 'Profil nicht gefunden'}</p>
        <Link href={IT_HILFE.routes.helpers} className="text-blue-600 hover:underline">
          Zurück zur Übersicht
        </Link>
      </div>
    )
  }

  const groupedSkills = getSkillsGroupedByCategory()
  const helperSkillSet = new Set(helper.skills)
  const rating = helper.averageRating ? parseFloat(helper.averageRating) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href={IT_HILFE.routes.helpers}
            className="inline-flex items-center gap-2 text-blue-100 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zu Techniker
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {helper.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <Heading level={1} className="text-2xl">{helper.name}</Heading>
                {helper.isVerified && (
                  <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    <Shield className="w-3 h-3" />
                    Verifiziert
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-blue-100">
                {rating !== null && (
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                    {rating.toFixed(1)}
                  </span>
                )}
                {helper.totalHelpsCompleted ? (
                  <span>{helper.totalHelpsCompleted} {helper.totalHelpsCompleted === 1 ? 'Hilfe' : 'Hilfen'} abgeschlossen</span>
                ) : null}
                {(helper.locationCity || helper.locationCanton) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {helper.locationCity && helper.locationCanton
                      ? `${helper.locationCity}, ${helper.locationCanton}`
                      : helper.locationCanton || helper.locationCity}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Bio */}
        {helper.bio && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <Heading level={2} className="text-lg text-gray-900 mb-3">Über mich</Heading>
            <p className="text-gray-700 whitespace-pre-line">{helper.bio}</p>
          </div>
        )}

        {/* Skills */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <Heading level={2} className="text-lg text-gray-900 mb-4">Fähigkeiten</Heading>
          <div className="space-y-4">
            {groupedSkills
              .filter(g => g.skills.some(s => helperSkillSet.has(s.id)))
              .map(({ category, skills }) => {
                const CategoryIcon = category.icon
                return (
                  <div key={category.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <CategoryIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">{category.name}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-6">
                      {skills
                        .filter(s => helperSkillSet.has(s.id))
                        .map(skill => (
                          <span
                            key={skill.id}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                          >
                            {skill.name}
                          </span>
                        ))}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* Service Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <Heading level={2} className="text-lg text-gray-900 mb-4">Service-Details</Heading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Service types */}
            {helper.serviceTypes && helper.serviceTypes.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">Service-Art</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {helper.serviceTypes.map(st => {
                    const type = getServiceTypeById(st)
                    return (
                      <span key={st} className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {type?.name || st}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Travel radius */}
            {helper.maxTravelKm && (
              <div>
                <span className="text-sm font-medium text-gray-500">Reiseradius</span>
                <p className="text-gray-900 mt-1">{helper.maxTravelKm} km</p>
              </div>
            )}

            {/* Pricing */}
            <div>
              <span className="text-sm font-medium text-gray-500">Preisoptionen</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {helper.acceptsGratis && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${BUDGET_TIERS[0].badgeClass}`}>
                    <Users className="w-3 h-3" />
                    Gratis
                  </span>
                )}
                {helper.acceptsKulturlegi && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${BUDGET_TIERS[1].badgeClass}`}>
                    <Sparkles className="w-3 h-3" />
                    KulturLegi
                  </span>
                )}
                {helper.hourlyRateCents && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    <Euro className="w-3 h-3" />
                    CHF {(helper.hourlyRateCents / 100).toFixed(0)}/h
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <Heading level={2} className="text-lg text-gray-900 mb-4">
              Bewertungen ({reviews.length})
            </Heading>
            <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star
                          key={n}
                          className={`w-4 h-4 ${n <= review.overallRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      {review.reviewerName || 'Anonym'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  {review.content && (
                    <p className="text-gray-700 text-sm">{review.content}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Contact */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {contactSuccess ? (
            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-6 py-3 rounded-lg font-medium">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              Nachricht an {helper.name} gesendet!
            </div>
          ) : (
            <button
              onClick={handleContact}
              disabled={isContacting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageSquare className="w-5 h-5" />
              {isContacting ? 'Wird kontaktiert...' : 'Kontaktieren'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
