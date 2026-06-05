'use client'

import { Link } from '@/i18n/navigation'
import { ArrowLeft, Eye, Edit, Calendar, User, Mail, Tag, Folder } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { APPROVAL_STATUS, BLOG_SUBMISSION_TYPE, getApprovalStatusBadge } from '@/config/approval-status'
import { formatDateTime } from '@/lib/date-formats'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'
import { useSubmissionsAdmin } from './useSubmissionsAdmin'
import { ROUTES } from '@/config/routes'

export default function SubmissionsAdminPage() {
  const t = useTranslations('blog.admin')
  const {
    submissions,
    filter,
    setFilter,
    selectedSubmission,
    setSelectedSubmission,
    isLoading,
    filteredSubmissions,
    pendingCount,
    approvedCount,
    rejectedCount,
    handleConvertToPost,
  } = useSubmissionsAdmin()

  return (
    <main>
      {/* Header */}
      <div className="bg-action text-white py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <Link
            href={ROUTES.public.blog}
            className="inline-flex items-center text-action-text hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToBlog')}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <Heading level={1} className="text-4xl font-bold mb-2">{t('heading')}</Heading>
              <p className="text-action-text">{t('subtitle')}</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-surface-base bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-2xl font-bold">{pendingCount}</div>
                <div className="text-sm text-action-text">{t('statPending')}</div>
              </div>
              <div className="bg-surface-base bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-2xl font-bold">{approvedCount}</div>
                <div className="text-sm text-action-text">{t('statApproved')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Filters */}
        <div className="bg-surface-base rounded-lg shadow-xs p-4 mb-6">
          <div className="flex gap-2">
            {[
              { key: 'all', label: t('filterAll', { count: submissions.length }) },
              { key: APPROVAL_STATUS.PENDING, label: t('filterPending', { count: pendingCount }) },
              { key: APPROVAL_STATUS.APPROVED, label: t('filterApproved', { count: approvedCount }) },
              { key: APPROVAL_STATUS.REJECTED, label: t('filterRejected', { count: rejectedCount }) },
            ].map(({ key, label }) => (
              <Button
                key={key}
                variant="ghost"
                onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === key
                    ? 'bg-action text-white'
                    : 'bg-surface-raised text-text-secondary hover:bg-surface-overlay'
                }`}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-action mx-auto"></div>
            <p className="text-text-secondary mt-4">{t('loading')}</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-surface-base rounded-lg shadow-xs p-12 text-center">
            <p className="text-text-secondary">{t('noResults')}</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Submissions List */}
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  onClick={() => setSelectedSubmission(submission)}
                  className={`bg-surface-base rounded-lg shadow-xs p-6 cursor-pointer transition-all ${
                    selectedSubmission?.id === submission.id
                      ? 'ring-2 ring-action'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            submission.submissionType === BLOG_SUBMISSION_TYPE.IDEA
                              ? 'bg-action-muted text-action'
                              : 'bg-action-muted text-action'
                          }`}
                        >
                          {submission.submissionType === BLOG_SUBMISSION_TYPE.IDEA ? t('typeIdea') : t('typeDraft')}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${getApprovalStatusBadge(submission.status).bg} ${getApprovalStatusBadge(submission.status).color}`}
                        >
                          {getApprovalStatusBadge(submission.status).label}
                        </span>
                      </div>
                      <Heading level={3} className="font-semibold text-text-primary mb-1 line-clamp-2">
                        {submission.title}
                      </Heading>
                      <div className="flex items-center gap-3 text-sm text-text-tertiary">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {submission.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(submission.submittedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {submission.category && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 bg-surface-raised text-text-secondary text-xs rounded-sm">
                        <Folder className="w-3 h-3 mr-1" />
                        {submission.category}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Detail View */}
            <div className="lg:sticky lg:top-4 lg:h-fit">
              {selectedSubmission ? (
                <div className="bg-surface-base rounded-lg shadow-xs p-6">
                  <div className="border-b border-strong pb-4 mb-4">
                    <Heading level={2} className="text-2xl font-bold text-text-primary mb-3">
                      {selectedSubmission.title}
                    </Heading>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{selectedSubmission.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${selectedSubmission.email}`} className="text-action hover:underline">
                          {selectedSubmission.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateTime(selectedSubmission.submittedAt)}</span>
                      </div>
                      {selectedSubmission.category && (
                        <div className="flex items-center gap-2 text-text-secondary">
                          <Folder className="w-4 h-4" />
                          <span>{selectedSubmission.category}</span>
                        </div>
                      )}
                      {selectedSubmission.tags.length > 0 && (
                        <div className="flex items-start gap-2 text-text-secondary">
                          <Tag className="w-4 h-4 mt-0.5" />
                          <div className="flex flex-wrap gap-1">
                            {selectedSubmission.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-surface-raised text-text-secondary text-xs rounded-sm">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <Heading level={3} className="font-semibold text-text-primary mb-3">{t('contentLabel')}</Heading>
                    <div className="bg-surface-raised rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-text-primary font-sans">
                        {selectedSubmission.content}
                      </pre>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleConvertToPost(
                        selectedSubmission,
                        t('submittedBy', { name: selectedSubmission.name, email: selectedSubmission.email })
                      )}
                      variant="primary"
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {t('downloadMarkdown')}
                    </Button>
                  </div>

                  <p className="mt-4 text-xs text-text-tertiary bg-surface-raised border border-strong rounded-sm p-3">
                    💡 {t.rich('tipText', {
                      strong: (chunks) => <strong>{chunks}</strong>,
                      code: (chunks) => <code>{chunks}</code>,
                    })}
                  </p>
                </div>
              ) : (
                <div className="bg-surface-base rounded-lg shadow-xs p-12 text-center">
                  <Eye className="w-12 h-12 text-text-muted mx-auto mb-4" />
                  <p className="text-text-secondary">
                    {t('selectPrompt')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
