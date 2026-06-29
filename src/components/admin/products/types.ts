/**
 * Shared types for product management components
 */

import type { MarketplaceStatus } from '@/config/marketplace-status'

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

export type FilterStatus = 'all' | MarketplaceStatus
export type FilterSource = 'all' | 'admin' | 'user'
