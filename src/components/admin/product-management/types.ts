import { MedusaProduct } from '@/lib/medusa/hooks'

export interface InventoryProduct {
  id: string
  item_uuid: string
  product_name: string
  brand: string
  short_description: string | null
  estimated_price_chf: number
  condition: string
  category: string | null
  subcategory: string | null
  status: string
  created_at: string
  location: string | null
  box_id: string | null
  quantity_available: number
  marketplace_status: string
  customer_profiles: string[]
}

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

export interface InventoryStatsData {
  total: number
  published: number
  draft: number
  approved: number
  pending: number
}

export type FilterStatus = 'all' | 'published' | 'draft'
export type FilterSource = 'all' | 'admin' | 'user'
export type ActiveTab = 'medusa' | 'inventory'
