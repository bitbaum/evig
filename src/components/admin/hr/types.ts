import type { ApplicationStatus } from '@/config/hr-application-status'
import type { VacancyStatus, RoleTrack } from '@/config/hr-vacancies'

export interface VacancyListItem {
  id: string
  slug: string
  title: string
  summary: string | null
  description: string
  role_track: string
  department: string | null
  location: string | null
  remote_ok: boolean
  hours_per_week: number | null
  start_date: string | null
  application_deadline: string | null
  compensation_public_text: string | null
  status: VacancyStatus
  published_at: string | null
  show_on_get_involved: boolean
  seo_title: string | null
  seo_description: string | null
  application_count?: number
}

export interface ApplicationListItem {
  id: string
  job_posting_id: string
  user_id: string | null
  applicant_name: string
  applicant_email: string
  applicant_phone: string | null
  status: ApplicationStatus
  track_responses: Record<string, unknown>
  cv_storage_key: string | null
  source: string
  admin_notes: string | null
  rejection_reason: string | null
  hired_team_profile_id: string | null
  created_at: string
  posting_title?: string
  posting_slug?: string
  role_track?: string
}

export type ApplicationActionType = 'advance' | 'reject' | 'hire'

export interface ApplicationActionDialogState {
  type: ApplicationActionType
  applicationId: string
  targetStatus?: ApplicationStatus
  rejectionReason: string
  adminNotes: string
}

export interface VacancyFormData {
  title: string
  summary: string
  description: string
  role_track: RoleTrack
  department: string
  location: string
  remote_ok: boolean
  hours_per_week: string
  start_date: string
  application_deadline: string
  compensation_public_text: string
  show_on_get_involved: boolean
  seo_title: string
  seo_description: string
}

export interface HrFunnelStats {
  byStatus: Record<string, number>
  byTrack: Record<string, number>
  bySource: Record<string, number>
  publishedVacancies: number
  pendingApplications: number
}
