'use client'

import { useState } from 'react'
import { APPROVAL_STATUS } from '@/config/approval-status'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatDateTime } from '@/lib/date-formats'
import Heading from '@/components/admin/AdminHeading'
import { Link } from '@/i18n/navigation'
import {
  Eye,
  Check,
  X,
  Send,
  MessageSquare,
  Calendar,
  User,
  Mail,
  Tag,
  Folder,
  Loader2,
  ExternalLink,
  Trash2,
  Edit,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Submission, SubmissionAction } from './types'

interface SubmissionDetailProps {
  submission: Submission | null
  actionLoading: string | null
  onAction: (action: SubmissionAction, submissionId: string) => void
  onShowRejectModal: () => void
  onShowChangesModal: () => void
  onShowEditModal: () => void
}

export function SubmissionDetail({
  submission,
  actionLoading,
  onAction,
  onShowRejectModal,
  onShowChangesModal,
  onShowEditModal,
}: SubmissionDetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!submission) {
    return (
      <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-12 text-center">
        <Eye className="w-12 h-12 text-text-muted mx-auto mb-4" />
        <p className="text-text-secondary">
          Wähle eine Einreichung aus, um Details anzuzeigen
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface-base rounded-xl shadow-xs border border-subtle dark:border-white/6 p-6">
      {/* Header */}
      <div className="border-b border pb-4 mb-4">
        <Heading level={2} className="text-xl text-text-primary mb-3">
          {submission.title}
        </Heading>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <User className="w-4 h-4" />
            <span className="font-medium">
              {submission.submitter_name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Mail className="w-4 h-4" />
            <a
              href={`mailto:${submission.submitter_email}`}
              className="text-action hover:underline"
            >
              {submission.submitter_email}
            </a>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Calendar className="w-4 h-4" />
            <span>{formatDateTime(submission.submitted_at)}</span>
          </div>
          {(submission.category_label || submission.category_name) && (
            <div className="flex items-center gap-2 text-text-secondary">
              <Folder className="w-4 h-4" />
              <span>
                {submission.category_label || submission.category_name}
              </span>
            </div>
          )}
          {submission.tags?.length > 0 && (
            <div className="flex items-start gap-2 text-text-secondary">
              <Tag className="w-4 h-4 mt-0.5" />
              <div className="flex flex-wrap gap-1">
                {submission.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-surface-raised text-text-secondary text-xs rounded-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review info */}
      {submission.reviewed_at && (
        <div className="mb-4 p-3 bg-surface-raised rounded-lg text-sm">
          <div className="font-medium text-text-secondary mb-1">
            Geprüft von {submission.reviewer_name || 'Admin'}
          </div>
          <div className="text-text-tertiary">
            {formatDateTime(submission.reviewed_at)}
          </div>
          {submission.review_notes && (
            <div className="mt-2 text-text-secondary">
              {submission.review_notes}
            </div>
          )}
          {submission.rejection_reason && (
            <div className="mt-2 text-error-600 dark:text-error-400">
              Grund: {submission.rejection_reason}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="mb-6">
        <Heading level={3} className="font-semibold text-text-primary mb-3">
          Inhalt:
        </Heading>
        <div className="bg-surface-raised rounded-lg p-4 max-h-72 overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm text-text-primary font-sans">
            {submission.content}
          </pre>
        </div>
      </div>

      {/* Actions: pending */}
      {submission.status === APPROVAL_STATUS.PENDING && (
        <div className="space-y-3">
          <Button
            onClick={onShowEditModal}
            disabled={actionLoading !== null}
            variant="primary"
            className="w-full gap-2"
          >
            <Edit className="w-4 h-4" />
            Bearbeiten
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => onAction('publish', submission.id)}
              disabled={actionLoading !== null}
              variant="primary"
              className="gap-2"
            >
              {actionLoading === 'publish' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Veröffentlichen
            </Button>
            <Button
              onClick={() => onAction('approve', submission.id)}
              disabled={actionLoading !== null}
              variant="primary"
              className="gap-2"
            >
              {actionLoading === 'approve' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Genehmigen
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={onShowChangesModal}
              disabled={actionLoading !== null}
              variant="secondary"
              className="gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Änderungen anfragen
            </Button>
            <Button
              onClick={onShowRejectModal}
              disabled={actionLoading !== null}
              variant="destructive"
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Ablehnen
            </Button>
          </div>
        </div>
      )}

      {/* Actions: approved */}
      {submission.status === APPROVAL_STATUS.APPROVED && (
        <Button
          onClick={() => onAction('publish', submission.id)}
          disabled={actionLoading !== null}
          variant="primary"
          className="w-full gap-2"
        >
          {actionLoading === 'publish' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Jetzt veröffentlichen
        </Button>
      )}

      {/* Actions: published */}
      {submission.status === APPROVAL_STATUS.PUBLISHED && (
        <div className="flex flex-col gap-2">
          {submission.slug && (
            <Button as={Link} href={`/blog/${submission.slug}`} target="_blank" variant="primary" className="w-full">
              <ExternalLink className="w-4 h-4" />
              Beitrag ansehen
            </Button>
          )}
          {submission.published_post_id && (
            <Link
              href={`/admin/content/blog/${submission.published_post_id}`}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-default text-text-secondary rounded-lg hover:bg-surface-raised dark:hover:bg-surface-base/6 transition-colors text-sm"
            >
              <Edit className="w-4 h-4" />
              Im Admin bearbeiten
            </Link>
          )}
        </div>
      )}

      {/* Delete */}
      <div className="mt-4 pt-4 border-t border">
        <button
          onClick={() => setConfirmDelete(true)}
          disabled={actionLoading !== null}
          className="flex items-center gap-2 text-sm text-error-600 dark:text-error-400 hover:text-error-800 dark:hover:text-error-300 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Einreichung löschen
        </button>
        <ConfirmDialog
          isOpen={confirmDelete}
          title="Einreichung löschen"
          message="Einreichung wirklich löschen?"
          itemName={submission.title}
          onConfirm={() => { setConfirmDelete(false); onAction('delete', submission.id) }}
          onClose={() => setConfirmDelete(false)}
        />
      </div>
    </div>
  )
}
