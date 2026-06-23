/**
 * Legacy response shape for deprecated /api/it-hilfe/helpers/[id].
 * Maps unified TechnicianDetail → snake_case helper fields expected by old clients.
 */

import type { TechnicianDetail } from '@/lib/services/technician-service'

/** @deprecated Use TechnicianDetail from /api/technicians/[id] instead */
export interface LegacyHelperProfile {
  id: string
  userId: string
  name: string | null
  bio: string | null
  hourlyRateCents: number | null
  acceptsGratis: boolean
  acceptsKulturlegi: boolean
  serviceTypes: string[]
  locationCity: string | null
  locationCanton: string | null
  maxTravelKm: number | null
  isVerified: boolean
  averageRating: number | null
  totalHelpsCompleted: number
  createdAt: string | null
  skills: string[]
}

export function toLegacyHelperProfile(technician: TechnicianDetail): LegacyHelperProfile {
  return {
    id: technician.id,
    userId: technician.userId,
    name: technician.name,
    bio: technician.bio,
    hourlyRateCents: technician.hourlyRateCents,
    acceptsGratis: technician.acceptsGratis,
    acceptsKulturlegi: technician.acceptsKulturlegi,
    serviceTypes: technician.serviceDeliveryTypes || [],
    locationCity: technician.city,
    locationCanton: technician.canton ?? null,
    maxTravelKm: technician.maxTravelKm,
    isVerified: technician.isVerified,
    averageRating: technician.averageRating,
    totalHelpsCompleted: technician.totalJobsCompleted,
    createdAt: technician.createdAt,
    skills: technician.skills,
  }
}
