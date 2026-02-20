/**
 * Shared types for repairer pages
 */

export interface RepairerProfile {
  id: string
  user_id?: string
  business_name: string | null
  business_type: string
  description?: string | null
  years_experience?: number
  phone?: string
  website?: string | null
  address?: string
  city: string
  postal_code: string
  service_radius_km?: number
  remote_services?: boolean
  hourly_rate_cents: number | null
  emergency_fee_cents?: number | null
  home_visit_fee_cents: number | null
  average_rating: number
  total_reviews: number
  total_jobs_completed?: number
  completion_rate?: number
  services_offered: string[]
  specializations?: string[]
  certifications?: string[]
  is_verified: boolean
  response_time_hours?: number
  typical_turnaround_days?: number
  warranty_offered?: boolean
  warranty_duration_months?: number | null
  insurance_info?: string | null
  distance_km?: number
  portfolio_images?: string[]
  rating_distribution?: { [key: string]: number }
  review_summary?: {
    timeliness: number
    quality: number
    communication: number
    professionalism: number
    value: number
  }
}

export interface RepairerService {
  id: string
  service_category: string
  service_name: string
  description: string | null
  base_price_cents: number | null
  hourly_rate_cents: number | null
  parts_included: boolean
  estimated_hours: number | null
  estimated_days: number | null
}

export interface RepairerReview {
  id: string
  reviewerName: string
  rating: number
  title: string | null
  content: string | null
  timeliness_rating: number | null
  quality_rating: number | null
  communication_rating: number | null
  isVerifiedPurchase: boolean
  createdAt: string
  response: {
    content: string
    responderName: string
    createdAt: string
  } | null
}

export interface AvailabilitySlot {
  date: string
  start_time: string
  end_time: string
  available?: boolean
}

export interface TimeSlot {
  start_time: string
  end_time: string
  available: boolean
}

export interface AvailabilitySlots {
  [date: string]: TimeSlot[]
}
