/**
 * Marketplace & Product Status Configuration
 *
 * SSOT for product publication status and inventory product approval status.
 * Used by: InventoryTable, InventoryProductsTable
 */

export const MARKETPLACE_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
} as const

export type MarketplaceStatus = typeof MARKETPLACE_STATUS[keyof typeof MARKETPLACE_STATUS]
export const MARKETPLACE_STATUS_VALUES = Object.values(MARKETPLACE_STATUS) as [MarketplaceStatus, ...MarketplaceStatus[]]

export const MARKETPLACE_STATUS_LABELS: Record<string, string> = {
  [MARKETPLACE_STATUS.PUBLISHED]: 'Veröffentlicht',
  [MARKETPLACE_STATUS.DRAFT]: 'Entwurf',
}

export const MARKETPLACE_STATUS_BADGES: Record<string, string> = {
  [MARKETPLACE_STATUS.PUBLISHED]: 'bg-primary-100 text-primary-800',
  [MARKETPLACE_STATUS.DRAFT]: 'bg-yellow-100 text-yellow-800',
}

/**
 * Inventory item physical status.
 * CHECK (status IN ('available', 'reserved', 'sold', 'damaged', 'missing'))
 */
export const INVENTORY_ITEM_STATUS = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  SOLD: 'sold',
  DAMAGED: 'damaged',
  MISSING: 'missing',
} as const;

export type InventoryItemStatus = typeof INVENTORY_ITEM_STATUS[keyof typeof INVENTORY_ITEM_STATUS];

/**
 * Inventory product approval status.
 * Uses product-specific labels: 'Freigegeben' (released) instead of 'Genehmigt' (approved).
 */
export const PRODUCT_STATUS = {
  APPROVED: 'approved',
  PENDING_REVIEW: 'pending_review',
  REJECTED: 'rejected',
} as const

export type ProductStatus = typeof PRODUCT_STATUS[keyof typeof PRODUCT_STATUS]
export const PRODUCT_STATUS_VALUES = Object.values(PRODUCT_STATUS) as [ProductStatus, ...ProductStatus[]]

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  [PRODUCT_STATUS.APPROVED]: 'Freigegeben',
  [PRODUCT_STATUS.PENDING_REVIEW]: 'Zur Prüfung',
  [PRODUCT_STATUS.REJECTED]: 'Abgelehnt',
}

export const PRODUCT_STATUS_BADGES: Record<string, string> = {
  [PRODUCT_STATUS.APPROVED]: 'bg-blue-100 text-blue-800',
  [PRODUCT_STATUS.PENDING_REVIEW]: 'bg-orange-100 text-orange-800',
  [PRODUCT_STATUS.REJECTED]: 'bg-red-100 text-red-800',
}

export function getMarketplaceStatusLabel(status: string): string {
  return MARKETPLACE_STATUS_LABELS[status] ?? status
}

export function getMarketplaceStatusBadgeColor(status: string): string {
  return MARKETPLACE_STATUS_BADGES[status] ?? 'bg-neutral-100 text-neutral-800'
}

export function getProductStatusLabel(status: string): string {
  return PRODUCT_STATUS_LABELS[status] ?? status
}

export function getProductStatusBadgeColor(status: string): string {
  return PRODUCT_STATUS_BADGES[status] ?? 'bg-neutral-100 text-neutral-800'
}
