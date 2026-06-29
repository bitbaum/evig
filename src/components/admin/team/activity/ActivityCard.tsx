'use client'

/**
 * Activity Card Component
 *
 * Displays a single activity item from the unified stream
 */

import { CheckCircle, Flag, FileText, Megaphone, HelpCircle, Clock } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import {
  getActivityUpdateTypeColor,
  getActivityCategoryLabel,
  getHelpRequestUrgencyColor,
  ACTIVITY_SOURCE_LABELS,
} from '@/config/activity'
import { formatRelativeTime } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { URGENCY_DEFAULT } from '@/config/it-hilfe'
import type { UnifiedActivity } from './types'

interface ActivityCardProps {
  activity: UnifiedActivity
}

function getSourceIcon(sourceType: string): JSX.Element | null {
  switch (sourceType) {
    case 'task_completion':
      return <CheckCircle className="w-5 h-5 text-action" />
    case 'activity_update':
      return null // handled separately via getActivityUpdateIcon
    case 'help_request':
      return <HelpCircle className="w-5 h-5 text-warning-500" />
    case 'focus_update':
      return <Clock className="w-5 h-5 text-action" />
    default:
      return <FileText className="w-5 h-5 text-text-tertiary" />
  }
}

function getActivityUpdateIcon(updateType: string): JSX.Element {
  switch (updateType) {
    case 'accomplishment':
      return <CheckCircle className="w-5 h-5 text-action" />
    case 'milestone':
      return <Flag className="w-5 h-5 text-action" />
    case 'note':
      return <FileText className="w-5 h-5 text-text-tertiary" />
    case 'announcement':
      return <Megaphone className="w-5 h-5 text-action" />
    default:
      return <FileText className="w-5 h-5 text-text-tertiary" />
  }
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const displayName = activity.user_name || activity.user_email.split('@')[0]

  // Extract metadata with type safety
  const metadata = activity.metadata || {}
  const updateType = String(metadata.update_type || 'note')
  const urgency = String(metadata.urgency || URGENCY_DEFAULT)
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
  let badgeColor = 'bg-surface-raised text-text-primary'
  if (activity.source_type === 'activity_update') {
    badgeColor = getActivityUpdateTypeColor(updateType)
  } else if (activity.source_type === 'help_request') {
    badgeColor = getHelpRequestUrgencyColor(urgency)
  } else if (activity.source_type === 'task_completion') {
    badgeColor = 'bg-action-muted text-action-muted'
  }

  return (
    <div className="bg-surface-base rounded-lg border border-subtle p-4 hover:border-strong transition-shadow">
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar name={activity.user_name || activity.user_email} size="md" colorClassName="bg-action text-white" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-text-primary">{displayName}</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${badgeColor}`}>
              {ACTIVITY_SOURCE_LABELS[activity.source_type as keyof typeof ACTIVITY_SOURCE_LABELS]}
            </span>
            {activity.category && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-surface-raised text-text-secondary">
                {getActivityCategoryLabel(activity.category)}
              </span>
            )}
          </div>

          {/* Title */}
          <Heading level={4} className="mt-1 text-text-primary flex items-center gap-2">
            {icon}
            {activity.title}
          </Heading>

          {/* Description */}
          {activity.description && (
            <p className="mt-1 text-sm text-text-secondary line-clamp-2">
              {activity.description}
            </p>
          )}

          {/* Metadata */}
          {activity.source_type === 'task_completion' && durationMinutes && (
            <p className="mt-1 text-xs text-text-tertiary dark:text-text-tertiary">
              Dauer: {durationMinutes} Min.
            </p>
          )}

          {activity.source_type === 'help_request' && action === 'resolved' && (
            <p className="mt-1 text-xs text-action">
              Anfrage gelöst
            </p>
          )}

          {/* Timestamp */}
          <p className="mt-2 text-xs text-text-muted">
            {formatRelativeTime(activity.occurred_at)}
          </p>
        </div>
      </div>
    </div>
  )
}
