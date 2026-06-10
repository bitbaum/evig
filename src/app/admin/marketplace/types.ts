import { Package, AlertTriangle, ShoppingBag } from 'lucide-react'
import type { OffsetPaginatedResponse } from '@/lib/api/types'

export type { OffsetPaginatedResponse as PaginatedResponse }

// ---------------------------------------------------------------------------
// Data types
// ---------------------------------------------------------------------------

export interface ListingRow {
  id: string
  title: string
  price_chf: number
  category: string
  condition: string | null
  status: string
  is_revampit: boolean
  verified_at: string | null
  admin_notes: string | null
  created_at: string
  seller_id: string
  seller_name: string | null
  seller_email: string
  report_count: string
}

export interface ReportRow {
  id: string
  reason: string
  details: string | null
  status: string
  created_at: string
  reviewed_at: string | null
  resolution_notes: string | null
  resolution_action: string | null
  listing_id: string
  listing_title: string
  listing_status: string
  reporter_name: string | null
  reporter_email: string
  seller_name: string | null
  seller_email: string
}

export interface OrderRow {
  id: string
  status: string
  total_cents: number
  delivery_method: string
  tracking_number: string | null
  created_at: string
  listing_id: string
  listing_title: string
  buyer_name: string | null
  buyer_email: string
  seller_name: string | null
  seller_email: string
}

export interface Stats {
  total: number
  byStatus: Record<string, number>
  verified: number
  unverified: number
  revampit: number
  community: number
  openReports: number
  totalOrders: number
  revenueCents: number
}

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

export type Tab = 'listings' | 'reports' | 'orders'

// TABS define the structural list of tabs — labels are resolved at render
// time from admin.marketplace.tabs.* so they translate per locale.
export const TABS: { id: Tab; labelKey: 'listings' | 'reports' | 'orders'; icon: typeof Package }[] = [
  { id: 'listings', labelKey: 'listings', icon: Package },
  { id: 'reports', labelKey: 'reports', icon: AlertTriangle },
  { id: 'orders', labelKey: 'orders', icon: ShoppingBag },
]
