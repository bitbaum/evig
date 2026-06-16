'use client'

/**
 * TechnicianMapList - Google-like split layout with map + list
 *
 * Shows RevampIT store prominently + matched community helpers.
 * Desktop: list on left, map on right. Mobile: stacked.
 */

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import {
  Sparkles,
  TrendingUp,
  MapPin,
  Award,
  ExternalLink,
  Store,
} from 'lucide-react'
import { logger } from '@/lib/logger'
import { getSkillById, REVAMPIT_STORE } from '@/config/it-hilfe'
import { getCantonCoordinates } from '@/config/canton-coordinates'
import LeafletMap, { type MapMarker } from '@/components/map/LeafletMap'
import { TechnicianMatchCard } from './TechnicianMatchCard'
import Heading from '@/components/ui/Heading'
import { ROUTES } from '@/config/routes'

// =============================================================================
// TYPES
// =============================================================================

interface MatchedHelper {
  id: string
  userId: string
  name: string
  bio: string | null
  hourlyRateCents: number | null
  acceptsGratis: boolean
  acceptsKulturlegi: boolean
  serviceTypes: string[]
  canton: string | null
  city: string | null
  skills: string[]
  matchScore: number
  matchReasons: string[]
}

interface TechnicianMapListProps {
  requestId: string
  requestTitle?: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export function TechnicianMapList({ requestId, requestTitle }: TechnicianMapListProps) {
  const t = useTranslations('itHelp.detail')
  const [matches, setMatches] = useState<MatchedHelper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [highlightedHelperId, setHighlightedHelperId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true)
        const { data, error: apiError } = await apiFetch<{ matches: MatchedHelper[] }>(
          `/api/it-hilfe/requests/${requestId}/matches`
        )

        if (apiError) {
          throw new Error(apiError)
        }

        setMatches(data?.matches || [])
      } catch (err) {
        logger.error('Error fetching matched helpers', { error: err, requestId })
        setError(err instanceof Error ? err.message : t('error'))
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [requestId, t])

  // Build map markers
  const markers: MapMarker[] = []

  // Always add RevampIT store marker
  markers.push({
    id: 'revampit-store',
    lat: REVAMPIT_STORE.lat,
    lng: REVAMPIT_STORE.lng,
    label: REVAMPIT_STORE.name,
    description: `${REVAMPIT_STORE.address}, ${REVAMPIT_STORE.postalCode} ${REVAMPIT_STORE.city}`,
    type: 'store',
  })

  // Add helper markers (use canton coordinates as approximation)
  // Deterministic offset from userId to avoid overlap without re-render jitter
  for (const helper of matches) {
    if (helper.canton) {
      const coords = getCantonCoordinates(helper.canton)
      if (coords) {
        const hash = helper.userId.charCodeAt(0) + helper.userId.charCodeAt(helper.userId.length - 1)
        const offsetLat = ((hash % 50) - 25) * 0.001
        const offsetLng = ((hash % 37) - 18) * 0.001
        markers.push({
          id: helper.userId,
          lat: coords.lat + offsetLat,
          lng: coords.lng + offsetLng,
          label: helper.name,
          description: helper.city
            ? `${helper.city}, ${helper.canton}`
            : helper.canton,
          type: 'helper',
        })
      }
    }
  }

  const topMatches = matches.slice(0, 5)
  const maxScore = matches[0]?.matchScore || 1

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-action" />
          <Heading level={3} className="text-lg font-semibold text-text-primary">{t('searchingTechnicians')}</Heading>
        </div>
        <div className="animate-pulse bg-surface-raised rounded-lg min-h-[300px]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800/30 rounded-xl p-6">
        <p className="text-error-800 dark:text-error-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-action" />
        <Heading level={3} className="text-lg font-semibold text-text-primary">
          {t('technicianSection')}
        </Heading>
      </div>

      {/* Split Layout: Desktop side-by-side, Mobile stacked */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: List */}
        <div className="space-y-4 order-1 lg:order-1">
          {/* RevampIT Store Card - Always visible */}
          <div className="bg-surface-raised border-2 border-strong dark:border-action/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Store className="w-5 h-5 text-action" />
              <Heading level={4} className="font-semibold text-text-primary">{REVAMPIT_STORE.name}</Heading>
            </div>
            <p className="text-sm text-text-secondary mb-2">
              {REVAMPIT_STORE.description}
            </p>
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
              <MapPin className="w-4 h-4" />
              <span>{REVAMPIT_STORE.address}, {REVAMPIT_STORE.postalCode} {REVAMPIT_STORE.city}</span>
            </div>
            <a
              href={REVAMPIT_STORE.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-action hover:text-action font-medium"
            >
              {t('planRoute')}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Community Helpers */}
          {topMatches.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-action" />
                <p className="text-sm font-medium text-text-secondary">
                  {t('matchCount', { count: topMatches.length })}
                </p>
              </div>

              {topMatches.map((helper, index) => {
                const helperForCard = {
                  id: helper.id,
                  userId: helper.userId,
                  name: helper.name,
                  bio: helper.bio,
                  hourlyRateCents: helper.hourlyRateCents,
                  acceptsGratis: helper.acceptsGratis,
                  acceptsKulturlegi: helper.acceptsKulturlegi,
                  serviceTypes: helper.serviceTypes,
                  postalCode: null,
                  city: helper.city,
                  canton: helper.canton,
                  maxTravelKm: 10,
                  skills: helper.skills,
                }

                const matchPercentage = Math.round((helper.matchScore / maxScore) * 100)

                return (
                  <div
                    key={helper.userId}
                    className="relative"
                    onMouseEnter={() => setHighlightedHelperId(helper.userId)}
                    onMouseLeave={() => setHighlightedHelperId(null)}
                  >
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2 z-10 bg-warning-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-xs">
                        <Award className="w-3 h-3" />
                        {t('topMatch')}
                      </div>
                    )}

                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                        <span className="font-medium">{t('matchPercent', { percent: matchPercentage })}</span>
                      </div>
                      <div className="w-full bg-surface-overlay rounded-full h-1.5">
                        <div
                          className="bg-action h-1.5 rounded-full transition-all"
                          style={{ width: `${matchPercentage}%` }}
                        />
                      </div>
                    </div>

                    {helper.matchReasons.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-1">
                        {helper.matchReasons.slice(0, 3).map((reason, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-action-muted text-action"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}

                    <TechnicianMatchCard
                      technician={helperForCard}
                      requestId={requestId}
                      requestTitle={requestTitle}
                    />
                  </div>
                )
              })}

              {matches.length > 5 && (
                <div className="text-center">
                  <Link
                    href={ROUTES.public.techniker}
                    className="inline-flex items-center gap-2 text-action hover:text-action font-medium text-sm"
                  >
                    {t('showAllTechnicians', { count: matches.length })}
                    <TrendingUp className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="bg-action-muted border border-strong rounded-xl p-6 text-center">
              <p className="text-sm text-text-secondary">
                {t('noMatchesYet')}
              </p>
            </div>
          )}
        </div>

        {/* Right: Map */}
        <div className="order-2 lg:order-2 min-h-[400px] lg:sticky lg:top-4 lg:self-start">
          <LeafletMap
            markers={markers}
            highlightedMarkerId={highlightedHelperId}
            className="h-full"
          />
        </div>
      </div>
    </div>
  )
}
