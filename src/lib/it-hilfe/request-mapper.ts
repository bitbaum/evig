/**
 * IT-Hilfe Request Row Mapper
 *
 * Shared between list and detail API routes.
 * Maps snake_case DB rows to camelCase API responses.
 */

export interface RequestRow {
  id: string
  requester_id: string
  requester_name: string
  requester_email?: string
  category_id: string
  device_brand: string | null
  device_model: string | null
  title: string
  description: string
  urgency: string
  budget_type: string
  budget_amount_cents: number | null
  postal_code: string
  city: string
  canton: string
  service_type: string
  skills_needed: string[] | null
  image_urls: string[] | null
  status: string
  matched_offer_id: string | null
  offer_count: number
  ai_diagnosis?: string | null
  completed_at?: string | null
  completed_by?: string | null
  reviewed_at?: string | null
  matched_helper_id?: string | null
  expires_at: string
  created_at: string
  updated_at: string
}

/** Map a list row (no email, no AI diagnosis) */
export function mapRequestListRow(row: RequestRow) {
  return {
    id: row.id,
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    categoryId: row.category_id,
    deviceBrand: row.device_brand,
    deviceModel: row.device_model,
    title: row.title,
    description: row.description,
    urgency: row.urgency,
    budgetType: row.budget_type,
    budgetAmountCents: row.budget_amount_cents,
    postalCode: row.postal_code,
    city: row.city,
    canton: row.canton,
    serviceType: row.service_type,
    skillsNeeded: row.skills_needed || [],
    imageUrls: row.image_urls || [],
    status: row.status,
    matchedOfferId: row.matched_offer_id,
    matchedHelperId: row.matched_helper_id ?? null,
    offerCount: row.offer_count,
    completedAt: row.completed_at ?? null,
    completedBy: row.completed_by ?? null,
    reviewedAt: row.reviewed_at ?? null,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Map a detail row (includes ownership-gated email and AI diagnosis) */
export function mapRequestDetailRow(row: RequestRow, isOwner: boolean) {
  return {
    ...mapRequestListRow(row),
    requesterEmail: isOwner ? row.requester_email : undefined,
    aiDiagnosis: row.ai_diagnosis,
    isOwner,
  }
}
