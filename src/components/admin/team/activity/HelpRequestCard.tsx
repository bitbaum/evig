'use client'

/**
 * Help Request Card Component
 *
 * Displays a single help request with status and actions
 */

import { Users, User, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import {
  getHelpRequestUrgencyLabel,
  getHelpRequestUrgencyColor,
  getHelpRequestStatusLabel,
  getHelpRequestStatusColor,
  getActivityCategoryLabel,
  HELP_REQUEST_STATUSES,
} from '@/config/activity'
import { URGENCY } from '@/config/it-hilfe'
import { formatRelativeTime } from '@/lib/utils'
import type { HelpRequest } from './types'

interface HelpRequestCardProps {
  request: HelpRequest
  onResolve?: (id: string) => void
  onTakeOn?: (id: string) => void
  isResolving?: boolean
  isTakingOn?: boolean
  showActions?: boolean
  currentUserEmail?: string
}

function getUrgencyIcon(urgency: string) {
  switch (urgency) {
    case 'urgent':
      return <AlertTriangle className="w-4 h-4 text-error-500" />
    case 'high':
      return <AlertTriangle className="w-4 h-4 text-secondary-500" />
    default:
      return null
  }
}

export function HelpRequestCard({
  request,
  onResolve,
  onTakeOn,
  isResolving = false,
  isTakingOn = false,
  showActions = true,
  currentUserEmail,
}: HelpRequestCardProps) {
  const requesterInitials = request.requester_name
    ? request.requester_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
    : request.requester_email[0].toUpperCase()

  const requesterDisplayName = request.requester_name || request.requester_email.split('@')[0]

  const isOpen = request.status === HELP_REQUEST_STATUSES.OPEN
  const isInProgress = request.status === HELP_REQUEST_STATUSES.IN_PROGRESS
  const isResolved = request.status === HELP_REQUEST_STATUSES.RESOLVED
  const canResolve = (isOpen || isInProgress) && onResolve
  const canTakeOn = isOpen && request.is_broadcast && onTakeOn

  // Check if current user is the requester
  const isOwnRequest = currentUserEmail && request.requester_email === currentUserEmail

  return (
    <div
      className={`bg-white dark:bg-neutral-900 rounded-xl border p-4 ${
        isResolved
          ? 'border-neutral-200 dark:border-white/[0.06] opacity-75'
          : request.urgency === URGENCY.URGENT
            ? 'border-error-300 dark:border-error-700'
            : request.urgency === URGENCY.HIGH
              ? 'border-secondary-300 dark:border-secondary-700'
              : 'border-neutral-200 dark:border-white/[0.06]'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            request.is_broadcast
              ? 'bg-warning-100 dark:bg-warning-900/30'
              : 'bg-primary-100 dark:bg-primary-900/30'
          }`}
        >
          {request.is_broadcast ? (
            <Users className="w-5 h-5 text-warning-600 dark:text-warning-400" />
          ) : (
            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title with urgency */}
          <div className="flex items-center gap-2 flex-wrap">
            {getUrgencyIcon(request.urgency)}
            <Heading level={4} className="text-neutral-900 dark:text-neutral-100">{request.title}</Heading>
          </div>

          {/* Requester */}
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
            Von{' '}
            <span className="font-medium">
              {isOwnRequest ? 'dir' : requesterDisplayName}
            </span>
            {request.is_broadcast ? (
              <span className="ml-1 text-warning-600 dark:text-warning-400">an alle</span>
            ) : request.requested_user_name ? (
              <span className="ml-1">
                an{' '}
                <span className="font-medium">{request.requested_user_name}</span>
              </span>
            ) : null}
          </p>

          {/* Description */}
          {request.description && (
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
              {request.description}
            </p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className={`px-2 py-0.5 text-xs rounded-full ${getHelpRequestStatusColor(request.status)}`}>
              {getHelpRequestStatusLabel(request.status)}
            </span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${getHelpRequestUrgencyColor(request.urgency)}`}>
              {getHelpRequestUrgencyLabel(request.urgency)}
            </span>
            {request.category && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
                {getActivityCategoryLabel(request.category)}
              </span>
            )}
          </div>

          {/* Resolution info */}
          {isResolved && request.resolved_by_name && (
            <div className="mt-3 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <p className="text-sm text-primary-700 dark:text-primary-300 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Gelöst von {request.resolved_by_name}
              </p>
              {request.resolution_notes && (
                <p className="mt-1 text-xs text-primary-600 dark:text-primary-400">
                  {request.resolution_notes}
                </p>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-1 mt-3 text-xs text-neutral-400 dark:text-neutral-500">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(request.created_at)}
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (canResolve || canTakeOn) && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-200 dark:border-white/[0.06]">
          {canTakeOn && (
            <button
              onClick={() => onTakeOn?.(request.id)}
              disabled={isTakingOn}
              className="flex-1 px-3 py-2 text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isTakingOn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <User className="w-4 h-4" />
              )}
              Übernehmen
            </button>
          )}
          {canResolve && (
            <button
              onClick={() => onResolve?.(request.id)}
              disabled={isResolving}
              className="flex-1 px-3 py-2 text-sm text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isResolving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Als gelöst markieren
            </button>
          )}
        </div>
      )}
    </div>
  )
}
