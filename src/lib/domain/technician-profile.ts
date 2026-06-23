/**
 * Technician profile completeness — SSOT for onboarding / match readiness.
 *
 * A profile must have skills + canton + location before it can receive
 * skill-match notifications or the "match my skills" browse filter.
 */

export interface TechnicianProfileFields {
  skills: string[]
  canton: string
  postalCode: string
  city: string
}

export type TechnicianProfileGap = 'skills' | 'canton' | 'location'

/** Returns missing fields in display order. Empty array = match-ready. */
export function getTechnicianProfileGaps(profile: TechnicianProfileFields): TechnicianProfileGap[] {
  const gaps: TechnicianProfileGap[] = []
  if (profile.skills.length === 0) gaps.push('skills')
  if (!profile.canton.trim()) gaps.push('canton')
  if (!profile.postalCode.trim() && !profile.city.trim()) gaps.push('location')
  return gaps
}

export function isTechnicianProfileMatchReady(profile: TechnicianProfileFields): boolean {
  return getTechnicianProfileGaps(profile).length === 0
}
