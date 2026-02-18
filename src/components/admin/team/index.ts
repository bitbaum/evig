/**
 * Team Components - Barrel Export
 */

// Components
export { TeamMemberCard } from './TeamMemberCard'
export { TeamFilters } from './TeamFilters'
export { TeamProfileForm } from './TeamProfileForm'
export { TeamProfileView } from './TeamProfileView'
export { TeamBasicInfoSection } from './TeamBasicInfoSection'
export { TeamTalentSection } from './TeamTalentSection'
export { TeamAvailabilitySection } from './TeamAvailabilitySection'
export { TeamEmergencySection } from './TeamEmergencySection'
export { TeamHRNotesSection } from './TeamHRNotesSection'

// Hooks
export {
  useTeamProfiles,
  useTeamProfile,
  useTeamProfileMutations,
} from './useTeamProfiles'
export { useTeamProfileForm } from './useTeamProfileForm'

// Types
export type {
  TeamMemberCardData,
  TeamMemberCardProps,
  TeamFiltersProps,
  TeamProfileFormProps,
  TeamProfileViewProps,
  TeamFilterState,
  TeamProfilesResponse,
  TeamProfileResponse,
} from './types'
