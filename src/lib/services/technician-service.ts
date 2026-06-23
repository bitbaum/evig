/**
 * Technician Service
 *
 * Direct DB access for technician profiles.
 * Used by both the API route and server components to avoid HTTP loopback.
 */

import { db } from '@/db'
import { repairerProfiles, repairerServices, userSkills, users } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { REPAIRER_PROFILE_TIER } from '@/config/repairer-status'

export const TECHNICIAN_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ============================================================================
// Types
// ============================================================================

export interface TechnicianService {
  id: string
  serviceCategory: string
  serviceName: string
  description: string | null
  basePriceCents: number | null
  hourlyRateCents: number | null
  estimatedHours: string | null
}

export interface TechnicianDetail {
  id: string
  userId: string
  name: string | null
  bio: string | null
  hourlyRateCents: number | null
  averageRating: number | null
  totalJobsCompleted: number   // coerced: default 0
  totalReviews: number          // coerced: default 0
  profileTier: string           // coerced: default 'community'
  city: string | null
  postalCode: string | null
  canton: string | null
  acceptsGratis: boolean        // coerced: default false
  acceptsKulturlegi: boolean    // coerced: default false
  isVerified: boolean           // coerced: default false
  serviceDeliveryTypes: string[] | null
  maxTravelKm: number | null
  responseTimeHours: number | null
  createdAt: string | null
  skills: string[]
  services: TechnicianService[]
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Fetch a single active technician profile with skills and services.
 * Returns null if not found or inactive.
 */
export async function getTechnicianById(id: string): Promise<TechnicianDetail | null> {
  const [profile] = await db
    .select({
      id: repairerProfiles.id,
      userId: repairerProfiles.userId,
      name: users.name,
      bio: repairerProfiles.description,
      hourlyRateCents: repairerProfiles.hourlyRateCents,
      averageRating: repairerProfiles.averageRating,
      totalJobsCompleted: repairerProfiles.totalJobsCompleted,
      totalReviews: repairerProfiles.totalReviews,
      profileTier: repairerProfiles.profileTier,
      city: repairerProfiles.city,
      postalCode: repairerProfiles.postalCode,
      canton: repairerProfiles.canton,
      acceptsGratis: repairerProfiles.acceptsGratis,
      acceptsKulturlegi: repairerProfiles.acceptsKulturlegi,
      isVerified: repairerProfiles.isVerified,
      serviceDeliveryTypes: repairerProfiles.serviceDeliveryTypes,
      maxTravelKm: repairerProfiles.maxTravelKm,
      responseTimeHours: repairerProfiles.responseTimeHours,
      createdAt: repairerProfiles.createdAt,
      skills: sql<string[]>`ARRAY_AGG(${userSkills.skillId}) FILTER (WHERE ${userSkills.skillId} IS NOT NULL)`,
    })
    .from(repairerProfiles)
    .innerJoin(users, eq(repairerProfiles.userId, users.id))
    .leftJoin(userSkills, eq(repairerProfiles.userId, userSkills.userId))
    .where(
      and(
        eq(repairerProfiles.id, id),
        eq(repairerProfiles.isActive, true)
      )
    )
    .groupBy(
      repairerProfiles.id,
      repairerProfiles.userId,
      users.name,
      repairerProfiles.description,
      repairerProfiles.hourlyRateCents,
      repairerProfiles.averageRating,
      repairerProfiles.totalJobsCompleted,
      repairerProfiles.totalReviews,
      repairerProfiles.profileTier,
      repairerProfiles.city,
      repairerProfiles.postalCode,
      repairerProfiles.canton,
      repairerProfiles.acceptsGratis,
      repairerProfiles.acceptsKulturlegi,
      repairerProfiles.isVerified,
      repairerProfiles.serviceDeliveryTypes,
      repairerProfiles.maxTravelKm,
      repairerProfiles.responseTimeHours,
      repairerProfiles.createdAt,
    )

  if (!profile) return null

  let services: TechnicianService[] = []

  if (profile.profileTier === REPAIRER_PROFILE_TIER.PROFESSIONAL) {
    services = await db
      .select({
        id: repairerServices.id,
        serviceCategory: repairerServices.serviceCategory,
        serviceName: repairerServices.serviceName,
        description: repairerServices.description,
        basePriceCents: repairerServices.basePriceCents,
        hourlyRateCents: repairerServices.hourlyRateCents,
        estimatedHours: repairerServices.estimatedHours,
      })
      .from(repairerServices)
      .where(
        and(
          eq(repairerServices.repairerId, id),
          eq(repairerServices.isActive, true)
        )
      )
  }

  logger.info('Fetched technician profile', { technicianId: id, tier: profile.profileTier })

  return {
    ...profile,
    // Drizzle decimal comes back as string — parse to number for callers
    averageRating: profile.averageRating != null ? parseFloat(String(profile.averageRating)) : null,
    // Drizzle returns integer-with-default columns as number | null — coerce nulls to 0
    totalJobsCompleted: profile.totalJobsCompleted ?? 0,
    totalReviews: profile.totalReviews ?? 0,
    // Boolean columns with defaults can also be null — coerce
    acceptsGratis: profile.acceptsGratis ?? false,
    acceptsKulturlegi: profile.acceptsKulturlegi ?? false,
    isVerified: profile.isVerified ?? false,
    // profileTier has a default so treat null as the default tier
    profileTier: profile.profileTier ?? REPAIRER_PROFILE_TIER.COMMUNITY,
    skills: profile.skills || [],
    services,
  }
}

/**
 * Resolve a technician by repairer_profiles.id (canonical) or legacy userId.
 * Public URLs and create-flow query params MUST use profile id.
 */
export async function getTechnicianByIdOrUserId(id: string): Promise<TechnicianDetail | null> {
  const byProfileId = await getTechnicianById(id)
  if (byProfileId) return byProfileId

  const [profile] = await db
    .select({ profileId: repairerProfiles.id })
    .from(repairerProfiles)
    .where(and(eq(repairerProfiles.userId, id), eq(repairerProfiles.isActive, true)))

  if (!profile) return null
  return getTechnicianById(profile.profileId)
}
