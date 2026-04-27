/**
 * Shared types for product management components
 */

import type { ShopProduct } from '@/hooks/useShopProducts'
import type { MarketplaceStatus } from '@/config/marketplace-status'

// Re-export ShopProduct for convenience
export type { ShopProduct } from '@/hooks/useShopProducts'

export interface ProductWithOwner {
  id: string
  title: string
  description?: string
  handle?: string
  thumbnail?: string | null
  owner_id?: string
  owner_name?: string
  status?: MarketplaceStatus
}

export interface ProductStats {
  total: number
  published: number
  draft: number
  lowStock: number
  userListings: number
  adminInventory: number
}

export interface InventoryStats {
  total: number
  published: number
  draft: number
  approved: number
  pending: number
}

/**
 * Stats for the shop products tab (published products only)
 */
export interface ShopStats {
  total: number
  byCondition: Record<string, number>
  byCategory: Record<string, number>
  lowStock: number // quantity < 3
}

export type TabType = 'shop' | 'inventory'
export type FilterStatus = 'all' | MarketplaceStatus
export type FilterSource = 'all' | 'admin' | 'user'
