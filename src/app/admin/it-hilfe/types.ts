// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Shared types
// ---------------------------------------------------------------------------

import { HelpCircle, Users } from 'lucide-react'
import type { OffsetPaginatedResponse } from '@/lib/api/types'

export type { OffsetPaginatedResponse as PaginatedResponse }

export interface RequestRow {
  id: string
  title: string
  category_id: string
  urgency: string
  status: string
  postal_code: string
  city: string
  canton: string
  budget_amount_cents: number | null
  budget_type: string
  offer_count: number
  admin_notes: string | null
  created_at: string
  requester_id: string
  requester_name: string | null
  requester_email: string
}

export interface HelperRow {
  id: string
  user_id: string
  bio: string | null
  hourly_rate_cents: number | null
  accepts_gratis: boolean
  accepts_kulturlegi: boolean
  service_types: string[]
  location_city: string | null
  location_canton: string | null
  is_active: boolean
  is_verified: boolean
  verified_at: string | null
  suspended_at: string | null
  admin_notes: string | null
  total_helps_completed: number
  average_rating: number | null
  created_at: string
  helper_name: string | null
  helper_email: string
  skills: string[] | null
}

export interface Stats {
  total: number
  byStatus: Record<string, number>
  byUrgency: Record<string, number>
  activeHelpers: number
  verifiedHelpers: number
  totalOffers: number
  resolutionRate: number
}

export type Tab = 'requests' | 'helpers'

// TABS define the structural list of tabs — labels are resolved at render time
// from admin.itHilfe.tabs.* so they translate per locale.
export const TABS: { id: Tab; labelKey: 'requests' | 'helpers'; icon: typeof HelpCircle }[] = [
  { id: 'requests', labelKey: 'requests', icon: HelpCircle },
  { id: 'helpers', labelKey: 'helpers', icon: Users },
]

export interface RequestFilter {
  status: string
  category: string
  urgency: string
  canton: string
  search: string
}

export interface HelperFilter {
  status: string
  canton: string
}

export interface EditData {
  status: string
  urgency: string
  admin_notes: string
}
