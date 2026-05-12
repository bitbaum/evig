'use client'

import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { APPROVAL_STATUS, type ApprovalStatus, type BlogSubmissionType } from '@/config/approval-status'

export interface Submission {
  id: string
  status: ApprovalStatus
  submissionType: BlogSubmissionType
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

export function useSubmissionsAdmin() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filter, setFilter] = useState<'all' | string>('all')
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  useEffect(() => {
    fetchSubmissions()
  }, [])

  const handleConvertToPost = (submission: Submission, submittedByLabel: string) => {
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

*${submittedByLabel}*
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

  const filteredSubmissions = submissions.filter(sub =>
    filter === 'all' || sub.status === filter
  )

  const pendingCount = submissions.filter(s => s.status === APPROVAL_STATUS.PENDING).length
  const approvedCount = submissions.filter(s => s.status === APPROVAL_STATUS.APPROVED).length
  const rejectedCount = submissions.filter(s => s.status === APPROVAL_STATUS.REJECTED).length

  return {
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
  }
}
