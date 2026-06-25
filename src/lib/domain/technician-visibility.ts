/**
 * Public technician listing visibility — SSOT.
 *
 * Community (self-registered via /profil/techniker): visible when active.
 * Professional (vetted application): visible when active + verified + status active.
 */

import { and, eq, or, type SQL } from 'drizzle-orm'
import { repairerProfiles } from '@/db/schema'
import { REPAIRER_PROFILE_TIER, REPAIRER_STATUS } from '@/config/repairer-status'

/** Default public list: community active OR professional verified+active. */
export function publicTechnicianListCondition(): SQL {
  return or(
    and(
      eq(repairerProfiles.isActive, true),
      eq(repairerProfiles.profileTier, REPAIRER_PROFILE_TIER.COMMUNITY),
    ),
    and(
      eq(repairerProfiles.isActive, true),
      eq(repairerProfiles.isVerified, true),
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
      eq(repairerProfiles.isVerified, true),
      eq(repairerProfiles.status, REPAIRER_STATUS.ACTIVE),
    ]
  }
  return [publicTechnicianListCondition()]
}
