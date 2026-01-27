/**
 * Shared types for product management components
 */

import type { MedusaProduct } from '@/lib/medusa/hooks'

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

export type TabType = 'medusa' | 'inventory'
export type FilterStatus = 'all' | 'published' | 'draft'
export type FilterSource = 'all' | 'admin' | 'user'
