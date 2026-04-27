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
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    case 'high':
      return <AlertTriangle className="w-4 h-4 text-orange-500" />
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
      className={`bg-white dark:bg-gray-800 rounded-xl border p-4 ${
        isResolved
          ? 'border-gray-200 dark:border-gray-700 opacity-75'
          : request.urgency === 'urgent'
            ? 'border-red-300 dark:border-red-700'
            : request.urgency === 'high'
              ? 'border-orange-300 dark:border-orange-700'
              : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            request.is_broadcast
              ? 'bg-yellow-100 dark:bg-yellow-900/30'
              : 'bg-blue-100 dark:bg-blue-900/30'
          }`}
        >
          {request.is_broadcast ? (
            <Users className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          ) : (
            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title with urgency */}
          <div className="flex items-center gap-2 flex-wrap">
            {getUrgencyIcon(request.urgency)}
            <Heading level={4} className="text-gray-900 dark:text-gray-100">{request.title}</Heading>
          </div>

          {/* Requester */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            Von{' '}
            <span className="font-medium">
              {isOwnRequest ? 'dir' : requesterDisplayName}
            </span>
            {request.is_broadcast ? (
              <span className="ml-1 text-yellow-600 dark:text-yellow-400">an alle</span>
            ) : request.requested_user_name ? (
              <span className="ml-1">
                an{' '}
                <span className="font-medium">{request.requested_user_name}</span>
              </span>
            ) : null}
          </p>

          {/* Description */}
          {request.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
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
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                {getActivityCategoryLabel(request.category)}
              </span>
            )}
          </div>

          {/* Resolution info */}
          {isResolved && request.resolved_by_name && (
            <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-700 dark:text-green-300 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Gelöst von {request.resolved_by_name}
              </p>
              {request.resolution_notes && (
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  {request.resolution_notes}
                </p>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-1 mt-3 text-xs text-gray-400 dark:text-gray-500">
            <Clock className="w-3 h-3" />
            {formatRelativeTime(request.created_at)}
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (canResolve || canTakeOn) && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {canTakeOn && (
            <button
              onClick={() => onTakeOn?.(request.id)}
              disabled={isTakingOn}
              className="flex-1 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
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
              className="flex-1 px-3 py-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
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
