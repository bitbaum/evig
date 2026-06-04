'use client'

import { APPROVAL_STATUS_BADGES, BLOG_SUBMISSION_TYPE } from '@/config/approval-status'
import Heading from '@/components/admin/AdminHeading'
import { formatDateTime } from '@/lib/date-formats'
import {
  Lightbulb,
  FileText,
  User,
  Calendar,
  Folder,
} from 'lucide-react'
import type { Submission } from './types'

interface SubmissionListProps {
  submissions: Submission[]
  selectedId: string | null
  onSelect: (submission: Submission) => void
}

export function SubmissionList({ submissions, selectedId, onSelect }: SubmissionListProps) {
  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          onClick={() => onSelect(submission)}
          className={`bg-surface-base rounded-xl shadow-xs border p-5 cursor-pointer transition-all ${
            selectedId === submission.id
              ? 'border-action ring-2 ring-action/20'
              : 'border-subtle dark:border-white/6 hover:border-strong'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${
                    submission.submission_type === BLOG_SUBMISSION_TYPE.IDEA
                      ? 'bg-surface-raised text-text-primary'
                      : 'bg-action-muted text-action-muted'
                  }`}
                >
                  {submission.submission_type === BLOG_SUBMISSION_TYPE.IDEA ? (
                    <Lightbulb className="w-3 h-3" />
                  ) : (
                    <FileText className="w-3 h-3" />
                  )}
                  {submission.submission_type === BLOG_SUBMISSION_TYPE.IDEA
                    ? 'Idee'
                    : 'Entwurf'}
                </span>
                <span
                  className={`px-2 py-1 text-xs rounded-full font-medium ${
                    APPROVAL_STATUS_BADGES[submission.status]?.bg || ''
                  } ${APPROVAL_STATUS_BADGES[submission.status]?.color || ''}`}
                >
                  {APPROVAL_STATUS_BADGES[submission.status]?.label ||
                    submission.status}
                </span>
                {submission.last_edited_at && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-surface-raised text-text-primary rounded-sm">
                    Von Admin bearbeitet
                  </span>
                )}
              </div>
              <Heading level={3} className="font-semibold text-text-primary mb-1 line-clamp-2">
                {submission.title}
              </Heading>
              <div className="flex items-center gap-3 text-sm text-text-tertiary">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {submission.submitter_name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDateTime(submission.submitted_at)}
                </span>
              </div>
            </div>
          </div>
          {(submission.category_label || submission.category_name) && (
            <span className="inline-flex items-center px-2 py-1 bg-surface-raised text-text-secondary text-xs rounded-sm">
              <Folder className="w-3 h-3 mr-1" />
              {submission.category_label || submission.category_name}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
