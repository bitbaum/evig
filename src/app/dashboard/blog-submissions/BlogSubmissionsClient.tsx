'use client'

/**
 * BlogSubmissionsClient
 *
 * Shows the authenticated user's blog submissions with per-status UX:
 *  - pending / approved: informational card
 *  - published: link to the live post
 *  - rejected: expandable rejection reason
 *  - requires_changes: inline editor + resubmit button
 *
 * Talks to:
 *  GET  /api/blog/my-submissions
 *  POST /api/blog/submissions/[id]/resubmit
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api/client'
import {
  APPROVAL_STATUS,
  APPROVAL_STATUS_BADGES,
} from '@/config/approval-status'
import { formatDate } from '@/lib/date-formats'
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  PenSquare,
} from 'lucide-react'
import Heading from '@/components/ui/Heading'

interface MySubmission {
  id: string
  title: string
  slug: string | null
  status: string
  statusLabel: string
  submissionType: string
  reviewNotes: string | null
  rejectionReason: string | null
  adminFeedback: string | null
  nextAction: string | null
  publishedPostId: string | null
  publishedPostSlug: string | null
  publishedAt: string | null
  submittedAt: string | null
  createdAt: string | null
  updatedAt: string | null
}

interface ApiResponse {
  submissions: MySubmission[]
}

export default function BlogSubmissionsClient() {
  const [submissions, setSubmissions] = useState<MySubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // Inline resubmit editor state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [expandedFeedback, setExpandedFeedback] = useState<Set<string>>(new Set())

  const load = async () => {
    setLoading(true)
    const result = await apiFetch<ApiResponse>('/api/blog/my-submissions')
    if (result.success && result.data) {
      setSubmissions(result.data.submissions || [])
      setError('')
    } else {
      setError(result.error || 'Fehler beim Laden Ihrer Einreichungen')
    }
    setLoading(false)
  }

  useEffect(() => {
    let cancelled = false
    const fetchSubmissions = async () => {
      setLoading(true)
      const result = await apiFetch<ApiResponse>('/api/blog/my-submissions')
      if (cancelled) return
      if (result.success && result.data) {
        setSubmissions(result.data.submissions || [])
        setError('')
      } else {
        setError(result.error || 'Fehler beim Laden Ihrer Einreichungen')
      }
      setLoading(false)
    }
    fetchSubmissions()
    return () => { cancelled = true }
  }, [])

  const toggleFeedback = (id: string) => {
    setExpandedFeedback((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const startEditing = (submission: MySubmission) => {
    setEditingId(submission.id)
    setEditTitle(submission.title)
    setEditContent('')
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle('')
    setEditContent('')
  }

  const resubmit = async (id: string) => {
    if (!editContent.trim()) {
      setError('Bitte gib den überarbeiteten Inhalt ein.')
      return
    }
    setSaving(true)
    const result = await apiFetch<{ id: string; status: string }>(
      `/api/blog/submissions/${id}/resubmit`,
      {
        method: 'POST',
        body: { title: editTitle, content: editContent },
      },
    )
    setSaving(false)
    if (result.success) {
      cancelEditing()
      await load()
    } else {
      setError(result.error || 'Erneutes Einreichen fehlgeschlagen')
    }
  }

  // ---- stats ---------------------------------------------------------------
  const stats = {
    pending: submissions.filter(
      (s) =>
        s.status === APPROVAL_STATUS.PENDING ||
        s.status === APPROVAL_STATUS.APPROVED,
    ).length,
    published: submissions.filter((s) => s.status === APPROVAL_STATUS.PUBLISHED)
      .length,
    rejected: submissions.filter((s) => s.status === APPROVAL_STATUS.REJECTED)
      .length,
    requiresChanges: submissions.filter(
      (s) => s.status === APPROVAL_STATUS.REQUIRES_CHANGES,
    ).length,
  }

  // ---- render --------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-8 border-2 border-neutral-200 dark:border-neutral-700">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center mb-4 text-neutral-600 dark:text-neutral-400 hover:text-primary-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Link>
          <Heading level={1} className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Meine Einreichungen
          </Heading>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            Status Ihrer Blog-Beiträge und Rückmeldungen des Redaktionsteams
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg p-4 mb-6 border-2 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Stats */}
        {submissions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="Ausstehend"
              value={stats.pending}
              tone="yellow"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Veröffentlicht"
              value={stats.published}
              tone="blue"
            />
            <StatCard
              icon={<PenSquare className="w-5 h-5" />}
              label="Überarbeiten"
              value={stats.requiresChanges}
              tone="orange"
            />
            <StatCard
              icon={<XCircle className="w-5 h-5" />}
              label="Abgelehnt"
              value={stats.rejected}
              tone="red"
            />
          </div>
        )}

        {/* List */}
        {submissions.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => {
              const badge =
                APPROVAL_STATUS_BADGES[submission.status] ??
                APPROVAL_STATUS_BADGES[APPROVAL_STATUS.PENDING]
              const isEditing = editingId === submission.id
              const feedbackShown = expandedFeedback.has(submission.id)

              return (
                <div
                  key={submission.id}
                  className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-4 sm:p-6 border-2 border-neutral-200 dark:border-neutral-700"
                >
                  {/* Header row */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <Heading level={3} className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white mb-1 break-words">
                        {submission.title}
                      </Heading>
                      <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                        Eingereicht am{' '}
                        {formatDate(
                          submission.submittedAt || submission.createdAt || '',
                        )}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center self-start px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Next action hint */}
                  {submission.nextAction && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">
                      {submission.nextAction}
                    </p>
                  )}

                  {/* Status specific content */}
                  {submission.status === APPROVAL_STATUS.PUBLISHED &&
                    submission.publishedPostSlug && (
                      <Link
                        href={`/blog/${submission.publishedPostSlug}`}
                        className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Veröffentlichten Beitrag ansehen
                      </Link>
                    )}

                  {submission.status === APPROVAL_STATUS.REJECTED &&
                    submission.adminFeedback && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleFeedback(submission.id)}
                          className="text-sm text-red-700 dark:text-red-400 hover:underline inline-flex items-center"
                        >
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {feedbackShown
                            ? 'Ablehnungsgrund ausblenden'
                            : 'Ablehnungsgrund anzeigen'}
                        </button>
                        {feedbackShown && (
                          <div className="mt-2 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-300 whitespace-pre-wrap">
                            {submission.adminFeedback}
                          </div>
                        )}
                      </div>
                    )}

                  {submission.status === APPROVAL_STATUS.REQUIRES_CHANGES && (
                    <div className="mt-2">
                      {submission.adminFeedback && (
                        <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-3 text-sm text-orange-900 dark:text-orange-200 whitespace-pre-wrap mb-3">
                          <strong className="block mb-1">
                            Rückmeldung vom Redaktionsteam:
                          </strong>
                          {submission.adminFeedback}
                        </div>
                      )}

                      {!isEditing ? (
                        <button
                          onClick={() => startEditing(submission)}
                          className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 text-sm font-medium"
                        >
                          <PenSquare className="w-4 h-4 mr-2" />
                          Überarbeiten
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                              Titel
                            </label>
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                              Überarbeiteter Inhalt
                            </label>
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              rows={10}
                              placeholder="Füge Ihren überarbeiteten Beitrag hier ein..."
                              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => resubmit(submission.id)}
                              disabled={saving}
                              className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
                            >
                              {saving ? 'Wird gesendet...' : 'Erneut einreichen'}
                            </button>
                            <button
                              onClick={cancelEditing}
                              disabled={saving}
                              className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ---- sub components --------------------------------------------------------

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'yellow' | 'blue' | 'orange' | 'red'
}) {
  const tones: Record<string, string> = {
    yellow:
      'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    orange:
      'bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800',
  }
  return (
    <div
      className={`rounded-lg border-2 p-3 sm:p-4 ${tones[tone]}`}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-8 text-center border-2 border-neutral-200 dark:border-neutral-700">
      <FileText className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
      <Heading level={3} className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
        Du hast noch keine Blogbeiträge eingereicht
      </Heading>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6">
        Teile Ihr Wissen mit der Community.
      </p>
      <Link
        href="/blog/submit"
        className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
      >
        Jetzt einreichen
      </Link>
    </div>
  )
}
