/**
 * Service Layer - Index
 *
 * Central export point for all services.
 * Import from here for consistent access to business logic layer.
 *
 * @example
 * ```typescript
 * // Payment service
 * import { PaymentService } from '@/lib/services'
 * const paymentService = new PaymentService()
 *
 * // Unified service data (services = Dienstleistungen)
 * import { getService, getFeaturedServices } from '@/lib/services'
 * const service = await getService('computer-repair-upgrades')
 * const featured = await getFeaturedServices()
 * ```
 */

// Payment service
export { PaymentService } from './payment-service'

// Inventory service (public shop)
export { getInventoryProducts } from './inventory-service'
export type { InventoryFilters, InventoryProduct, InventoryResult } from './inventory-service'

// Seller service (seller dashboard)
export { getSellerDashboard } from './seller-service'
export type { SellerProduct, SellerStats, SellerDashboardData } from './seller-service'

// Order service
export { createOrder } from './order-service'
export type { CreateOrderParams, CreatedOrder, ShippingAddress } from './order-service'

// ============================================================================
// Unified Service Layer (Dienstleistungen)
// ============================================================================
// Combines operational data (from service_types table) with
// presentation data (from config) for a unified API.

import {
  getAllServiceTypes,
  getFeaturedServiceTypes,
  getBookableServiceTypes,
  getServiceTypeBySlug,
  getServiceTypeById,
  getServiceTypesByCategory,
  getAllServiceSlugs as getAllServiceSlugsFromDb,
  // Admin functions
  getAllServiceTypesForAdmin,
  updateServiceType,
  createServiceType,
  deleteServiceType,
  type UpdateServiceTypeData,
} from './db'
import {
  getServicePresentation,
  getServicePricing,
  formatPrice as formatPriceUtil,
  servicePresentation,
} from './presentation'
import { getIconByName } from '@/config/service-icons'
import type {
  DbServiceType,
  UnifiedService,
  ServiceListItem,
  ServiceCategory,
  ServiceFeature,
} from './types'

// Re-export types
export type {
  UnifiedService,
  ServiceListItem,
  ServiceCategory,
  ServiceFeature,
  ServiceProcess,
  ServicePricing,
  ServiceHero,
} from './types'

export { SERVICE_CATEGORY_LABELS } from './types'

/**
 * Format price from cents to display string
 */
export const formatPrice = formatPriceUtil

// ============================================================================
// Internal: Merge DB + Presentation
// ============================================================================

/**
 * Convert DB feature JSON to ServiceFeature with resolved icon
 */
function convertFeatures(
  dbFeatures: DbServiceType['features_json'],
  fallbackFeatures: ServiceFeature[]
): ServiceFeature[] {
  // If DB has features, use them
  if (dbFeatures && dbFeatures.length > 0) {
    return dbFeatures.map((f) => ({
      title: f.title,
      description: f.description,
      icon: getIconByName(f.icon),
    }))
  }
  // Fall back to presentation.ts
  return fallbackFeatures
}

/**
 * Merge database service with presentation config
 * Priority: DB content > presentation.ts fallback
 */
function mergeServiceData(dbService: DbServiceType): UnifiedService {
  // Get fallback presentation from config
  const fallbackPresentation = getServicePresentation(dbService.slug)
  const fallbackPricing = getServicePricing(dbService.slug, dbService.price_cents)

  // Build hero section - prefer DB, fall back to presentation.ts
  const hero = {
    title: dbService.hero_title || fallbackPresentation.hero.title,
    subtitle: dbService.hero_subtitle || fallbackPresentation.hero.subtitle,
    description: dbService.hero_description || fallbackPresentation.hero.description,
  }

  // Resolve icon from DB string name, fall back to presentation.ts
  const icon = dbService.icon_name
    ? getIconByName(dbService.icon_name)
    : fallbackPresentation.icon

  // Features - prefer DB, fall back to presentation.ts
  const features = convertFeatures(dbService.features_json, fallbackPresentation.features)

  // Process - prefer DB, fall back to presentation.ts
  const process = (dbService.process_json && dbService.process_json.length > 0)
    ? dbService.process_json
    : fallbackPresentation.process

  // Pricing - prefer DB, fall back to computed/override
  const pricing = {
    base: dbService.pricing_base || fallbackPricing.base,
    details: (dbService.pricing_details && dbService.pricing_details.length > 0)
      ? dbService.pricing_details
      : fallbackPricing.details,
    mediaPrices: dbService.pricing_media_prices || fallbackPricing.mediaPrices,
  }

  return {
    // Identifiers
    id: dbService.id,
    slug: dbService.slug,

    // Basic info (prefer hero title for display name)
    name: hero.title || dbService.name,
    description: dbService.description || '',
    category: dbService.category,

    // Operational (from DB)
    durationMinutes: dbService.duration_minutes,
    priceCents: dbService.price_cents,
    requiresApproval: dbService.requires_approval,
    isActive: dbService.is_active,
    isBookable: dbService.is_bookable,
    isFeatured: dbService.is_featured,
    displayOrder: dbService.display_order,

    // Presentation (DB preferred, fallback to config)
    icon,
    hero,
    features,
    process,

    // Computed pricing
    pricing,

    // Timestamps
    createdAt: dbService.created_at,
    updatedAt: dbService.updated_at,
  }
}

/**
 * Convert to list item (minimal data for lists)
 */
