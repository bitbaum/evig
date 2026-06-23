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
  preferred_technician_id?: string | null
  preferred_technician_name?: string | null
  preferred_technician_city?: string | null
  offer_count: number
  ai_diagnosis?: string | null
  completed_at?: string | null
  completed_by?: string | null
  reviewed_at?: string | null
  matched_helper_id?: string | null
  /** Display name of the matched helper (auth users table). */
  matched_helper_name?: string | null
  /** Phone of the matched helper (repairer_profiles.phone). Gated to owner. */
  matched_helper_phone?: string | null
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
    preferredTechnicianId: row.preferred_technician_id ?? null,
    preferredTechnicianName: row.preferred_technician_name ?? null,
    preferredTechnicianCity: row.preferred_technician_city ?? null,
    matchedHelperId: row.matched_helper_id ?? null,
    /**
     * Helper name is non-sensitive — same value already shows on the
     * offer cards before acceptance, so we surface it on the list rows
     * too for "matched with X" UI.
     */
    matchedHelperName: row.matched_helper_name ?? null,
    /**
     * Phone is omitted on list rows (only the detail mapper, gated to
     * isOwner, ever exposes it). Default to null here so the list shape
     * matches the detail shape and consumers don't need optional checks.
     */
    matchedHelperPhone: null as string | null,
    offerCount: row.offer_count,
    completedAt: row.completed_at ?? null,
    completedBy: row.completed_by ?? null,
    reviewedAt: row.reviewed_at ?? null,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Map a detail row (includes ownership-gated email, phone, and AI diagnosis) */
export function mapRequestDetailRow(row: RequestRow, isOwner: boolean) {
  return {
    ...mapRequestListRow(row),
    requesterEmail: isOwner ? row.requester_email : undefined,
    /**
     * Helper phone is privacy-sensitive — only return it to the request
     * owner. Without this gate any visitor browsing a public request
     * page could harvest the matched helper's phone. PPP.2.
     */
    matchedHelperPhone: isOwner ? (row.matched_helper_phone ?? null) : null,
    aiDiagnosis: row.ai_diagnosis,
    isOwner,
  }
}
