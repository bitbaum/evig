import type { ApprovalStatus, BlogSubmissionType } from '@/config/approval-status'

export interface Submission {
  id: string
  submitter_name: string
  submitter_email: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  submission_type: BlogSubmissionType
  category_id: string | null
  category_name: string | null
  category_label: string | null
  tags: string[]
  status: ApprovalStatus
  reviewed_by: string | null
  reviewed_at: string | null
  reviewer_name: string | null
  review_notes: string | null
  rejection_reason: string | null
  published_post_id: string | null
  submitted_at: string
  last_edited_at?: string | null
  last_edited_by?: string | null
}

export type FilterStatus = 'all' | ApprovalStatus

export type SubmissionAction = 'approve' | 'reject' | 'publish' | 'request_changes' | 'delete'

export interface StatusCounts {
  all: number
  pending: number
  approved: number
  rejected: number
  published: number
}
