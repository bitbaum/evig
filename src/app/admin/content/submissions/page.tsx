'use client'

/**
 * Admin Blog Submissions Page
 *
 * Review and manage user-submitted blog content.
 * Actions: Approve, Reject, Publish, Request Changes
 */

import { useState, useEffect, useCallback } from 'react'
import { APPROVAL_STATUS_BADGES } from '@/config/approval-status'
import Link from 'next/link'
import {
  ArrowLeft,
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
  FileText,
  Lightbulb,
  ExternalLink,
  Trash2,
} from 'lucide-react'

interface Submission {
  id: string
  submitter_name: string
  submitter_email: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  submission_type: 'idea' | 'draft'
  category_id: string | null
  category_name: string | null
  category_label: string | null
  tags: string[]
  status: 'pending' | 'approved' | 'rejected' | 'published'
  reviewed_by: string | null
  reviewed_at: string | null
  reviewer_name: string | null
  review_notes: string | null
  rejection_reason: string | null
  published_post_id: string | null
  submitted_at: string
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'published'

export default function SubmissionsAdminPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showChangesModal, setShowChangesModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [reviewNotes, setReviewNotes] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchSubmissions = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/blog/submit')
      const data = await response.json()
      if (data.success) {
        setSubmissions(data.data?.submissions || [])
      }
    } catch (err) {
      setError('Fehler beim Laden der Einreichungen')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const handleAction = async (
    action: 'approve' | 'reject' | 'publish' | 'request_changes' | 'delete',
    submissionId: string,
    extraData?: { rejection_reason?: string; review_notes?: string }
  ) => {
    setActionLoading(action)
    setError('')
    setSuccess('')

    try {
      if (action === 'delete') {
        const res = await fetch(`/api/admin/blog/submissions/${submissionId}`, {
          method: 'DELETE',
        })
        const data = await res.json()
        if (data.success) {
          setSuccess('Einreichung gelöscht')
          setSelectedSubmission(null)
          fetchSubmissions()
        } else {
          setError(data.error || 'Fehler beim Löschen')
        }
      } else {
        const res = await fetch(`/api/admin/blog/submissions/${submissionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, ...extraData }),
        })
        const data = await res.json()
        if (data.success) {
          const messages: Record<string, string> = {
            approve: 'Einreichung genehmigt',
            reject: 'Einreichung abgelehnt',
            publish: 'Beitrag veröffentlicht!',
            request_changes: 'Änderungen angefragt',
          }
          setSuccess(messages[action] || 'Aktion erfolgreich')
          setSelectedSubmission(null)
          setShowRejectModal(false)
          setShowChangesModal(false)
          setRejectionReason('')
          setReviewNotes('')
          fetchSubmissions()
        } else {
          setError(data.error || 'Fehler bei der Aktion')
        }
      }
    } catch {
      setError('Netzwerkfehler')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredSubmissions = submissions.filter(
    (sub) => filter === 'all' || sub.status === filter
  )

  const counts = {
    all: submissions.length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    approved: submissions.filter((s) => s.status === 'approved').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
    published: submissions.filter((s) => s.status === 'published').length,
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-CH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusConfig = APPROVAL_STATUS_BADGES

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Blog-Einreichungen
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Von Benutzern eingereichte Inhalte prüfen und veröffentlichen
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-4 py-2 rounded-lg text-center">
            <div className="text-2xl font-bold">{counts.pending}</div>
            <div className="text-xs">Ausstehend</div>
          </div>
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 rounded-lg text-center">
            <div className="text-2xl font-bold">{counts.published}</div>
            <div className="text-xs">Veröffentlicht</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-2">
          {(
            ['all', 'pending', 'approved', 'rejected', 'published'] as const
          ).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {status === 'all'
                ? 'Alle'
                : statusConfig[status]?.label || status}{' '}
              ({counts[status]})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Keine Einreichungen gefunden.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* List */}
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                onClick={() => setSelectedSubmission(submission)}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-5 cursor-pointer transition-all ${
                  selectedSubmission?.id === submission.id
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
                          statusConfig[submission.status]?.bg || ''
                        } ${statusConfig[submission.status]?.color || ''}`}
                      >
                        {statusConfig[submission.status]?.label ||
                          submission.status}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {submission.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {submission.submitter_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(submission.submitted_at)}
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

          {/* Detail View */}
          <div className="lg:sticky lg:top-4 lg:h-fit">
            {selectedSubmission ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {selectedSubmission.title}
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      <span className="font-medium">
                        {selectedSubmission.submitter_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="w-4 h-4" />
                      <a
                        href={`mailto:${selectedSubmission.submitter_email}`}
                        className="text-teal-600 hover:underline"
                      >
                        {selectedSubmission.submitter_email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(selectedSubmission.submitted_at)}</span>
                    </div>
                    {(selectedSubmission.category_label ||
                      selectedSubmission.category_name) && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Folder className="w-4 h-4" />
                        <span>
                          {selectedSubmission.category_label ||
                            selectedSubmission.category_name}
                        </span>
                      </div>
                    )}
                    {selectedSubmission.tags?.length > 0 && (
                      <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                        <Tag className="w-4 h-4 mt-0.5" />
                        <div className="flex flex-wrap gap-1">
                          {selectedSubmission.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
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
                {selectedSubmission.reviewed_at && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                    <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Geprüft von {selectedSubmission.reviewer_name || 'Admin'}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {formatDate(selectedSubmission.reviewed_at)}
                    </div>
                    {selectedSubmission.review_notes && (
                      <div className="mt-2 text-gray-600 dark:text-gray-400">
                        {selectedSubmission.review_notes}
                      </div>
                    )}
                    {selectedSubmission.rejection_reason && (
                      <div className="mt-2 text-red-600 dark:text-red-400">
                        Grund: {selectedSubmission.rejection_reason}
                      </div>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Inhalt:
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 max-h-72 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans">
                      {selectedSubmission.content}
                    </pre>
                  </div>
                </div>

                {/* Actions */}
                {selectedSubmission.status === 'pending' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() =>
                          handleAction('publish', selectedSubmission.id)
                        }
                        disabled={actionLoading !== null}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === 'publish' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Veröffentlichen
                      </button>
                      <button
                        onClick={() =>
                          handleAction('approve', selectedSubmission.id)
                        }
                        disabled={actionLoading !== null}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === 'approve' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Genehmigen
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowChangesModal(true)}
                        disabled={actionLoading !== null}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 disabled:opacity-50 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Änderungen anfragen
                      </button>
                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={actionLoading !== null}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Ablehnen
                      </button>
                    </div>
                  </div>
                )}

                {selectedSubmission.status === 'approved' && (
                  <button
                    onClick={() =>
                      handleAction('publish', selectedSubmission.id)
                    }
                    disabled={actionLoading !== null}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                  >
                    {actionLoading === 'publish' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Jetzt veröffentlichen
                  </button>
                )}

                {selectedSubmission.status === 'published' &&
                  selectedSubmission.slug && (
                    <Link
                      href={`/blog/${selectedSubmission.slug}`}
                      target="_blank"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Beitrag ansehen
                    </Link>
                  )}

                {/* Delete button */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      if (
                        confirm('Einreichung wirklich löschen?')
                      ) {
                        handleAction('delete', selectedSubmission.id)
                      }
                    }}
                    disabled={actionLoading !== null}
                    className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Einreichung löschen
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Wählen Sie eine Einreichung aus, um Details anzuzeigen
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Einreichung ablehnen
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ablehnungsgrund *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Warum wird diese Einreichung abgelehnt?"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() =>
                  handleAction('reject', selectedSubmission.id, {
                    rejection_reason: rejectionReason,
                  })
                }
                disabled={!rejectionReason || actionLoading !== null}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'reject' ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Ablehnen'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Request Changes Modal */}
      {showChangesModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Änderungen anfragen
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Welche Änderungen werden benötigt? *
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Beschreiben Sie die gewünschten Änderungen..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowChangesModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() =>
                  handleAction('request_changes', selectedSubmission.id, {
                    review_notes: reviewNotes,
                  })
                }
                disabled={!reviewNotes || actionLoading !== null}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'request_changes' ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'Senden'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
