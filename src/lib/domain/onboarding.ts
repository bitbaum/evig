/**
 * Onboarding domain logic — SSOT for "Erste Schritte" checklist rules.
 *
 * Pure functions only; DB lookups live in onboarding-state service.
 */

import { SETTINGS_CONFIG } from '@/config/profile'

export interface OnboardingProfileFields {
  first_name: string | null
  last_name: string | null
}

/** Minimum personal data before the checklist hides the profile step. */
export function isBasicProfileComplete(profile: OnboardingProfileFields): boolean {
  const minLen = SETTINGS_CONFIG.validation.firstName.minLength
  const first = profile.first_name?.trim() ?? ''
  const last = profile.last_name?.trim() ?? ''
  return first.length >= minLen && last.length >= minLen
}

export interface OnboardingChecklistState {
  emailVerified: boolean
  profileComplete: boolean
  sellerProfileSetup: boolean
  hasListing: boolean
  repairerProfileSetup: boolean
  hasPublishedService: boolean
  // Staff (@revamp-it.ch) get a DIFFERENT checklist — their profile powers
  // Zeiterfassung (schedule) + task-matching (skills/interests).
  isStaff: boolean
  scheduleSet: boolean
  teamProfileComplete: boolean
}

export interface OnboardingTeamFields {
  working_hours: string | null
  skills: string[] | null
  goals: string | null
}

/** Staff have set a weekly schedule → Zeiterfassung can derive expected hours. */
export function isScheduleSet(t: OnboardingTeamFields): boolean {
  return !!t.working_hours && t.working_hours.trim().length > 0
}

/** Staff profile is rich enough to power dev-paths / task matching. */
export function isTeamProfileComplete(t: OnboardingTeamFields): boolean {
  return (t.skills?.length ?? 0) > 0 && !!t.goals?.trim()
}
