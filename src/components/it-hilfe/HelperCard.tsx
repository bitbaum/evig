'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { MapPin, Euro, Users, Sparkles, Star, CheckCircle } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { getSkillById, getBudgetTierById, BUDGET_TIER } from '@/config/it-hilfe'
import { logger } from '@/lib/logger'
import { apiFetch } from '@/lib/api/client'
import { formatCentsToChf } from '@/lib/pricing'
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
  /**
   * Field name mirrors the DB column (repairerProfiles.totalJobsCompleted)
   * and the /api/technicians response. Was previously aliased here as
   * `totalHelpsCompleted` which never populated because the API never
   * sends that key — every helper card rendered without a job count
   * even though the data was available. (OOO.1)
   */
  totalJobsCompleted?: number
  /** Number of published reviews. Surfaced next to the rating. */
  totalReviews?: number
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
    <div className="card-shell p-6 hover:border-strong transition-all">
      {/* Helper Info */}
      <div className="mb-4">
        <Link href={`/techniker/${helper.userId}`} className="hover:underline">
          <Heading level={3} className="text-lg font-semibold text-text-primary mb-2">{helper.name}</Heading>
        </Link>
        {helper.bio && (
          <p className="text-text-secondary text-sm line-clamp-2 mb-3">{helper.bio}</p>
        )}
      </div>

      {/* Rating & Help Count */}
      {(helper.averageRating || helper.totalJobsCompleted) ? (
        <div className="flex items-center gap-3 text-sm text-text-secondary mb-3">
          {helper.averageRating && Number(helper.averageRating) > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-warning-400 text-warning-400" />
              {Number(helper.averageRating).toFixed(1)}
              {helper.totalReviews ? (
                <span className="text-text-muted">({helper.totalReviews})</span>
              ) : null}
            </span>
          )}
          {helper.totalJobsCompleted ? (
            <span>{t('helps', { count: helper.totalJobsCompleted })}</span>
          ) : null}
        </div>
      ) : null}

      {/* Location */}
      {(helper.city || helper.canton) && (
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-3">
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
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface-raised text-text-secondary"
              >
                {skill.name}
              </span>
            )
          })}
          {remainingSkillsCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-surface-raised text-text-secondary">
              +{remainingSkillsCount}
            </span>
          )}
        </div>
      </div>

      {/* Pricing Info */}
      <div className="flex flex-wrap gap-2 mb-4">
        {helper.acceptsGratis && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getBudgetTierById(BUDGET_TIER.GRATIS)?.badgeClass ?? ''}`}>
            <Users className="w-3 h-3" />
            {t('gratis')}
          </span>
        )}
        {helper.acceptsKulturlegi && (
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getBudgetTierById(BUDGET_TIER.KULTURLEGI)?.badgeClass ?? ''}`}>
            <Sparkles className="w-3 h-3" />
            KulturLegi
          </span>
        )}
        {helper.hourlyRateCents && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-action-muted text-action">
            <Euro className="w-3 h-3" />
            {formatCentsToChf(helper.hourlyRateCents)}/h
          </span>
        )}
      </div>

      {/* Contact Button */}
      {contactSuccess ? (
        <div className="flex items-center gap-2 text-action bg-action-muted px-4 py-2.5 rounded-lg text-sm font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {t('messageSent', { name: helper.name })}
        </div>
      ) : (
        <Button onClick={handleContact} disabled={isContacting} variant="primary" className="w-full">
          {isContacting ? t('contacting') : t('contact')}
        </Button>
      )}
    </div>
  )
}
