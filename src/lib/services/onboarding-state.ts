/**
 * Loads onboarding checklist state from the database.
 */

import { db } from '@/db'
import { listings, sellerProfiles } from '@/db/schema/marketplace'
import { repairerProfiles, repairerServices } from '@/db/schema/services'
import { getOrCreateProfile } from '@/lib/auth/db'
import { isBasicProfileComplete, type OnboardingChecklistState } from '@/lib/domain/onboarding'
import { ROLES, type UserRole } from '@/lib/constants'
import { eq, and, sql } from 'drizzle-orm'

export async function getOnboardingChecklistState(
  userId: string,
  role: UserRole,
  emailVerified: boolean,
): Promise<OnboardingChecklistState> {
  const profile = await getOrCreateProfile(userId)
  const profileComplete = isBasicProfileComplete(profile)

  const base: OnboardingChecklistState = {
    emailVerified,
    profileComplete,
    sellerProfileSetup: false,
    hasListing: false,
    repairerProfileSetup: false,
    hasPublishedService: false,
  }

  if (role === ROLES.SELLER) {
    const [sellerRow] = await db
      .select({ id: sellerProfiles.id })
      .from(sellerProfiles)
      .where(eq(sellerProfiles.userId, userId))
      .limit(1)

    base.sellerProfileSetup = Boolean(sellerRow)

    const [listingRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(listings)
      .where(eq(listings.sellerId, userId))

    base.hasListing = (listingRow?.count ?? 0) > 0
  }

  if (role === ROLES.REPAIRER) {
    const [repairerRow] = await db
      .select({ id: repairerProfiles.id })
      .from(repairerProfiles)
      .where(eq(repairerProfiles.userId, userId))
      .limit(1)

    base.repairerProfileSetup = Boolean(repairerRow)

    if (repairerRow) {
      const [serviceRow] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(repairerServices)
        .where(and(
          eq(repairerServices.repairerId, repairerRow.id),
          eq(repairerServices.isActive, true),
        ))

      base.hasPublishedService = (serviceRow?.count ?? 0) > 0
    }
  }

  return base
}
