/**
 * Activity Stream Type Definitions
 */

import type { ActivityUpdateType, HelpRequestUrgency, HelpRequestStatus, ActivitySourceType, ActivityCategory, VisibilityLevel } from '@/config/activity'

export interface ActivityUpdate {
  id: string
  user_id: string
  user_name: string | null
  user_email: string
  update_type: ActivityUpdateType
  title: string
  description: string | null
  category: ActivityCategory | null
  visibility: VisibilityLevel
  occurred_at: string
  created_at: string
  updated_at: string
}

export interface HelpRequest {
  id: string
  requester_id: string
  requester_name: string | null
  requester_email: string
  title: string
  description: string | null
  category: ActivityCategory | null
  urgency: HelpRequestUrgency
  requested_user_id: string | null
  requested_user_name: string | null
  requested_user_email: string | null
  is_broadcast: boolean
  status: HelpRequestStatus
  resolved_by: string | null
  resolved_by_name: string | null
  resolved_at: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
}

export interface UnifiedActivity {
  id: string
  source_type: ActivitySourceType
  user_id: string
  user_name: string | null
  user_email: string
  title: string
  description: string | null
  category: string | null
  metadata: Record<string, unknown>
  occurred_at: string
}

export interface ActivityStreamFilter {
  user_id?: string
  source_type?: string
  category?: string
  since?: string
  until?: string
  limit: number
  offset: number
}

export interface HelpRequestFilter {
  status?: HelpRequestStatus
  urgency?: HelpRequestUrgency
  category?: ActivityCategory
  requester_id?: string
  requested_user_id?: string
  is_broadcast?: boolean
  limit: number
  offset: number
}

export interface UserStats {
  user_id: string
  user_name: string | null
  user_email: string
  department: string | null
  task_completions: number
  activity_updates: number
  help_requests_created: number
  help_requests_resolved: number
  total_score: number
}

export interface DigestSummary {
  period: {
    since: string
    until: string
  }
  totals: {
    task_completions: number
    activity_updates: number
    help_requests_created: number
    help_requests_resolved: number
    active_users: number
  }
  by_user: UserStats[]
  by_category: { category: string; count: number }[]
  top_contributors: UserStats[]
  recent_milestones: {
    id: string
    user_name: string | null
    title: string
    occurred_at: string
  }[]
}

export interface TeamMember {
  id: string
  user_id: string
  user_name: string | null
  user_email: string
  current_focus: string | null
  current_focus_updated_at: string | null
}