function toListItem(service: UnifiedService): ServiceListItem {
  return {
    id: service.id,
    slug: service.slug,
    name: service.name,
    description: service.description,
    category: service.category,
    icon: service.icon,
    priceCents: service.priceCents,
    priceDisplay: service.pricing.base,
    isBookable: service.isBookable,
    isFeatured: service.isFeatured,
    displayOrder: service.displayOrder,
  }
}

// ============================================================================
// Presentation-only fallback
// ============================================================================

/**
 * Create a UnifiedService from presentation data alone (no DB entry required).
 * Used as fallback when a service has presentation config but no DB record yet.
 */
function createPresentationOnlyService(slug: string): UnifiedService | null {
  const presentation = servicePresentation[slug]
  if (!presentation) return null

  const pricing = presentation.pricingOverride || { base: 'Auf Anfrage', details: [] }

  return {
    id: `presentation-${slug}`,
    slug,
    name: presentation.hero.title,
    description: presentation.hero.description,
    category: null,
    durationMinutes: 60,
    priceCents: null,
    requiresApproval: false,
    isActive: true,
    isBookable: false,
    isFeatured: true,
    displayOrder: 99,
    icon: presentation.icon,
    hero: presentation.hero,
    features: presentation.features,
    process: presentation.process,
    pricing,
    createdAt: new Date(),
    updatedAt: null,
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get a single service by slug
 * Returns full unified service with all presentation data
 * Falls back to presentation-only data if not in database
 */
export async function getService(slug: string): Promise<UnifiedService | null> {
  const dbService = await getServiceTypeBySlug(slug)
  if (dbService) return mergeServiceData(dbService)
  // Fallback: create from presentation config if available
  return createPresentationOnlyService(slug)
}

/**
 * Get a single service by ID
 * Returns full unified service with all presentation data
 */
export async function getServiceById(id: string): Promise<UnifiedService | null> {
  const dbService = await getServiceTypeById(id)
  if (!dbService) return null
  return mergeServiceData(dbService)
}

/**
 * Get all active services
 * Returns full unified services
 */
export async function getAllServices(): Promise<UnifiedService[]> {
  const dbServices = await getAllServiceTypes()
  return dbServices.map(mergeServiceData)
}

/**
 * Get featured services (for main /services page)
 * Returns full unified services
 */
export async function getFeaturedServices(): Promise<UnifiedService[]> {
  const dbServices = await getFeaturedServiceTypes()
  return dbServices.map(mergeServiceData)
}

/**
 * Get bookable services (for appointment booking)
 * Returns full unified services
 */
export async function getBookableServices(): Promise<UnifiedService[]> {
  const dbServices = await getBookableServiceTypes()
  return dbServices.map(mergeServiceData)
}

/**
 * Get services by category
 * Returns full unified services
 */
export async function getServicesByCategory(
  category: ServiceCategory
): Promise<UnifiedService[]> {
  const dbServices = await getServiceTypesByCategory(category)
  return dbServices.map(mergeServiceData)
}

/**
 * Get all featured services as list items (minimal data)
 * Use this for service cards/grids where full data isn't needed
 */
export async function getFeaturedServiceList(): Promise<ServiceListItem[]> {
  const services = await getFeaturedServices()
  return services.map(toListItem)
}

/**
 * Get all bookable services as list items (minimal data)
 */
export async function getBookableServiceList(): Promise<ServiceListItem[]> {
  const services = await getBookableServices()
  return services.map(toListItem)
}

/**
 * Get all service slugs (for static generation)
 * Merges DB slugs with presentation config slugs to ensure all nav-linked services are covered
 */
export async function getAllServiceSlugs(): Promise<string[]> {
  const dbSlugs = await getAllServiceSlugsFromDb()
  // Add any presentation-only slugs not already in DB results
  const presentationSlugs = Object.keys(servicePresentation)
  const allSlugs = new Set([...dbSlugs, ...presentationSlugs])
  return Array.from(allSlugs)
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a service exists and is active
 */
export async function serviceExists(slug: string): Promise<boolean> {
  const service = await getServiceTypeBySlug(slug)
  return service !== null
}

/**
 * Check if a service is bookable
 */
export async function isServiceBookable(slug: string): Promise<boolean> {
  const service = await getServiceTypeBySlug(slug)
  return service?.is_bookable ?? false
}

/**
 * Get service for booking (ensures it's bookable)
 * Returns null if service doesn't exist or isn't bookable
 */
export async function getServiceForBooking(
  slug: string
): Promise<UnifiedService | null> {
  const service = await getService(slug)
  if (!service || !service.isBookable) return null
  return service
}

// ============================================================================
// Admin Functions
// ============================================================================

/**
 * Get all services for admin (includes inactive)
 * Returns raw DB services with all fields
 */
export async function getAdminServices(): Promise<DbServiceType[]> {
  return getAllServiceTypesForAdmin()
}

/**
 * Get a single service by ID for admin editing
 * Returns raw DB service (not unified, to preserve DB field names)
 */
export async function getAdminServiceById(id: string): Promise<DbServiceType | null> {
  return getServiceTypeById(id)
}

/**
 * Update a service type
 */
export { updateServiceType, createServiceType, deleteServiceType }
export type { UpdateServiceTypeData }

// Re-export DbServiceType for admin components
export type { DbServiceType, DbFeatureJson, DbProcessJson } from './types'
