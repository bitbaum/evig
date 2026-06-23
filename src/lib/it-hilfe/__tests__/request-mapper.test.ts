/**
 * Tests for IT-Hilfe request row mappers (lib/it-hilfe/request-mapper.ts).
 *
 * Pure snake_case (DB) → camelCase (API) mappers shared by the list and
 * detail routes. They power the mission-critical repair-needs ↔ helper
 * matchmaking flow, so every field is asserted explicitly:
 *
 * - mapRequestListRow strips requester_email and ai_diagnosis (these
 *   are ownership-gated to detail responses only)
 * - mapRequestDetailRow exposes requester_email ONLY when isOwner=true
 *   (anti-leak: never returns the requester's email to other helpers)
 * - Null-coalescence is asserted at the boundaries: null DB columns
 *   appear as null in the API, and undefined optional columns are
 *   normalized to null (so the JSON envelope is consistent)
 */

import { mapRequestListRow, mapRequestDetailRow, type RequestRow } from '../request-mapper'

const baseRow: RequestRow = {
  id: 'req-1',
  requester_id: 'user-1',
  requester_name: 'Anna',
  requester_email: 'anna@example.com',
  category_id: 'electronics',
  device_brand: 'Lenovo',
  device_model: 'T480',
  title: 'Mein Laptop bootet nicht',
  description: 'Beim Drücken des Power-Knopfes passiert nichts.',
  urgency: 'normal',
  budget_type: 'flexible',
  budget_amount_cents: 5000,
  postal_code: '8004',
  city: 'Zürich',
  canton: 'Zürich',
  service_type: 'flexible',
  skills_needed: ['hardware_diagnosis'],
  image_urls: ['/uploads/a.jpg'],
  status: 'open',
  matched_offer_id: null,
  preferred_technician_id: 'tech-profile-1',
  offer_count: 3,
  ai_diagnosis: 'Likely a power supply issue.',
  completed_at: null,
  completed_by: null,
  reviewed_at: null,
  matched_helper_id: null,
  expires_at: '2026-12-31T23:59:59Z',
  created_at: '2026-01-01T10:00:00Z',
  updated_at: '2026-01-01T10:00:00Z',
}

// ============================================================================
// mapRequestListRow
// ============================================================================

