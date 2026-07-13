/**
 * Public technician listing visibility — SSOT.
 *
 * Community (self-registered via /profil/techniker): visible when active.
 * Professional (vetted application): visible when active + verified + status active.
 */

import { and, eq, or, type SQL } from 'drizzle-orm'
import { repairerProfiles, userProfiles } from '@/db/schema'
import { REPAIRER_PROFILE_TIER, REPAIRER_STATUS } from '@/config/repairer-status'

// NOTE — `is_verified` is per-PERSON identity, owned by user_profiles (Profiles
// SSOT). Every query using these conditions MUST
// `.leftJoin(userProfiles, eq(userProfiles.userId, repairerProfiles.userId))`
// or the reference to userProfiles.isVerified produces invalid SQL.

/** Default public list: community active OR professional verified+active. */
export function publicTechnicianListCondition(): SQL {
  return or(
    and(
      eq(repairerProfiles.isActive, true),
      eq(repairerProfiles.profileTier, REPAIRER_PROFILE_TIER.COMMUNITY),
    ),
    and(
      eq(repairerProfiles.isActive, true),
      eq(userProfiles.isVerified, true),
      eq(repairerProfiles.profileTier, REPAIRER_PROFILE_TIER.PROFESSIONAL),
      eq(repairerProfiles.status, REPAIRER_STATUS.ACTIVE),
    ),
  )!
}

export function technicianListConditionsForTier(tier: string): SQL[] {
  if (tier === REPAIRER_PROFILE_TIER.COMMUNITY) {
    return [
      eq(repairerProfiles.isActive, true),
      eq(repairerProfiles.profileTier, REPAIRER_PROFILE_TIER.COMMUNITY),
    ]
  }
  if (tier === REPAIRER_PROFILE_TIER.PROFESSIONAL) {
    return [
      eq(repairerProfiles.isActive, true),
      eq(repairerProfiles.profileTier, REPAIRER_PROFILE_TIER.PROFESSIONAL),
      eq(userProfiles.isVerified, true),
      eq(repairerProfiles.status, REPAIRER_STATUS.ACTIVE),
    ]
  }
  return [publicTechnicianListCondition()]
}

/** Direct request from /it-hilfe/techniker/[id] or ?technician= — same rules as public list. */
export function canAcceptDirectItHilfeRequest(profile: {
  isActive: boolean | null
  profileTier: string | null
  isVerified: boolean | null
  status: string | null
}): boolean {
  if (!profile.isActive) return false
  if (profile.profileTier === REPAIRER_PROFILE_TIER.COMMUNITY) return true
  return (
    profile.profileTier === REPAIRER_PROFILE_TIER.PROFESSIONAL &&
    profile.isVerified === true &&
    profile.status === REPAIRER_STATUS.ACTIVE
  )
}
