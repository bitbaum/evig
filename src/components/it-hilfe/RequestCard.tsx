'use client'

/**
 * RequestCard Component
 *
 * Reusable card component for IT-Hilfe requests.
 * Eliminates duplicated code across IT-Hilfe pages.
 */

import { Link } from '@/i18n/navigation'
import { Wrench, MapPin, Users, Clock } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { getCategoryById, getUrgencyById, formatBudget, IT_HILFE } from '@/config/it-hilfe'
import { formatDateShort } from '@/lib/date-formats'

type ExpiryState =
  | { expiringSoon: true; type: 'expired' }
  | { expiringSoon: true; type: 'hours'; count: number }
  | null

function getExpiryState(expiresAt: string): ExpiryState {
  const now = Date.now()
  const expires = new Date(expiresAt).getTime()
  const hoursLeft = (expires - now) / (1000 * 60 * 60)
  if (hoursLeft <= 0) return { expiringSoon: true, type: 'expired' }
  if (hoursLeft <= 48) {
    const h = Math.floor(hoursLeft)
    return { expiringSoon: true, type: 'hours', count: h }
  }
  return null
}

export interface RequestCardData {
  id: string
  requesterId: string
  requesterName: string
  categoryId: string
  deviceBrand: string | null
  deviceModel: string | null
  title: string
  description: string
  urgency: string
  budgetType: string
  budgetAmountCents: number | null
  postalCode: string
  city: string
  canton: string
  serviceType: string
  skillsNeeded: string[]
  imageUrls: string[]
  status: string
  offerCount: number
  expiresAt: string
  createdAt: string
}

interface RequestCardProps {
  request: RequestCardData
  className?: string
}

export function RequestCard({ request, className = '' }: RequestCardProps) {
  const t = useTranslations('itHelp.card')
  const categoryConfig = getCategoryById(request.categoryId)
  const urgencyConfig = getUrgencyById(request.urgency)
  const CategoryIcon = categoryConfig?.icon || Wrench
  const expiryState = getExpiryState(request.expiresAt)

  const expiryLabel = expiryState
    ? expiryState.type === 'expired'
      ? t('expired')
      : expiryState.count <= 1
        ? t('timeLeftLessThanHour')
        : t('timeLeftHours', { count: expiryState.count })
    : null

  return (
    <Link
      href={IT_HILFE.routes.detail(request.id)}
      className={`card-shell overflow-hidden hover:border-strong transition-all group ${className}`}
    >
      {/* Card Header */}
      <div className="p-5 border-b border-subtle">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 ${categoryConfig?.color || 'bg-neutral-500'} rounded-lg`}>
            <CategoryIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            {expiryLabel && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-warning-50 text-warning-700">
                <Clock className="w-3 h-3" />
                {expiryLabel}
              </span>
            )}
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${urgencyConfig?.badgeClass || 'bg-surface-raised text-text-secondary'}`}>
              {urgencyConfig?.name || request.urgency}
            </span>
          </div>
        </div>

        <Heading level={3} className="font-semibold text-text-primary mb-2 group-hover:text-action transition-colors line-clamp-2">
          {request.title}
        </Heading>

        <p className="text-sm text-text-secondary line-clamp-2 mb-3">
          {request.description}
        </p>

        {/* Device info */}
        {(request.deviceBrand || request.deviceModel) && (
          <p className="text-xs text-text-tertiary mb-3">
            {[request.deviceBrand, request.deviceModel].filter(Boolean).join(' ')}
          </p>
        )}

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-text-tertiary">
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{request.city}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{t('offersCount', { count: request.offerCount })}</span>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 py-3 bg-surface-raised flex items-center justify-between">
        <span className="text-sm font-medium text-action">
          {formatBudget(request.budgetAmountCents)}
        </span>
        <span className="text-xs text-text-tertiary">
          {formatDateShort(request.createdAt)}
        </span>
      </div>
    </Link>
  )
}

/**
 * RequestCardGrid - Grid container for request cards
 */
interface RequestCardGridProps {
  children: React.ReactNode
  className?: string
}

export function RequestCardGrid({ children, className = '' }: RequestCardGridProps) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {children}
    </div>
  )
}
