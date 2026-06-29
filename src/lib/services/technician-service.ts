/**
 * Technician Service
 *
 * Direct DB access for technician profiles.
 * Used by both the API route and server components to avoid HTTP loopback.
 */

import { db } from '@/db'
import { repairerProfiles, repairerServices, userSkills, users, userProfiles } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { logger } from '@/lib/logger'
import { REPAIRER_PROFILE_TIER, REPAIRER_STATUS } from '@/config/repairer-status'
import { IT_SKILLS } from '@/config/it-hilfe'
import type { TechnicianProfileInput } from '@/lib/schemas'

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
  avatarUrl: string | null
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
      avatarUrl: userProfiles.avatarUrl,
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
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
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
      userProfiles.avatarUrl,
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

// ============================================================================
// Self-service profile (community technicians) — read + write
// ============================================================================

export interface TechnicianSelfProfile {
  skills: string[]
  bio: string
  hourlyRateCents: number | null
  acceptsGratis: boolean
  acceptsKulturlegi: boolean
  serviceTypes: string[]
  postalCode: string
  city: string
  canton: string
  maxTravelKm: number
  isActive: boolean
  profileTier: string | null
}

/**
 * Read the current user's own technician profile + skills (the self-service
 * edit shape — keyed by user_id, not profile id). Returns the profile (or a
 * skills-only stub if the user has skills but no profile row yet) and whether a
 * profile row exists.
 */
export async function getTechnicianSelfProfile(
  userId: string,
): Promise<{ profile: TechnicianSelfProfile | null; hasProfile: boolean }> {
  const [profileRow] = await db
    .select({
      bio: repairerProfiles.description,
      hourlyRateCents: repairerProfiles.hourlyRateCents,
      acceptsGratis: repairerProfiles.acceptsGratis,
      acceptsKulturlegi: repairerProfiles.acceptsKulturlegi,
      serviceTypes: repairerProfiles.serviceDeliveryTypes,
      postalCode: repairerProfiles.postalCode,
      city: repairerProfiles.city,
      canton: repairerProfiles.canton,
      maxTravelKm: repairerProfiles.maxTravelKm,
      isActive: repairerProfiles.isActive,
      profileTier: repairerProfiles.profileTier,
    })
    .from(repairerProfiles)
    .where(eq(repairerProfiles.userId, userId))

  const skillRows = await db
    .select({ skillId: userSkills.skillId })
    .from(userSkills)
    .where(eq(userSkills.userId, userId))
  const skills = skillRows.map((r) => r.skillId)

  let profile: TechnicianSelfProfile | null = null
  if (profileRow) {
    profile = {
      skills,
      bio: profileRow.bio || '',
      hourlyRateCents: profileRow.hourlyRateCents,
      acceptsGratis: profileRow.acceptsGratis ?? true,
      acceptsKulturlegi: profileRow.acceptsKulturlegi ?? true,
      serviceTypes: profileRow.serviceTypes || ['flexible'],
      postalCode: profileRow.postalCode || '',
      city: profileRow.city || '',
      canton: profileRow.canton || '',
      maxTravelKm: profileRow.maxTravelKm ?? 10,
      isActive: profileRow.isActive ?? false,
      profileTier: profileRow.profileTier,
    }
  } else if (skills.length > 0) {
    profile = {
      skills,
      bio: '',
      hourlyRateCents: null,
      acceptsGratis: true,
      acceptsKulturlegi: true,
      serviceTypes: ['flexible'],
      postalCode: '',
      city: '',
      canton: '',
      maxTravelKm: 10,
      isActive: false,
      profileTier: REPAIRER_PROFILE_TIER.COMMUNITY,
    }
  }

  return { profile, hasProfile: !!profileRow }
}

/** Resolve a skill id to its IT_SKILLS category (for user_skills.category_id). */
function getCategoryForSkill(skillId: string): string {
  for (const [categoryId, skills] of Object.entries(IT_SKILLS)) {
    if ((skills as Array<{ id: string }>).some((s) => s.id === skillId)) {
      return categoryId
    }
  }
  return 'other'
}

/**
 * Create or update the current user's self-service (community) technician
 * profile, then replace their skill set. Upserts repairer_profiles with
 * tier=community but NEVER demotes an existing professional (tier guard in the
 * conflict update). NOT-NULL placeholder columns (phone/address) default to ''.
 */
export async function upsertTechnicianProfile(
  userId: string,
  input: TechnicianProfileInput,
): Promise<void> {
  const {
    skills, bio, hourlyRateCents, acceptsGratis, acceptsKulturlegi,
    serviceTypes, postalCode, city, canton, maxTravelKm, isActive,
  } = input

  await db
    .insert(repairerProfiles)
    .values({
      userId,
      description: bio || undefined,
      hourlyRateCents,
      acceptsGratis,
      acceptsKulturlegi,
      serviceDeliveryTypes: serviceTypes.length > 0 ? serviceTypes : undefined,
      city: city || '',
      canton: canton || null,
      postalCode: postalCode || '',
      // phone/address are nullable now (migration 104) — self-service community
      // technicians don't enter business contact; leave them NULL, not ''.
      maxTravelKm,
      isActive,
      profileTier: REPAIRER_PROFILE_TIER.COMMUNITY,
      status: REPAIRER_STATUS.ACTIVE,
    })
    .onConflictDoUpdate({
      target: repairerProfiles.userId,
      set: {
        description: bio || null,
        hourlyRateCents,
        acceptsGratis,
        acceptsKulturlegi,
        serviceDeliveryTypes: serviceTypes.length > 0 ? serviceTypes : null,
        city: city || '',
        canton: canton || null,
        postalCode: postalCode || '',
        maxTravelKm,
        isActive,
        // Never demote a verified professional via this self-service endpoint.
        profileTier: sql`CASE WHEN ${repairerProfiles.profileTier} = ${REPAIRER_PROFILE_TIER.PROFESSIONAL} THEN ${REPAIRER_PROFILE_TIER.PROFESSIONAL} ELSE ${REPAIRER_PROFILE_TIER.COMMUNITY} END`,
        updatedAt: sql`NOW()`,
      },
    })

  // Replace skills: delete existing, insert new.
  await db.delete(userSkills).where(eq(userSkills.userId, userId))
  if (skills.length > 0) {
    await db.insert(userSkills).values(
      skills.map((skillId) => ({
        userId,
        skillId,
        categoryId: getCategoryForSkill(skillId),
      })),
    )
  }
}
