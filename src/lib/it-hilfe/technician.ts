import { db } from '@/db'
import { repairerProfiles } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

/**
 * SSOT for "is this user a registered technician who may offer IT-Hilfe".
 *
 * A registered technician has an ACTIVE repairer profile (the table is still
 * named `repairer_profiles` for historical reasons — repairer/techniker are the
 * same concept). Returns the profile id so callers can auto-link an offer to it,
 * or null when the user hasn't registered as a technician.
 *
 * Community help is a two-sided marketplace: only people who took the step of
 * creating a technician profile can respond to requests. Both the offer-create
 * boundary (hard 403) and the request-detail view (to show the right UI) derive
 * eligibility from here, so the rule lives in exactly one place.
 */
export async function getActiveTechnicianProfileId(userId: string): Promise<string | null> {
  const rows = await db
    .select({ id: repairerProfiles.id })
    .from(repairerProfiles)
    .where(and(eq(repairerProfiles.userId, userId), eq(repairerProfiles.isActive, true)))
  return rows[0]?.id ?? null
}
