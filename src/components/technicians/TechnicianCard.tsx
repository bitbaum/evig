'use client'

import { Link } from '@/i18n/navigation'
import { MapPin, User, CheckCircle, Users, Sparkles, Euro } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { StarRating } from '@/components/ui/StarRating'
import { Button } from '@/components/ui/button'
import { type TechnicianProfile } from './types'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'
import { formatCentsToChf } from '@/lib/pricing'

interface TechnicianCardProps {
  technician: TechnicianProfile
}

export function TechnicianCard({ technician }: TechnicianCardProps) {
  const t = useTranslations('components.technicianCard')
  const isProfessional = technician.profileTier === REPAIRER_PROFILE_TIER.PROFESSIONAL
  const displayedSkills = technician.skills.slice(0, 5)
  const remainingSkillsCount = technician.skills.length - 5

  return (
    <div className="card-shell hover:border-neutral-300 transition-all">
      {/* Header */}
      <div className="p-6 border-b border-neutral-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-neutral-500" />
            </div>
            <div>
              <Link href={`/techniker/${technician.id}`} className="hover:underline">
                <Heading level={3} className="font-semibold text-neutral-900">
                  {isProfessional
                    ? (technician.businessName ?? technician.name)
                    : technician.name}
                </Heading>
              </Link>
              {isProfessional && technician.businessName && (
                <p className="text-sm text-neutral-500">{technician.name}</p>
              )}
            </div>
          </div>

          {technician.isVerified && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 flex-shrink-0">
              <CheckCircle className="w-3 h-3" />
              {t('verified')}
            </span>
          )}
        </div>

        {/* Rating */}
        {technician.averageRating !== null && (
          <div className="flex items-center gap-2 mb-3">
            <StarRating value={technician.averageRating} size="sm" />
            <span className="text-sm text-neutral-600">
              {technician.averageRating.toFixed(1)}
            </span>
            {technician.totalJobsCompleted > 0 && (
              <span className="text-sm text-neutral-500">
                ({t('jobsCompleted', { count: technician.totalJobsCompleted })})
              </span>
            )}
          </div>
        )}

        {/* Bio */}
        {technician.bio && (
          <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{technician.bio}</p>
        )}

        {/* Professional: services offered */}
        {isProfessional && technician.servicesOffered && technician.servicesOffered.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {technician.servicesOffered.slice(0, 3).map((service) => (
              <span
                key={service}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-neutral-100 text-neutral-800"
              >
                {service}
              </span>
            ))}
            {technician.servicesOffered.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-neutral-100 text-neutral-800">
                +{technician.servicesOffered.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Community: skill badges */}
        {!isProfessional && technician.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {displayedSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700"
              >
                {skill}
              </span>
            ))}
            {remainingSkillsCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                +{remainingSkillsCount}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-6">
        {/* Location */}
        {(technician.city || technician.postalCode) && (
          <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>
              {[technician.postalCode, technician.city].filter(Boolean).join(' ')}
            </span>
          </div>
        )}

        {/* Pricing badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {technician.acceptsGratis && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
              <Users className="w-3 h-3" />
              {t('gratis')}
            </span>
          )}
          {technician.acceptsKulturlegi && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-700">
              <Sparkles className="w-3 h-3" />
              KulturLegi
            </span>
          )}
          {technician.hourlyRateCents && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400">
              <Euro className="w-3 h-3" />
              {formatCentsToChf(technician.hourlyRateCents)}/h
            </span>
          )}
          {!technician.hourlyRateCents && !technician.acceptsGratis && (
            <span className="text-sm text-neutral-500">{t('priceOnRequest')}</span>
          )}
        </div>

        {/* CTA */}
        <Button as={Link} href={`/techniker/${technician.id}`} variant="primary" className="w-full justify-center">
          {t('viewProfile')}
        </Button>
      </div>
    </div>
  )
}

interface TechnicianCardGridProps {
  children: React.ReactNode
}

export function TechnicianCardGrid({ children }: TechnicianCardGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {children}
    </div>
  )
}
