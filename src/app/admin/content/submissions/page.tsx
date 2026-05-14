'use client'

/**
 * Admin Blog Submissions Page
 *
 * Review and manage user-submitted blog content.
 * Actions: Approve, Reject, Publish, Request Changes
 */

import Link from 'next/link'
import { ArrowLeft, Loader2, FileText } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { EditSubmissionModal } from '@/components/admin/blog/EditSubmissionModal'
import {
  useSubmissions,
  SubmissionFilters,
  SubmissionList,
  SubmissionDetail,
  RejectModal,
  RequestChangesModal,
} from '@/components/admin/blog/submissions'

export default function SubmissionsAdminPage() {
  const s = useSubmissions()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/content"
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </Link>
          <div>
            <Heading level={1} className="text-2xl font-bold text-neutral-900 dark:text-white">
              Blog-Einreichungen
            </Heading>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Von Benutzern eingereichte Inhalte prüfen und veröffentlichen
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-300 px-4 py-2 rounded-lg text-center">
            <div className="text-2xl font-bold">{s.counts.pending}</div>
            <div className="text-xs">Ausstehend</div>
          </div>
          <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-4 py-2 rounded-lg text-center">
            <div className="text-2xl font-bold">{s.counts.published}</div>
            <div className="text-xs">Veröffentlicht</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {s.error && (
        <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-300 px-4 py-3 rounded-lg">
          {s.error}
        </div>
      )}
      {s.success && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 px-4 py-3 rounded-lg">
          {s.success}
        </div>
      )}

      {/* Filters */}
      <SubmissionFilters filter={s.filter} counts={s.counts} onFilterChange={s.setFilter} />

      {/* Content */}
      {s.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : s.filteredSubmissions.length === 0 ? (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-700 p-12 text-center">
          <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">
            Keine Einreichungen gefunden.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <SubmissionList
            submissions={s.filteredSubmissions}
            selectedId={s.selectedSubmission?.id ?? null}
            onSelect={s.setSelectedSubmission}
          />
          <div className="lg:sticky lg:top-4 lg:h-fit">
            <SubmissionDetail
              submission={s.selectedSubmission}
              actionLoading={s.actionLoading}
              onAction={s.handleAction}
              onShowRejectModal={() => s.setShowRejectModal(true)}
              onShowChangesModal={() => s.setShowChangesModal(true)}
              onShowEditModal={() => s.setShowEditModal(true)}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      {s.showRejectModal && s.selectedSubmission && (
        <RejectModal
          rejectionReason={s.rejectionReason}
          actionLoading={s.actionLoading}
          onReasonChange={s.setRejectionReason}
          onConfirm={() =>
            s.handleAction('reject', s.selectedSubmission!.id, {
              rejection_reason: s.rejectionReason,
            })
          }
          onClose={() => s.setShowRejectModal(false)}
        />
      )}

      {s.showChangesModal && s.selectedSubmission && (
        <RequestChangesModal
          reviewNotes={s.reviewNotes}
          actionLoading={s.actionLoading}
          onNotesChange={s.setReviewNotes}
          onConfirm={() =>
            s.handleAction('request_changes', s.selectedSubmission!.id, {
              review_notes: s.reviewNotes,
            })
          }
          onClose={() => s.setShowChangesModal(false)}
        />
      )}

      {s.showEditModal && s.selectedSubmission && (
        <EditSubmissionModal
          submission={s.selectedSubmission}
          onClose={() => s.setShowEditModal(false)}
          onSaved={() => {
            s.setShowEditModal(false)
            s.fetchSubmissions()
          }}
        />
      )}
    </div>
  )
}
