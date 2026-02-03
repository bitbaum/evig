/**
 * Shared types for product management components
 */

import type { MedusaProduct } from '@/lib/medusa/hooks'
import type { ShopProduct } from '@/hooks/useShopProducts'

// Re-export ShopProduct for convenience
export type { ShopProduct } from '@/hooks/useShopProducts'

export interface ProductWithOwner extends MedusaProduct {
  owner_id?: string
  owner_name?: string
  status?: 'published' | 'draft'
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
export type FilterStatus = 'all' | 'published' | 'draft'
export type FilterSource = 'all' | 'admin' | 'user'
