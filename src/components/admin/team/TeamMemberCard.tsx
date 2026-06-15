'use client'

/**
 * Team Member Card Component
 *
 * Displays a team member's summary in grid/list view.
 * Uses config for labels and colors (SSOT).
 */

import { Link } from '@/i18n/navigation'
import { Mail, Calendar, Eye, Edit2 } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import {
  getEmploymentTypeLabel,
  getEmploymentTypeColor,
  getDepartmentLabel,
  getDepartmentColor,
} from '@/config/team'
import { formatDateShort } from '@/lib/date-formats'
import { adminInteractive } from '@/lib/admin-ui'
import { cn } from '@/lib/utils'
import type { TeamMemberCardProps } from './types'

export function TeamMemberCard({ member, onView, onEdit }: TeamMemberCardProps) {
  const initials = member.user_name
    ? member.user_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : member.user_email[0].toUpperCase()

  const displayName = member.user_name || member.user_email.split('@')[0]

  return (
    <div className="rounded-lg border border-subtle bg-surface-base p-5 transition-colors hover:border-strong">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
          member.is_active ? adminInteractive.avatarActive : adminInteractive.avatarInactive,
        )}>
          <span className="font-medium text-sm">{initials}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Heading level={3} className="text-text-primary truncate">
              {displayName}
            </Heading>
            {!member.is_active && (
              <span className="px-2 py-0.5 text-xs rounded-sm bg-surface-overlay text-text-secondary">
                Inaktiv
              </span>
            )}
          </div>

          {member.position && (
            <p className="text-sm text-text-secondary mt-0.5">
              {member.position}
            </p>
          )}

          <div className="flex items-center gap-2 mt-1 text-xs text-text-tertiary">
            <Mail className="w-3 h-3" />
            <span className="truncate">{member.user_email}</span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {member.department && (
              <span className={`px-2 py-0.5 text-xs rounded-sm ${getDepartmentColor(member.department)}`}>
                {getDepartmentLabel(member.department)}
              </span>
            )}
            {member.employment_type && (
              <span className={`px-2 py-0.5 text-xs rounded-sm ${getEmploymentTypeColor(member.employment_type)}`}>
                {getEmploymentTypeLabel(member.employment_type)}
              </span>
            )}
          </div>

          {/* Skills preview */}
          {member.skills && member.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {member.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="px-2 py-0.5 bg-surface-raised text-text-secondary text-xs rounded-sm"
                >
                  {skill}
                </span>
              ))}
              {member.skills.length > 3 && (
                <span className="px-2 py-0.5 text-text-tertiary text-xs">
                  +{member.skills.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Start date */}
          {member.start_date && (
            <div className="flex items-center gap-1 mt-2 text-xs text-text-muted">
              <Calendar className="w-3 h-3" />
              <span>
                Seit {formatDateShort(member.start_date)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-subtle">
        <Link
          href={`/admin/team/${member.id}`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 min-h-11 text-sm text-text-secondary bg-surface-raised hover:bg-surface-overlay rounded-lg transition-colors"
          onClick={() => onView?.(member.id)}
        >
          <Eye className="w-4 h-4" />
          Ansehen
        </Link>
        <Link
          href={`/admin/team/${member.id}/edit`}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 min-h-11 text-sm text-action bg-action-muted hover:bg-action-muted rounded-lg transition-colors"
          onClick={() => onEdit?.(member.id)}
        >
          <Edit2 className="w-4 h-4" />
          Bearbeiten
        </Link>
      </div>
    </div>
  )
}
