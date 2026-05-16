'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
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
import { useBlogSubmissions, type MySubmission } from '@/hooks/useBlogSubmissions'

export default function BlogSubmissionsClient() {
  const t = useTranslations('dashboard.blogSubmissions')

  const {
    submissions,
    loading,
    error,
    editingId,
    editTitle,
    editContent,
    saving,
    expandedFeedback,
    stats,
    setEditTitle,
    setEditContent,
    toggleFeedback,
    startEditing,
    cancelEditing,
    resubmit,
  } = useBlogSubmissions({
    loadError: t('loadError'),
    emptyContent: t('emptyContent'),
    resubmitError: t('resubmitError'),
  })

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
            {t('backToDashboard')}
          </Link>
          <Heading level={1} className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            {t('pageTitle')}
          </Heading>
          <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            {t('pageSubtitle')}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg p-4 mb-6 border-2 border-error-200 bg-error-50 dark:bg-error-900/20 dark:border-error-800">
            <p className="text-sm text-error-800 dark:text-error-300">{error}</p>
          </div>
        )}

        {/* Stats */}
        {submissions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatCard icon={<Clock className="w-5 h-5" />} label={t('statPending')} value={stats.pending} tone="yellow" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label={t('statPublished')} value={stats.published} tone="blue" />
            <StatCard icon={<PenSquare className="w-5 h-5" />} label={t('statRevise')} value={stats.requiresChanges} tone="orange" />
            <StatCard icon={<XCircle className="w-5 h-5" />} label={t('statRejected')} value={stats.rejected} tone="red" />
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
                <SubmissionCard
                  key={submission.id}
                  submission={submission}
                  badge={badge}
                  isEditing={isEditing}
                  feedbackShown={feedbackShown}
                  editTitle={editTitle}
                  editContent={editContent}
                  saving={saving}
                  onToggleFeedback={() => toggleFeedback(submission.id)}
                  onStartEditing={() => startEditing(submission)}
                  onCancelEditing={cancelEditing}
                  onResubmit={() => resubmit(submission.id)}
                  onEditTitleChange={setEditTitle}
                  onEditContentChange={setEditContent}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ---- sub components --------------------------------------------------------

function SubmissionCard({
  submission,
  badge,
  isEditing,
  feedbackShown,
  editTitle,
  editContent,
  saving,
  onToggleFeedback,
  onStartEditing,
  onCancelEditing,
  onResubmit,
  onEditTitleChange,
  onEditContentChange,
}: {
  submission: MySubmission
  badge: { bg: string; color: string; label: string }
  isEditing: boolean
  feedbackShown: boolean
  editTitle: string
  editContent: string
  saving: boolean
  onToggleFeedback: () => void
  onStartEditing: () => void
  onCancelEditing: () => void
  onResubmit: () => void
  onEditTitleChange: (v: string) => void
  onEditContentChange: (v: string) => void
}) {
  const t = useTranslations('dashboard.blogSubmissions')
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-4 sm:p-6 border-2 border-neutral-200 dark:border-neutral-700">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <Heading level={3} className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white mb-1 break-words">
            {submission.title}
          </Heading>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            {t('submittedOn', { date: formatDate(submission.submittedAt || submission.createdAt || '') })}
          </p>
        </div>
        <span className={`inline-flex items-center self-start px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.color}`}>
          {badge.label}
        </span>
      </div>

      {/* Next action hint */}
      {submission.nextAction && (
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">
          {submission.nextAction}
        </p>
      )}

      {/* Published link */}
      {submission.status === APPROVAL_STATUS.PUBLISHED && submission.publishedPostSlug && (
        <Link
          href={`/blog/${submission.publishedPostSlug}`}
          className="inline-flex items-center text-primary-600 hover:text-primary-700 font-medium text-sm"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          {t('viewPublished')}
        </Link>
      )}

      {/* Rejected feedback */}
      {submission.status === APPROVAL_STATUS.REJECTED && submission.adminFeedback && (
        <div className="mt-2">
          <button
            onClick={onToggleFeedback}
            className="text-sm text-error-700 dark:text-error-400 hover:underline inline-flex items-center"
          >
            <AlertCircle className="w-4 h-4 mr-1" />
            {feedbackShown ? t('hideRejection') : t('showRejection')}
          </button>
          {feedbackShown && (
            <div className="mt-2 rounded-lg border border-error-200 dark:border-error-800 bg-error-50 dark:bg-error-900/20 p-3 text-sm text-error-800 dark:text-error-300 whitespace-pre-wrap">
              {submission.adminFeedback}
            </div>
          )}
        </div>
      )}

      {/* Requires changes */}
      {submission.status === APPROVAL_STATUS.REQUIRES_CHANGES && (
        <div className="mt-2">
          {submission.adminFeedback && (
            <div className="rounded-lg border border-warning-200 dark:border-warning-800 bg-warning-50 dark:bg-warning-900/20 p-3 text-sm text-warning-900 dark:text-warning-200 whitespace-pre-wrap mb-3">
              <strong className="block mb-1">{t('editorialFeedback')}</strong>
              {submission.adminFeedback}
            </div>
          )}

          {!isEditing ? (
            <button
              onClick={onStartEditing}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-warning-600 text-white hover:bg-warning-700 text-sm font-medium"
            >
              <PenSquare className="w-4 h-4 mr-2" />
              {t('reviseButton')}
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('titleLabel')}
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => onEditTitleChange(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  {t('contentLabel')}
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => onEditContentChange(e.target.value)}
                  rows={10}
                  placeholder={t('contentPlaceholder')}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onResubmit}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 text-sm font-medium"
                >
                  {saving ? t('submitting') : t('resubmit')}
                </button>
                <button
                  onClick={onCancelEditing}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-sm"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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
    yellow: 'bg-warning-50 dark:bg-warning-900/20 text-warning-800 dark:text-warning-300 border-warning-200 dark:border-warning-800',
    blue: 'bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 border-primary-200 dark:border-primary-800',
    orange: 'bg-warning-50 dark:bg-warning-900/20 text-warning-800 dark:text-warning-300 border-warning-200 dark:border-warning-800',
    red: 'bg-error-50 dark:bg-error-900/20 text-error-800 dark:text-error-300 border-error-200 dark:border-error-800',
  }
  return (
    <div className={`rounded-lg border-2 p-3 sm:p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function EmptyState() {
  const t = useTranslations('dashboard.blogSubmissions')
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm p-8 text-center border-2 border-neutral-200 dark:border-neutral-700">
      <FileText className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
      <Heading level={3} className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
        {t('emptyTitle')}
      </Heading>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6">
        {t('emptyDesc')}
      </p>
      <Link
        href="/blog/submit"
        className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
      >
        {t('submitNow')}
      </Link>
    </div>
  )
}
