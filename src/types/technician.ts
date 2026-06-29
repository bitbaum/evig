/**
 * Canonical Technician type — SSOT for the entity formerly known as
 * helper / repairer / technician across the codebase.
 *
 * One DB row in `repairer_profiles` (still named that for historical
 * reasons; DB column rename is deferred to QQQ.5) → one type here.
 * Tier distinction lives in `profileTier`:
 *
 *   - 'community'    = IT-Hilfe community responder (volunteer / informal)
 *   - 'professional' = formal service provider (registered business / pro)
 *
 * Two flows on top of the same entity:
 *   - IT-Hilfe: technician submits an "offer" on a "request"
 *   - Services: technician accepts an "appointment" booking
 *
 * No more "Helper" or "Repairer" types — everything is Technician.
 */

export type TechnicianTier = 'community' | 'professional'

export interface Technician {
  /** Repairer-profile UUID (will be renamed to technician_profiles in QQQ.5). */
  id: string
  /** FK to users.id — owner of this technician profile. */
  userId: string
  /** Display name joined from users.name. */
  name: string

  // Profile content
  bio: string | null

  // Location
  city: string | null
  postalCode: string | null
  canton: string | null
  /** Max travel distance for onsite jobs. Community-tier only convention. */
  maxTravelKm: number | null

  // Pricing
  hourlyRateCents: number | null
  acceptsGratis: boolean
  acceptsKulturlegi: boolean

  // Capabilities
  skills: string[]
  /**
   * How the technician delivers service — 'remote', 'onsite', 'pickup',
   * 'dropoff', 'flexible'. DB column: service_delivery_types.
   * NOTE: This is NOT the same as the `service_types` catalog table.
   */
  serviceDeliveryTypes: string[] | null

  // Classification
  profileTier: TechnicianTier

  // Status
  isActive: boolean
  isVerified: boolean

  // Aggregated stats (denormalized on the profile row)
  averageRating: number | null
  totalJobsCompleted: number
  totalReviews: number

  // Professional-tier-only enrichment (optional)
  businessName?: string | null
  servicesOffered?: string[]
  emergencyFeeCents?: number | null
  homeVisitFeeCents?: number | null
}

// The write-shape for self-service technician edits is the single
// `TechnicianProfileInput` derived from the Zod schema in
// `src/lib/schemas/repairer.ts` (z.infer<typeof TechnicianProfileSchema>) —
// don't redefine a second one here.
