'use client'

import { APPROVAL_STATUS_BADGES } from '@/config/approval-status'
import Heading from '@/components/ui/Heading'
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
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-5 cursor-pointer transition-all ${
            selectedId === submission.id
              ? 'border-teal-500 ring-2 ring-teal-500/20'
              : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium ${
                    submission.submission_type === 'idea'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                  }`}
                >
                  {submission.submission_type === 'idea' ? (
                    <Lightbulb className="w-3 h-3" />
                  ) : (
                    <FileText className="w-3 h-3" />
                  )}
                  {submission.submission_type === 'idea'
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
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded">
                    Von Admin bearbeitet
                  </span>
                )}
              </div>
              <Heading level={3} className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                {submission.title}
              </Heading>
              <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
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
            <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
              <Folder className="w-3 h-3 mr-1" />
              {submission.category_label || submission.category_name}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
