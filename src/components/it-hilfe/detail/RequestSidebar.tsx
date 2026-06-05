'use client'

import { useState } from 'react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  Clock,
  Calendar,
  User,
  MessageSquare,
  XCircle,
  Wrench,
  Users,
  Pencil,
} from 'lucide-react'
import { formatDate } from '@/lib/date-formats'
import { formatBudget, getServiceTypeById, REQUEST_STATUS } from '@/config/it-hilfe'
import type { ITHilfeRequest } from './types'
import { ROUTES } from '@/config/routes'

interface RequestSidebarProps {
  request: ITHilfeRequest
  conversationId: string | null
  hasSession: boolean
  onShowMessages: () => void
  onStatusChange: (status: string) => void
}

export function RequestSidebar({
  request,
  conversationId,
  hasSession,
  onShowMessages,
  onStatusChange,
}: RequestSidebarProps) {
  const t = useTranslations('itHelp.detail')
  const serviceConfig = getServiceTypeById(request.serviceType)
  // Stable snapshot of "now" — Date.now() must not be called directly in render (react-hooks/purity)
  const [now] = useState(Date.now)

  // Compute time remaining as structured data, then format via t()
  function getTimeRemaining(): string | null {
    const expires = new Date(request.expiresAt).getTime()
    const msLeft = expires - now
    if (msLeft <= 0) return t('expiredStatus')
    const days = Math.floor(msLeft / (1000 * 60 * 60 * 24))
    const hours = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 7) return null
    if (days > 0) return t('timeLeftDays', { count: days })
    if (hours > 0) return t('timeLeftHours', { count: hours })
    return t('timeLeftLessThanHour')
  }

  const timeRemaining = getTimeRemaining()

  return (
    <div className="space-y-6">
      {/* Request Info */}
      <div className="card-shell p-6">
        <Heading level={3} className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-4">
          {t('sidebarDetails')}
        </Heading>

        <div className="space-y-4">
          {/* Location */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-text-muted mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-text-tertiary">{t('locationLabel')}</p>
              <p className="font-medium text-text-primary">
                {request.postalCode} {request.city}
              </p>
              <p className="text-sm text-text-secondary">{request.canton}</p>
            </div>
          </div>

          {/* Budget */}
          <div className="flex items-start gap-3">
            <Wrench className="w-5 h-5 text-text-muted mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-text-tertiary">{t('budgetLabel')}</p>
              <p className="font-medium text-action">
                {formatBudget(request.budgetAmountCents)}
              </p>
            </div>
          </div>

          {/* Service Type */}
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-text-muted mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-text-tertiary">{t('serviceTypeLabel')}</p>
              <p className="font-medium text-text-primary">
                {serviceConfig?.name || request.serviceType}
              </p>
            </div>
          </div>

          {/* Offers */}
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-text-muted mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-text-tertiary">{t('offersLabel')}</p>
              <p className="font-medium text-text-primary">
                {t('offersCount', { count: request.offerCount })}
              </p>
            </div>
          </div>

          {/* Created */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-text-muted mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-text-tertiary">{t('createdLabel')}</p>
              <p className="font-medium text-text-primary">
                {formatDate(request.createdAt)}
              </p>
            </div>
          </div>

          {/* Expires */}
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-text-muted mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm text-text-tertiary">{t('expiresLabel')}</p>
              <p className="font-medium text-text-primary">
                {formatDate(request.expiresAt)}
              </p>
              {timeRemaining && (
                <p className={`text-xs mt-0.5 ${timeRemaining === t('expiredStatus') ? 'text-error-600 font-medium' : 'text-warning-600'}`}>
                  {timeRemaining}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Requester Info */}
      <div className="card-shell p-6">
        <Heading level={3} className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-4">
          {t('requesterSection')}
        </Heading>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-surface-overlay rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-text-tertiary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-text-primary">{request.requesterName}</p>
            {request.isOwner && request.requesterEmail && (
              <p className="text-sm text-text-tertiary">{request.requesterEmail}</p>
            )}
          </div>
        </div>
      </div>

      {/* Message Button */}
      {conversationId && hasSession && (
        <div className="card-shell p-6">
          <Button onClick={onShowMessages} variant="primary" className="w-full">
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            {t('sendMessage')}
          </Button>
        </div>
      )}

      {/* Owner Actions */}
      {request.isOwner && (
        <div className="card-shell p-6">
          <Heading level={3} className="text-sm font-medium text-text-tertiary uppercase tracking-wider mb-4">
            {t('actionsSection')}
          </Heading>
          <div className="space-y-2">
            {request.status === REQUEST_STATUS.OPEN && (
              <Button as={Link} href={`/it-hilfe/${request.id}/edit`} variant="primary" className="w-full justify-center">
                <Pencil className="w-4 h-4" />
                {t('editRequest')}
              </Button>
            )}
            {(request.status === REQUEST_STATUS.OPEN || request.status === REQUEST_STATUS.MATCHED) && (
              <Button
                variant="destructive-ghost"
                onClick={() => onStatusChange(REQUEST_STATUS.CANCELLED)}
                className="block w-full py-3 px-4 min-h-touch bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400 rounded-lg text-center font-medium hover:bg-error-100 dark:hover:bg-error-900/30 h-auto"
              >
                <XCircle className="w-4 h-4 inline-block mr-2" />
                {t('cancelRequest')}
              </Button>
            )}
            <Button as={Link} href={ROUTES.public.itHilfeMy} variant="secondary" className="w-full justify-center">
              {t('allMyRequests')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
