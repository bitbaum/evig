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
  totalJobsCompleted: number
  totalReviews: number
  profileTier: string
  city: string | null
  postalCode: string | null
  acceptsGratis: boolean
  acceptsKulturlegi: boolean
  isVerified: boolean
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
    // Drizzle decimal columns come back as strings — parse to number for callers
    averageRating: profile.averageRating != null ? parseFloat(String(profile.averageRating)) : null,
    skills: profile.skills || [],
    services,
  }
}
