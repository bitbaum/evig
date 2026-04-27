'use client'

import { useState, useEffect } from 'react'
import { Link } from '@/i18n/navigation'
import { ArrowLeft, Eye, Edit, Calendar, User, Mail, Tag, Folder } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { APPROVAL_STATUS, getApprovalStatusBadge, type ApprovalStatus } from '@/config/approval-status'
import { formatDateTime } from '@/lib/date-formats'
import Heading from '@/components/ui/Heading'

interface Submission {
  id: string
  status: ApprovalStatus
  submissionType: 'idea' | 'draft'
  name: string
  email: string
  title: string
  category: string
  tags: string[]
  content: string
  submittedAt: string
  reviewedAt: string | null
  reviewedBy: string | null
  publishedAt: string | null
}

export default function SubmissionsAdminPage() {
  const t = useTranslations('blog.admin')
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filter, setFilter] = useState<'all' | string>('all')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const result = await apiFetch<{ submissions: Submission[] }>('/api/blog/submit')
      if (result.success && result.data) {
        setSubmissions(result.data.submissions || [])
      } else {
        logger.error('Error fetching submissions', { error: result.error })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter(sub =>
    filter === 'all' || sub.status === filter
  )

  const pendingCount = submissions.filter(s => s.status === APPROVAL_STATUS.PENDING).length
  const approvedCount = submissions.filter(s => s.status === APPROVAL_STATUS.APPROVED).length
  const rejectedCount = submissions.filter(s => s.status === APPROVAL_STATUS.REJECTED).length

  const handleConvertToPost = (submission: Submission) => {
    const markdown = `---
title: '${submission.title}'
excerpt: ''
author: '${submission.name}'
category: '${submission.category}'
tags:
${submission.tags.map(tag => `  - ${tag}`).join('\n')}
publishedAt: ''
published: false
---

${submission.content}

---

*${t('submittedBy', { name: submission.name, email: submission.email })}*
`

    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${submission.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <Link
            href="/blog"
            className="inline-flex items-center text-green-200 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToBlog')}
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <Heading level={1} className="text-4xl font-bold mb-2">{t('heading')}</Heading>
              <p className="text-green-100">{t('subtitle')}</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-2xl font-bold">{pendingCount}</div>
                <div className="text-sm text-green-200">{t('statPending')}</div>
              </div>
              <div className="bg-white bg-opacity-10 rounded-lg px-4 py-2">
                <div className="text-2xl font-bold">{approvedCount}</div>
                <div className="text-sm text-green-200">{t('statApproved')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('filterAll', { count: submissions.length })}
            </button>
            <button
              onClick={() => setFilter(APPROVAL_STATUS.PENDING)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === APPROVAL_STATUS.PENDING
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('filterPending', { count: pendingCount })}
            </button>
            <button
              onClick={() => setFilter(APPROVAL_STATUS.APPROVED)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === APPROVAL_STATUS.APPROVED
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('filterApproved', { count: approvedCount })}
            </button>
            <button
              onClick={() => setFilter(APPROVAL_STATUS.REJECTED)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === APPROVAL_STATUS.REJECTED
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('filterRejected', { count: rejectedCount })}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">{t('loading')}</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600">{t('noResults')}</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Submissions List */}
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  onClick={() => setSelectedSubmission(submission)}
                  className={`bg-white rounded-lg shadow-sm p-6 cursor-pointer transition-all ${
                    selectedSubmission?.id === submission.id
                      ? 'ring-2 ring-green-600'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            submission.submissionType === 'idea'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {submission.submissionType === 'idea' ? t('typeIdea') : t('typeDraft')}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${getApprovalStatusBadge(submission.status).bg} ${getApprovalStatusBadge(submission.status).color}`}
                        >
                          {getApprovalStatusBadge(submission.status).label}
                        </span>
                      </div>
                      <Heading level={3} className="font-semibold text-gray-900 mb-1 line-clamp-2">
                        {submission.title}
                      </Heading>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
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
                      <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
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
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="border-b border-gray-200 pb-4 mb-4">
                    <Heading level={2} className="text-2xl font-bold text-gray-900 mb-3">
                      {selectedSubmission.title}
                    </Heading>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-4 h-4" />
                        <span className="font-medium">{selectedSubmission.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${selectedSubmission.email}`} className="text-green-600 hover:underline">
                          {selectedSubmission.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateTime(selectedSubmission.submittedAt)}</span>
                      </div>
                      {selectedSubmission.category && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Folder className="w-4 h-4" />
                          <span>{selectedSubmission.category}</span>
                        </div>
                      )}
                      {selectedSubmission.tags.length > 0 && (
                        <div className="flex items-start gap-2 text-gray-600">
                          <Tag className="w-4 h-4 mt-0.5" />
                          <div className="flex flex-wrap gap-1">
                            {selectedSubmission.tags.map((tag, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <Heading level={3} className="font-semibold text-gray-900 mb-3">{t('contentLabel')}</Heading>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
                        {selectedSubmission.content}
                      </pre>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleConvertToPost(selectedSubmission)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {t('downloadMarkdown')}
                    </button>
                  </div>

                  <p className="mt-4 text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
                    💡 {t.rich('tipText', {
                      strong: (chunks) => <strong>{chunks}</strong>,
                      code: (chunks) => <code>{chunks}</code>,
                    })}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
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