describe('mapRequestListRow', () => {
  it('maps every snake_case field to its camelCase counterpart', () => {
    const result = mapRequestListRow(baseRow)
    expect(result.id).toBe('req-1')
    expect(result.requesterId).toBe('user-1')
    expect(result.requesterName).toBe('Anna')
    expect(result.categoryId).toBe('electronics')
    expect(result.deviceBrand).toBe('Lenovo')
    expect(result.deviceModel).toBe('T480')
    expect(result.title).toBe(baseRow.title)
    expect(result.description).toBe(baseRow.description)
    expect(result.urgency).toBe('normal')
    expect(result.budgetType).toBe('flexible')
    expect(result.budgetAmountCents).toBe(5000)
    expect(result.postalCode).toBe('8004')
    expect(result.city).toBe('Zürich')
    expect(result.canton).toBe('Zürich')
    expect(result.serviceType).toBe('flexible')
    expect(result.status).toBe('open')
    expect(result.matchedOfferId).toBeNull()
    expect(result.preferredTechnicianId).toBe('tech-profile-1')
    expect(result.preferredTechnicianName).toBeNull()
    expect(result.preferredTechnicianCity).toBeNull()
    expect(result.offerCount).toBe(3)
    expect(result.expiresAt).toBe('2026-12-31T23:59:59Z')
    expect(result.createdAt).toBe('2026-01-01T10:00:00Z')
    expect(result.updatedAt).toBe('2026-01-01T10:00:00Z')
  })

  it('maps preferred technician display fields when present', () => {
    const result = mapRequestListRow({
      ...baseRow,
      preferred_technician_name: 'George',
      preferred_technician_city: 'Zürich',
    })
    expect(result.preferredTechnicianName).toBe('George')
    expect(result.preferredTechnicianCity).toBe('Zürich')
  })

  it('does NOT expose requester_email (list route is public to all helpers)', () => {
    const result = mapRequestListRow(baseRow) as Record<string, unknown>
    expect(result.requesterEmail).toBeUndefined()
    expect(result.email).toBeUndefined()
  })

  it('does NOT expose ai_diagnosis (detail-only field)', () => {
    const result = mapRequestListRow(baseRow) as Record<string, unknown>
    expect(result.aiDiagnosis).toBeUndefined()
  })

  it('coerces null skills_needed to an empty array', () => {
    const result = mapRequestListRow({ ...baseRow, skills_needed: null })
    expect(result.skillsNeeded).toEqual([])
  })

  it('coerces null image_urls to an empty array', () => {
    const result = mapRequestListRow({ ...baseRow, image_urls: null })
    expect(result.imageUrls).toEqual([])
  })

  it('preserves an existing skills_needed array', () => {
    const skills = ['hardware_diagnosis', 'software_install']
    const result = mapRequestListRow({ ...baseRow, skills_needed: skills })
    expect(result.skillsNeeded).toEqual(skills)
  })

  it('normalizes undefined optional matched_helper_id to null', () => {
    const { matched_helper_id, ...rowWithoutHelper } = baseRow
    void matched_helper_id // explicit drop
    const result = mapRequestListRow(rowWithoutHelper as RequestRow)
    expect(result.matchedHelperId).toBeNull()
  })

  it('normalizes undefined completed_at / completed_by / reviewed_at to null', () => {
    const result = mapRequestListRow({
      ...baseRow,
      completed_at: undefined,
      completed_by: undefined,
      reviewed_at: undefined,
    } as RequestRow)
    expect(result.completedAt).toBeNull()
    expect(result.completedBy).toBeNull()
    expect(result.reviewedAt).toBeNull()
  })

  it('passes through populated lifecycle timestamps', () => {
    const result = mapRequestListRow({
      ...baseRow,
      completed_at: '2026-02-01T12:00:00Z',
      completed_by: 'helper-42',
      reviewed_at: '2026-02-02T08:00:00Z',
    })
    expect(result.completedAt).toBe('2026-02-01T12:00:00Z')
    expect(result.completedBy).toBe('helper-42')
    expect(result.reviewedAt).toBe('2026-02-02T08:00:00Z')
  })

  it('preserves null device fields (optional in real data)', () => {
    const result = mapRequestListRow({ ...baseRow, device_brand: null, device_model: null })
    expect(result.deviceBrand).toBeNull()
    expect(result.deviceModel).toBeNull()
  })

  it('preserves null budget_amount_cents (optional)', () => {
    const result = mapRequestListRow({ ...baseRow, budget_amount_cents: null })
    expect(result.budgetAmountCents).toBeNull()
  })
})

// ============================================================================
// mapRequestDetailRow
// ============================================================================

describe('mapRequestDetailRow', () => {
  it('includes requester_email when isOwner=true', () => {
    const result = mapRequestDetailRow(baseRow, true)
    expect(result.requesterEmail).toBe('anna@example.com')
    expect(result.isOwner).toBe(true)
  })

  it('omits requester_email when isOwner=false (anti-leak)', () => {
    const result = mapRequestDetailRow(baseRow, false)
    expect(result.requesterEmail).toBeUndefined()
    expect(result.isOwner).toBe(false)
  })

  it('exposes ai_diagnosis to non-owners (helpers can see it to inform their offers)', () => {
    const result = mapRequestDetailRow(baseRow, false)
    expect(result.aiDiagnosis).toBe('Likely a power supply issue.')
  })

  it('exposes ai_diagnosis to owner too', () => {
    const result = mapRequestDetailRow(baseRow, true)
    expect(result.aiDiagnosis).toBe('Likely a power supply issue.')
  })

  it('inherits all the list-row fields', () => {
    const result = mapRequestDetailRow(baseRow, true)
    expect(result.id).toBe('req-1')
    expect(result.title).toBe(baseRow.title)
    expect(result.skillsNeeded).toEqual(['hardware_diagnosis'])
    expect(result.matchedHelperId).toBeNull()
  })

  it('handles row without requester_email gracefully when isOwner=true', () => {
    const { requester_email, ...rowWithoutEmail } = baseRow
    void requester_email
    const result = mapRequestDetailRow(rowWithoutEmail as RequestRow, true)
    expect(result.requesterEmail).toBeUndefined()
  })

  it('passes through ai_diagnosis null when DB column is null', () => {
    const result = mapRequestDetailRow({ ...baseRow, ai_diagnosis: null }, true)
    expect(result.aiDiagnosis).toBeNull()
  })
})
