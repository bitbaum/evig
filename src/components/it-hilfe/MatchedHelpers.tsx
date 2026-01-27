'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, TrendingUp, MapPin, Award } from 'lucide-react'
import { logger } from '@/lib/logger'
import { getSkillById } from '@/config/it-hilfe'
import { CONVERSATION_TYPES } from '@/config/database'
import { HelperCard } from './HelperCard'

interface MatchedHelper {
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

interface MatchedHelpersProps {
  requestId: string
  requestTitle?: string
}

export function MatchedHelpers({ requestId, requestTitle }: MatchedHelpersProps) {
  const [matches, setMatches] = useState<MatchedHelper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true)
        const response = await fetch(`/api/it-hilfe/requests/${requestId}/matches`)

        if (!response.ok) {
          throw new Error('Fehler beim Laden der passenden Helfer')
        }

        const data = await response.json()

        if (data.success && data.data) {
          setMatches(data.data.matches || [])
        } else {
          throw new Error(data.error || 'Unbekannter Fehler')
        }
      } catch (err) {
        logger.error('Error fetching matched helpers', { error: err, requestId })
        setError(err instanceof Error ? err.message : 'Fehler beim Laden')
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [requestId])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Passende Helfer werden gesucht...</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
        <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Noch keine passenden Helfer gefunden
        </h3>
        <p className="text-gray-600 text-sm">
          Deine Anfrage ist öffentlich sichtbar. Helfer können dir Angebote senden.
        </p>
      </div>
    )
  }

  // Show top 5 matches
  const topMatches = matches.slice(0, 5)
  const maxScore = matches[0]?.matchScore || 1

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Top {topMatches.length} passende Helfer
        </h3>
      </div>

      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-gray-700">
              Diese Helfer passen besonders gut zu deiner Anfrage basierend auf Fähigkeiten, Standort und Budget.
            </p>
          </div>
        </div>
      </div>

      {/* Matched Helpers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {topMatches.map((helper, index) => {
          // Convert to format expected by HelperCard
          const helperForCard = {
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
            <div key={helper.userId} className="relative">
              {/* Match Badge */}
              {index === 0 && (
                <div className="absolute -top-2 -right-2 z-10 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                  <Award className="w-3 h-3" />
                  Top Match
                </div>
              )}

              {/* Match Score Bar */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span className="font-medium">{matchPercentage}% Match</span>
                  <span className="text-gray-400">{helper.matchScore} Punkte</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${matchPercentage}%` }}
                  />
                </div>
              </div>

              {/* Match Reasons */}
              {helper.matchReasons.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1">
                  {helper.matchReasons.slice(0, 3).map((reason, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}

              {/* Helper Card */}
              <HelperCard
                helper={helperForCard}
                requestId={requestId}
                requestTitle={requestTitle}
              />
            </div>
          )
        })}
      </div>

      {/* See All Link */}
      {matches.length > 5 && (
        <div className="text-center mt-6">
          <a
            href="/it-hilfe/helfer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Alle {matches.length} Helfer durchsuchen
            <TrendingUp className="w-4 h-4" />
          </a>
        </div>
      )}
    </div>
  )
}
