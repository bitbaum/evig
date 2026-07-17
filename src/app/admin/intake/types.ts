import type { IntakeTier, ChecklistState, ChecklistCategory, ChecklistResult } from '@/config/intake-checklist'

export interface ChecklistProgress {
  completed: number
  total: number
  requiredCompleted: number
  requiredTotal: number
  /** Items with a 'fail' verdict. */
  failed: number
  percentage: number
}

export interface PipelineItem {
  id: string
  ai_product_id: string
  item_uuid: string
  product_name: string
  brand: string
  condition: string
  category: string | null
  subcategory: string | null
  short_description: string | null
  /** NULL when no physical quality/parts/recycling checklist was selected. */
  intake_tier: IntakeTier | null
  intake_checklist: ChecklistState
  checklist_complete: boolean
  checklist_failed: boolean
  checklist_progress: ChecklistProgress
  marketplace_status: string
  selling_price_chf: number | null
  source_donation_id: string | null
  donor_name: string | null
  created_by_name: string | null
  created_at: string
}

export interface ChecklistItemWithState {
  id: string
  label: string
  description: string
  category: ChecklistCategory
  required: boolean
  /** Vier-Augen-Prinzip — must be signed off by a second person. */
  requiresSecondPerson?: boolean
  state: {
    result: ChecklistResult | null
    completedBy: string | null
    completedAt: string | null
    notes: string
  }
}

export interface ChecklistGroup {
  category: string
  label: string
  items: ChecklistItemWithState[]
}

export interface DetailData {
  id: string
  item_uuid: string
  brand: string
  product_name: string
  short_description: string | null
  condition: string
  category: string | null
  image_url: string | null
  /** Live marketplace listing for this device (set once published). */
  listing_id: string | null
  /** NULL when no physical quality/parts/recycling checklist was selected. */
  intake_tier: IntakeTier | null
  marketplace_status: string
  selling_price_chf: number | null
  source_donation_id: string | null
  donor_name: string | null
  donor_email: string | null
  created_at: string
  created_by_name: string | null
  checklist_complete: boolean
  checklist_failed: boolean
  checklist_progress: ChecklistProgress
  checklist_grouped: ChecklistGroup[]
  intake_events: import('@/lib/intake/timeline-types').StoredIntakeEvent[]
}
