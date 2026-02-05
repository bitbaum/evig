/**
 * Types for Team Components
 *
 * Derived from schema types where possible (SSOT).
 */

import type { TeamProfile, TeamProfileWithUser } from '@/lib/schemas/team'

/**
 * Team member data as displayed in the UI
 * Extended with user info from joined query
 */
export interface TeamMemberCardData {
  id: string
  user_id: string
  user_name: string | null
  user_email: string
  position: string | null
  department: string | null
  employment_type: string | null
  start_date: string | null
  skills: string[]
  is_active: boolean
}

/**
 * Props for TeamMemberCard component
 */
export interface TeamMemberCardProps {
  member: TeamMemberCardData
  onView?: (id: string) => void
  onEdit?: (id: string) => void
}

/**
 * Props for TeamFilters component
 */
export interface TeamFiltersProps {
  department: string
  employmentType: string
  isActive: string
  search: string
  onDepartmentChange: (value: string) => void
  onEmploymentTypeChange: (value: string) => void
  onIsActiveChange: (value: string) => void
  onSearchChange: (value: string) => void
}

/**
 * Props for TeamProfileForm component
 */
export interface TeamProfileFormProps {
  initialData?: Partial<TeamProfile & { user_id?: string }>
  users?: Array<{ id: string; name: string | null; email: string }>
  isEdit?: boolean
  profileId?: string
  onSuccess?: () => void
  onCancel?: () => void
  isSuperAdmin?: boolean
}

/**
 * Props for TeamProfileView component
 */
export interface TeamProfileViewProps {
  profile: TeamProfileWithUser
  isSuperAdmin?: boolean
  onEdit?: () => void
  onBack?: () => void
}

/**
 * Filter state for team list
 */
export interface TeamFilterState {
  department: string
  employmentType: string
  isActive: string
  search: string
}

/**
 * API response for team profiles list
 */
export interface TeamProfilesResponse {
  success: boolean
  data?: TeamProfileWithUser[]
  error?: string
}

/**
 * API response for single team profile
 */
export interface TeamProfileResponse {
  success: boolean
  data?: TeamProfileWithUser
  error?: string
}
