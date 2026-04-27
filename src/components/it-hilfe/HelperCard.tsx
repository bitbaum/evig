'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { MapPin, Euro, Users, Sparkles, Star, CheckCircle } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { useTranslations } from 'next-intl'
import { getSkillById, BUDGET_TIERS } from '@/config/it-hilfe'
import { logger } from '@/lib/logger'
import { apiFetch } from '@/lib/api/client'
import { CONVERSATION_TYPES } from '@/config/database'

interface Helper {
  userId: string
  name: string
  bio: string | null
  hourlyRateCents: number | null
  acceptsGratis: boolean
  acceptsKulturlegi: boolean
  serviceTypes: string[]
  postalCode: string | null
  city: string | null
  canton: string | null
  maxTravelKm: number
  skills: string[]
  averageRating?: number | null
  totalHelpsCompleted?: number
}

interface HelperCardProps {
  helper: Helper
  requestId?: string
  requestTitle?: string
}

export function HelperCard({ helper, requestId, requestTitle }: HelperCardProps) {
  const t = useTranslations('components.helperCard')
  const [isContacting, setIsContacting] = useState(false)
  const [contactSuccess, setContactSuccess] = useState(false)

  const displayedSkills = helper.skills.slice(0, 5)
  const remainingSkillsCount = helper.skills.length - 5

  async function handleContact() {
    setIsContacting(true)

    try {
      // Prepare initial message
      let initialMessage = `Hallo ${helper.name},\n\n`

      if (requestId && requestTitle) {
        initialMessage += `ich habe deine Fähigkeiten gesehen und denke, du könntest mir helfen: "${requestTitle}"\n\nLink: ${window.location.origin}/it-hilfe/${requestId}\n\n`
      } else {
        initialMessage += `ich brauche IT-Hilfe und habe gesehen, dass du folgende Fähigkeiten hast:\n\n${displayedSkills.map(skillId => {
          const skill = getSkillById(skillId)
          return skill ? `- ${skill.name}` : ''
        }).filter(Boolean).join('\n')}\n\nKönntest du mir helfen?`
      }

      const { data, error: apiError } = await apiFetch<{ conversation_id: string }>('/api/messages', {
        method: 'POST',
        body: {
          recipient_id: helper.userId,
          content: initialMessage,
          context_type: CONVERSATION_TYPES.IT_HILFE,
          context_id: requestId || null,
        },
      })

      if (apiError) {
        throw new Error(apiError)
      }

      logger.info('Contacted helper', {
        helperId: helper.userId,
        conversationId: data?.conversation_id,
      })

      setContactSuccess(true)
    } catch (error) {
      logger.error('Error contacting helper', { error, helperId: helper.userId })
    } finally {
      setIsContacting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Helper Info */}
      <div className="mb-4">
        <Link href={`/techniker/${helper.userId}`} className="hover:underline">
          <Heading level={3} className="text-lg font-semibold text-gray-900 mb-2">{helper.name}</Heading>
        </Link>
        {helper.bio && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{helper.bio}</p>
        )}
      </div>

      {/* Rating & Help Count */}
      {(helper.averageRating || helper.totalHelpsCompleted) ? (
        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
          {helper.averageRating && (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              {helper.averageRating.toFixed(1)}
            </span>
          )}
          {helper.totalHelpsCompleted ? (
            <span>{t('helps', { count: helper.totalHelpsCompleted })}</span>
          ) : null}
        </div>
      ) : null}

      {/* Location */}
      {(helper.city || helper.canton) && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          <MapPin className="w-4 h-4" />
          <span>
            {helper.city && helper.canton
              ? `${helper.city}, ${helper.canton}`
              : helper.canton || helper.city}
          </span>
        </div>
      )}

      {/* Skills */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {displayedSkills.map((skillId) => {
            const skill = getSkillById(skillId)
            if (!skill) return null
            return (
              <span
                key={skillId}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
              >
                {skill.name}
              </span>
            )
          })}
          {remainingSkillsCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              +{remainingSkillsCount}
            </span>
          )}
        </div>
      </div>

      {/* Pricing Info */}
      <div className="flex flex-wrap gap-2 mb-4">
        {helper.acceptsGratis && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${BUDGET_TIERS[0].badgeClass}`}>
            <Users className="w-3 h-3" />
            {t('gratis')}
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

      {/* Contact Button */}
      {contactSuccess ? (
        <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-2.5 rounded-lg text-sm font-medium">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {t('messageSent', { name: helper.name })}
        </div>
      ) : (
        <button
          onClick={handleContact}
          disabled={isContacting}
          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isContacting ? t('contacting') : t('contact')}
        </button>
      )}
    </div>
  )
}
