export interface TechnicianProfile {
  id: string
  userId: string
  name: string
  bio: string | null
  hourlyRateCents: number | null
  averageRating: number | null
  totalJobsCompleted: number
  profileTier: 'community' | 'professional'
  city: string | null
  postalCode: string | null
  skills: string[]
  acceptsGratis: boolean
  acceptsKulturlegi: boolean
  isVerified: boolean
  serviceDeliveryTypes: string[]
  // Professional-only fields
  businessName?: string | null
  servicesOffered?: string[]
  emergencyFeeCents?: number | null
  homeVisitFeeCents?: number | null
}
