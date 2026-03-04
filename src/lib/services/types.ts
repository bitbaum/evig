/**
 * Service Types
 *
 * TypeScript interfaces for the unified service layer.
 * Combines operational data (from service_types table) with
 * presentation data (from config/services table).
 */

import type { LucideIcon } from 'lucide-react'

// ============================================================================
// Database Types (from service_types table)
// ============================================================================

/**
 * Feature stored in JSONB
 */
export interface DbFeatureJson {
  title: string
  description: string
  icon: string
}

/**
 * Process step stored in JSONB
 */
export interface DbProcessJson {
  step: number
  title: string
  description: string
}

/**
 * Raw service type from database
 */
export interface DbServiceType {
  id: string
  slug: string
  name: string
  description: string | null
  category: string | null
  duration_minutes: number
  price_cents: number | null
  requires_approval: boolean
  is_active: boolean
  is_bookable: boolean
  is_featured: boolean
  display_order: number
  created_at: Date
  updated_at: Date | null

  // Presentation fields (added in migration 018)
  icon_name: string | null
  hero_title: string | null
  hero_subtitle: string | null
  hero_description: string | null
  features_json: DbFeatureJson[] | null
  process_json: DbProcessJson[] | null
  pricing_base: string | null
  pricing_details: string[] | null
  pricing_media_prices: string[] | null
}

// ============================================================================
// Presentation Types (from config)
// ============================================================================

export interface ServiceFeature {
  title: string
  description: string
  icon: LucideIcon
}

export interface ServiceProcess {
  step: number
  title: string
  description: string
}

export interface ServicePricing {
  base: string
  details: string[]
  mediaPrices?: string[]
}

export interface ServiceHero {
  title: string
  subtitle: string
  description: string
}

/**
 * Presentation config for a service
 * Contains rich display information not stored in database
 */
export interface ServicePresentation {
  icon: LucideIcon
  hero: ServiceHero
  features: ServiceFeature[]
  process?: ServiceProcess[]
  /** Override pricing display (if different from DB calculation) */
  pricingOverride?: ServicePricing
}

// ============================================================================
// Unified Service Type
// ============================================================================

/**
 * Unified service combining operational + presentation data
 * This is what components should use
 */
export interface UnifiedService {
  // Identifiers
  id: string
  slug: string

  // Basic info (from DB)
  name: string
  description: string
  category: string | null

  // Operational (from DB)
  durationMinutes: number
  priceCents: number | null
  requiresApproval: boolean
  isActive: boolean
  isBookable: boolean
  isFeatured: boolean
  displayOrder: number

  // Presentation (from config)
  icon: LucideIcon
  hero: ServiceHero
  features: ServiceFeature[]
  process?: ServiceProcess[]

  // Computed pricing
  pricing: ServicePricing

  // Timestamps
  createdAt: Date
  updatedAt: Date | null
}

/**
 * Minimal service for list views
 */
export interface ServiceListItem {
  id: string
  slug: string
  name: string
  description: string
  category: string | null
  icon: LucideIcon
  priceCents: number | null
  priceDisplay: string
  isBookable: boolean
  isFeatured: boolean
  displayOrder: number
}

// ============================================================================
// Category Type — re-exported from SSOT (config/database.ts)
// ============================================================================

import type { ServiceCategory } from '@/config/database'
export type { ServiceCategory }

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  repair: 'Reparatur',
  data: 'Daten',
  recycling: 'Recycling',
  software: 'Software',
  web: 'Web',
  general: 'Allgemein',
}
