// ---------------------------------------------------------------------------
// IT-Hilfe Admin — Shared types
// ---------------------------------------------------------------------------

import { HelpCircle, Users } from 'lucide-react'

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

export interface PaginatedResponse<T> {
  items: T[]
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
}

export type Tab = 'requests' | 'helpers'

export const TABS: { id: Tab; label: string; icon: typeof HelpCircle }[] = [
  { id: 'requests', label: 'Anfragen', icon: HelpCircle },
  { id: 'helpers', label: 'Helfer', icon: Users },
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
