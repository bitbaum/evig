'use client'

/**
 * Activity Card Component
 *
 * Displays a single activity item from the unified stream
 */

import { CheckCircle, Flag, FileText, Megaphone, HelpCircle, Clock } from 'lucide-react'
import Heading from '@/components/ui/Heading'
import {
  getActivityUpdateTypeColor,
  getActivityCategoryLabel,
  getHelpRequestUrgencyColor,
  ACTIVITY_SOURCE_LABELS,
} from '@/config/activity'
import { formatRelativeTime } from '@/lib/utils'
import type { UnifiedActivity } from './types'

interface ActivityCardProps {
  activity: UnifiedActivity
}

function getSourceIcon(sourceType: string): JSX.Element | null {
  switch (sourceType) {
    case 'task_completion':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'activity_update':
      return null // handled separately via getActivityUpdateIcon
    case 'help_request':
      return <HelpCircle className="w-5 h-5 text-yellow-500" />
    case 'focus_update':
      return <Clock className="w-5 h-5 text-blue-500" />
    default:
      return <FileText className="w-5 h-5 text-gray-500" />
  }
}

function getActivityUpdateIcon(updateType: string): JSX.Element {
  switch (updateType) {
    case 'accomplishment':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'milestone':
      return <Flag className="w-5 h-5 text-purple-500" />
    case 'note':
      return <FileText className="w-5 h-5 text-gray-500" />
    case 'announcement':
      return <Megaphone className="w-5 h-5 text-blue-500" />
    default:
      return <FileText className="w-5 h-5 text-gray-500" />
  }
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const initials = activity.user_name
    ? activity.user_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
    : activity.user_email[0].toUpperCase()

  const displayName = activity.user_name || activity.user_email.split('@')[0]

  // Extract metadata with type safety
  const metadata = activity.metadata || {}
  const updateType = String(metadata.update_type || 'note')
  const urgency = String(metadata.urgency || 'normal')
  const durationMinutes = metadata.duration_minutes ? Number(metadata.duration_minutes) : null
  const action = String(metadata.action || '')

  // Determine icon based on source type
  let icon: JSX.Element | null = null
  if (activity.source_type === 'activity_update') {
    icon = getActivityUpdateIcon(updateType)
  } else {
    icon = getSourceIcon(activity.source_type)
  }

  // Get badge color
  let badgeColor = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  if (activity.source_type === 'activity_update') {
    badgeColor = getActivityUpdateTypeColor(updateType)
  } else if (activity.source_type === 'help_request') {
    badgeColor = getHelpRequestUrgencyColor(urgency)
  } else if (activity.source_type === 'task_completion') {
    badgeColor = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-medium text-sm">{initials}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 dark:text-gray-100">{displayName}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${badgeColor}`}>
              {ACTIVITY_SOURCE_LABELS[activity.source_type as keyof typeof ACTIVITY_SOURCE_LABELS]}
            </span>
            {activity.category && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                {getActivityCategoryLabel(activity.category)}
              </span>
            )}
          </div>

          {/* Title */}
          <Heading level={4} className="mt-1 text-gray-800 dark:text-gray-200 flex items-center gap-2">
            {icon}
            {activity.title}
          </Heading>

          {/* Description */}
          {activity.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {activity.description}
            </p>
          )}

          {/* Metadata */}
          {activity.source_type === 'task_completion' && durationMinutes && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Dauer: {durationMinutes} Min.
            </p>
          )}

          {activity.source_type === 'help_request' && action === 'resolved' && (
            <p className="mt-1 text-xs text-green-600 dark:text-green-400">
              Anfrage gelöst
            </p>
          )}

          {/* Timestamp */}
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            {formatRelativeTime(activity.occurred_at)}
          </p>
        </div>
      </div>
    </div>
  )
}
