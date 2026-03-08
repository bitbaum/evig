import { Package, AlertTriangle, ShoppingBag } from 'lucide-react'

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

export interface PaginatedResponse<T> {
  items: T[]
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
}

// ---------------------------------------------------------------------------
// Tab config
// ---------------------------------------------------------------------------

export type Tab = 'listings' | 'reports' | 'orders'

export const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: 'listings', label: 'Inserate', icon: Package },
  { id: 'reports', label: 'Meldungen', icon: AlertTriangle },
  { id: 'orders', label: 'Bestellungen', icon: ShoppingBag },
]
