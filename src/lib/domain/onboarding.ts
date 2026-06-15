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
}
