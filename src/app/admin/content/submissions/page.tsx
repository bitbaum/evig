'use client'

/**
 * Admin Blog Submissions Page
 *
 * Review and manage user-submitted blog content.
 * Actions: Approve, Reject, Publish, Request Changes
 */

import Link from 'next/link'
import { ArrowLeft, Loader2, FileText } from 'lucide-react'
import Heading from '@/components/ui/Heading'
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
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <Heading level={1} className="text-2xl font-bold text-gray-900 dark:text-white">
              Blog-Einreichungen
            </Heading>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Von Benutzern eingereichte Inhalte prüfen und veröffentlichen
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-4 py-2 rounded-lg text-center">
            <div className="text-2xl font-bold">{s.counts.pending}</div>
            <div className="text-xs">Ausstehend</div>
          </div>
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 rounded-lg text-center">
            <div className="text-2xl font-bold">{s.counts.published}</div>
            <div className="text-xs">Veröffentlicht</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {s.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {s.error}
        </div>
      )}
      {s.success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
          {s.success}
        </div>
      )}

      {/* Filters */}
      <SubmissionFilters filter={s.filter} counts={s.counts} onFilterChange={s.setFilter} />

      {/* Content */}
      {s.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : s.filteredSubmissions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
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
