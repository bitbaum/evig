import {
  ROLE_TRACK_TO_EMPLOYMENT_TYPE,
  type RoleTrack,
} from '@/config/hr-vacancies'

export interface TrackResponseExtract {
  skills: string[]
  goals: string | null
  developmentAreas: string | null
}

/** Copy application track_responses into team profile fields on hire */
export function extractProfileFromTrackResponses(
  roleTrack: string,
  trackResponses: Record<string, unknown>,
): TrackResponseExtract {
  const skills = Array.isArray(trackResponses.skills)
    ? (trackResponses.skills as string[])
    : []

  const motivation =
    typeof trackResponses.motivation === 'string' ? trackResponses.motivation : null
  const learningGoals =
    typeof trackResponses.learning_goals === 'string' ? trackResponses.learning_goals : null
  const situation =
    typeof trackResponses.situation === 'string' ? trackResponses.situation : null

  let goals: string | null = motivation
  if (roleTrack === 'intern' && learningGoals) {
    goals = learningGoals
  } else if (roleTrack === 'reintegration' && situation) {
    goals = situation
  }

  const developmentAreas =
    typeof trackResponses.support_needs === 'string'
      ? trackResponses.support_needs
      : typeof trackResponses.project_interest === 'string'
        ? trackResponses.project_interest
        : null

  return { skills, goals, developmentAreas }
}

export function employmentTypeForRoleTrack(roleTrack: string): string {
  return ROLE_TRACK_TO_EMPLOYMENT_TYPE[roleTrack as RoleTrack] ?? 'volunteer'
}
