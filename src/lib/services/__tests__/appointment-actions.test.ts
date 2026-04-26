/**
 * Tests for buildActionUpdate (lib/services/appointment-actions.ts).
 *
 * Pure auth + state-machine for the customer ↔ technician repair
 * appointment flow. Mission-critical: a bug here would let a customer
 * cancel a quote that's already in progress, or let a technician fake
 * customer ratings, or let a third party mutate someone else's booking.
 *
 * Lifecycle (BOOKING_STATUS):
 *   requested → accepted → quoted → quote_approved → in_progress → completed
 *                       ↓                ↓
 *                       quote_rejected   (cycle back to quoted)
 *                       ↓
 *                       rejected
 *   Any pre-completed state → cancelled
 *
 * Auth gates:
 *   accept/reject/quote/start/complete         → repairer-only
 *   approve_quote/reject_quote/update/rate     → customer-only
 *   cancel                                     → either party
 *   any other userId                           → "Kein Zugriff"
 */

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  sql: jest.fn((strings: TemplateStringsArray) => ({ __sql: strings.join('') })),
}))

import { buildActionUpdate } from '../appointment-actions'
import { BOOKING_STATUS } from '@/config/booking-status'

const CUSTOMER = 'cust-1'
const REPAIRER = 'repair-1'
const STRANGER = 'stranger-1'

function appt(status: string | null, overrides: Partial<{ userId: string; repairerId: string | null }> = {}) {
  return {
    id: 'appt-1',
    userId: CUSTOMER,
    repairerId: REPAIRER,
    status,
    ...overrides,
  }
}

// ============================================================================
// Authorization gate
// ============================================================================

describe('buildActionUpdate — authorization', () => {
  it('returns "Kein Zugriff" if userId is neither customer nor repairer', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.REQUESTED), { action: 'accept' }, STRANGER)
    expect(result).toEqual({ error: 'Kein Zugriff auf diesen Termin' })
  })

  it('"Kein Zugriff" wins over action validation (auth checked first)', () => {
    // Even an obviously-invalid action returns the auth error if user isn't a party
    const result = buildActionUpdate(appt(BOOKING_STATUS.REQUESTED), { action: 'wat' }, STRANGER)
    expect(result).toEqual({ error: 'Kein Zugriff auf diesen Termin' })
  })

  it('repairerId=null still allows the customer to act on their own appointment', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.REQUESTED, { repairerId: null }),
      { action: 'update', description: 'updated' },
      CUSTOMER,
    )
    expect('error' in result).toBe(false)
  })
})

// ============================================================================
// accept
// ============================================================================

describe('buildActionUpdate — accept', () => {
  it('repairer can accept a requested appointment → ACCEPTED', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.REQUESTED), { action: 'accept' }, REPAIRER)
    expect('error' in result).toBe(false)
    if ('error' in result) return
    expect(result.newStatus).toBe(BOOKING_STATUS.ACCEPTED)
    expect(result.updateSet.status).toBe(BOOKING_STATUS.ACCEPTED)
  })

  it('customer cannot accept', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.REQUESTED), { action: 'accept' }, CUSTOMER)
    expect(result).toEqual({ error: 'Nur der Techniker kann annehmen' })
  })

  it('cannot accept an already-accepted appointment', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.ACCEPTED), { action: 'accept' }, REPAIRER)
    expect(result).toEqual({ error: 'Termin kann nicht angenommen werden' })
  })
})

// ============================================================================
// reject
// ============================================================================

describe('buildActionUpdate — reject', () => {
  it('repairer can reject a requested appointment → REJECTED', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.REQUESTED), { action: 'reject' }, REPAIRER)
    if ('error' in result) throw new Error('expected success')
    expect(result.newStatus).toBe(BOOKING_STATUS.REJECTED)
  })

  it('customer cannot reject', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.REQUESTED), { action: 'reject' }, CUSTOMER)
    expect(result).toEqual({ error: 'Nur der Techniker kann ablehnen' })
  })

  it('cannot reject from non-REQUESTED state (already accepted)', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.ACCEPTED), { action: 'reject' }, REPAIRER)
    expect(result).toEqual({ error: 'Termin kann nicht abgelehnt werden' })
  })
})

// ============================================================================
// quote
// ============================================================================

describe('buildActionUpdate — quote', () => {
  it('repairer can quote from ACCEPTED → QUOTED with price', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.ACCEPTED),
      { action: 'quote', quoted_price_chf: 250, diagnosis_notes: 'New SSD needed' },
      REPAIRER,
    )
    if ('error' in result) throw new Error('expected success')
    expect(result.newStatus).toBe(BOOKING_STATUS.QUOTED)
    expect(result.updateSet.quotedPriceChf).toBe(250)
    expect(result.updateSet.diagnosisNotes).toBe('New SSD needed')
  })

  it('repairer can re-quote after a customer rejection (QUOTE_REJECTED → QUOTED)', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.QUOTE_REJECTED),
      { action: 'quote', quoted_price_chf: 200 },
      REPAIRER,
    )
    if ('error' in result) throw new Error('expected success')
    expect(result.newStatus).toBe(BOOKING_STATUS.QUOTED)
  })

  it('omits diagnosisNotes when not provided (does not write undefined)', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.ACCEPTED),
      { action: 'quote', quoted_price_chf: 100 },
      REPAIRER,
    )
    if ('error' in result) throw new Error('expected success')
    expect('diagnosisNotes' in result.updateSet).toBe(false)
  })

  it('customer cannot quote', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.ACCEPTED),
      { action: 'quote', quoted_price_chf: 100 },
      CUSTOMER,
    )
    expect(result).toEqual({ error: 'Nur der Techniker kann Angebote erstellen' })
  })

  it('cannot quote from REQUESTED (must accept first)', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.REQUESTED),
      { action: 'quote', quoted_price_chf: 100 },
      REPAIRER,
    )
    expect(result).toEqual({ error: 'Angebot kann in diesem Status nicht erstellt werden' })
  })

  it('cannot quote from QUOTED (already quoted)', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.QUOTED),
      { action: 'quote', quoted_price_chf: 100 },
      REPAIRER,
    )
    expect(result).toEqual({ error: 'Angebot kann in diesem Status nicht erstellt werden' })
  })
})

// ============================================================================
// approve_quote / reject_quote
// ============================================================================

describe('buildActionUpdate — approve_quote', () => {
  it('customer can approve a quote → QUOTE_APPROVED with quoteApproved=true', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.QUOTED), { action: 'approve_quote' }, CUSTOMER)
    if ('error' in result) throw new Error('expected success')
    expect(result.newStatus).toBe(BOOKING_STATUS.QUOTE_APPROVED)
    expect(result.updateSet.quoteApproved).toBe(true)
    expect(result.updateSet.quoteApprovedAt).toBeDefined()
  })

  it('repairer cannot approve their own quote', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.QUOTED), { action: 'approve_quote' }, REPAIRER)
    expect(result).toEqual({ error: 'Nur der Kunde kann Angebote bestätigen' })
  })

  it('cannot approve when there is no quote (status not QUOTED)', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.ACCEPTED), { action: 'approve_quote' }, CUSTOMER)
    expect(result).toEqual({ error: 'Kein Angebot zum Bestätigen' })
  })
})

describe('buildActionUpdate — reject_quote', () => {
  it('customer can reject a quote → QUOTE_REJECTED', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.QUOTED), { action: 'reject_quote' }, CUSTOMER)
    if ('error' in result) throw new Error('expected success')
    expect(result.newStatus).toBe(BOOKING_STATUS.QUOTE_REJECTED)
  })

  it('repairer cannot reject the customer quote', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.QUOTED), { action: 'reject_quote' }, REPAIRER)
    expect(result).toEqual({ error: 'Nur der Kunde kann Angebote ablehnen' })
  })

  it('cannot reject when there is no quote', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.ACCEPTED), { action: 'reject_quote' }, CUSTOMER)
    expect(result).toEqual({ error: 'Kein Angebot zum Ablehnen' })
  })
})

// ============================================================================
// start
// ============================================================================

describe('buildActionUpdate — start', () => {
  it('repairer can start from ACCEPTED → IN_PROGRESS', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.ACCEPTED), { action: 'start' }, REPAIRER)
    if ('error' in result) throw new Error('expected success')
    expect(result.newStatus).toBe(BOOKING_STATUS.IN_PROGRESS)
  })

  it('repairer can start from QUOTE_APPROVED → IN_PROGRESS (quote-approval flow)', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.QUOTE_APPROVED), { action: 'start' }, REPAIRER)
    if ('error' in result) throw new Error('expected success')
    expect(result.newStatus).toBe(BOOKING_STATUS.IN_PROGRESS)
  })

  it('writes confirmedDate when provided', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.ACCEPTED),
      { action: 'start', confirmed_date: '2026-05-01' },
      REPAIRER,
    )
    if ('error' in result) throw new Error('expected success')
    expect(result.updateSet.confirmedDate).toBe('2026-05-01')
  })

  it('omits confirmedDate when not provided', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.ACCEPTED), { action: 'start' }, REPAIRER)
    if ('error' in result) throw new Error('expected success')
    expect('confirmedDate' in result.updateSet).toBe(false)
  })

  it('customer cannot start', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.ACCEPTED), { action: 'start' }, CUSTOMER)
    expect(result).toEqual({ error: 'Nur der Techniker kann starten' })
  })

  it('cannot start from REQUESTED (must accept first)', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.REQUESTED), { action: 'start' }, REPAIRER)
    expect(result).toEqual({ error: 'Termin kann nicht gestartet werden' })
  })

  it('cannot start from QUOTED (must approve first)', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.QUOTED), { action: 'start' }, REPAIRER)
    expect(result).toEqual({ error: 'Termin kann nicht gestartet werden' })
  })
})

// ============================================================================
// complete
// ============================================================================

describe('buildActionUpdate — complete', () => {
  it('repairer can complete from IN_PROGRESS → COMPLETED with completedAt', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.IN_PROGRESS), { action: 'complete' }, REPAIRER)
    if ('error' in result) throw new Error('expected success')
    expect(result.newStatus).toBe(BOOKING_STATUS.COMPLETED)
    expect(result.updateSet.completedAt).toBeDefined()
  })

  it('writes completionNotes when provided', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.IN_PROGRESS),
      { action: 'complete', completion_notes: 'Replaced battery, OS reinstalled' },
      REPAIRER,
    )
    if ('error' in result) throw new Error('expected success')
    expect(result.updateSet.completionNotes).toBe('Replaced battery, OS reinstalled')
  })

  it('customer cannot complete', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.IN_PROGRESS), { action: 'complete' }, CUSTOMER)
    expect(result).toEqual({ error: 'Nur der Techniker kann abschliessen' })
  })

  it('cannot complete an appointment that is not IN_PROGRESS', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.ACCEPTED), { action: 'complete' }, REPAIRER)
    expect(result).toEqual({ error: 'Termin ist nicht in Bearbeitung' })
  })
})

// ============================================================================
// update (customer edits description / preferred date)
// ============================================================================

describe('buildActionUpdate — update', () => {
  it('customer can edit description + preferredDate while REQUESTED', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.REQUESTED),
      { action: 'update', description: 'New problem description', preferred_date: '2026-05-01' },
      CUSTOMER,
    )
    if ('error' in result) throw new Error('expected success')
    expect(result.updateSet.description).toBe('New problem description')
    expect(result.updateSet.preferredDate).toBe('2026-05-01')
    expect(result.newStatus).toBeNull() // no status change for "update"
  })

  it('repairer cannot edit appointment details', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.REQUESTED),
      { action: 'update', description: 'edited' },
      REPAIRER,
    )
    expect(result).toEqual({ error: 'Nur der Kunde kann Angaben bearbeiten' })
  })

  it('cannot edit after the technician has accepted', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.ACCEPTED),
      { action: 'update', description: 'edited' },
      CUSTOMER,
    )
    expect(result).toEqual({ error: 'Angaben können nur im Status "Angefragt" bearbeitet werden' })
  })

  it('only writes fields that are provided', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.REQUESTED),
      { action: 'update', description: 'only desc' },
      CUSTOMER,
    )
    if ('error' in result) throw new Error('expected success')
    expect(result.updateSet.description).toBe('only desc')
    expect('preferredDate' in result.updateSet).toBe(false)
  })
})

// ============================================================================
// rate (customer rates a completed appointment)
// ============================================================================

describe('buildActionUpdate — rate', () => {
  it('customer can rate a COMPLETED appointment', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.COMPLETED),
      { action: 'rate', customer_rating: 5, customer_review: 'Excellent!' },
      CUSTOMER,
    )
    if ('error' in result) throw new Error('expected success')
    expect(result.updateSet.customerRating).toBe(5)
    expect(result.updateSet.customerReview).toBe('Excellent!')
    expect(result.newStatus).toBeNull() // rating doesn't change status
  })

  it('repairer cannot rate themselves', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.COMPLETED),
      { action: 'rate', customer_rating: 5 },
      REPAIRER,
    )
    expect(result).toEqual({ error: 'Nur der Kunde kann bewerten' })
  })

  it('cannot rate an in-progress appointment', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.IN_PROGRESS),
      { action: 'rate', customer_rating: 5 },
      CUSTOMER,
    )
    expect(result).toEqual({ error: 'Nur abgeschlossene Termine können bewertet werden' })
  })

  it('omits review when not provided (writes rating only)', () => {
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.COMPLETED),
      { action: 'rate', customer_rating: 4 },
      CUSTOMER,
    )
    if ('error' in result) throw new Error('expected success')
    expect(result.updateSet.customerRating).toBe(4)
    expect('customerReview' in result.updateSet).toBe(false)
  })
})

// ============================================================================
// cancel (either party, only from pre-completed states)
// ============================================================================

describe('buildActionUpdate — cancel', () => {
  it.each([
    BOOKING_STATUS.REQUESTED,
    BOOKING_STATUS.ACCEPTED,
    BOOKING_STATUS.QUOTED,
    BOOKING_STATUS.QUOTE_APPROVED,
  ])('customer can cancel from %s', (status) => {
    const result = buildActionUpdate(appt(status), { action: 'cancel' }, CUSTOMER)
    if ('error' in result) throw new Error('expected success')
    expect(result.newStatus).toBe(BOOKING_STATUS.CANCELLED)
  })

  it('repairer can also cancel', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.ACCEPTED), { action: 'cancel' }, REPAIRER)
    if ('error' in result) throw new Error('expected success')
    expect(result.newStatus).toBe(BOOKING_STATUS.CANCELLED)
  })

  it('cannot cancel after IN_PROGRESS', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.IN_PROGRESS), { action: 'cancel' }, CUSTOMER)
    expect(result).toEqual({ error: 'Termin kann nicht mehr storniert werden' })
  })

  it('cannot cancel a COMPLETED appointment', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.COMPLETED), { action: 'cancel' }, CUSTOMER)
    expect(result).toEqual({ error: 'Termin kann nicht mehr storniert werden' })
  })

  it('cannot cancel a CANCELLED appointment', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.CANCELLED), { action: 'cancel' }, CUSTOMER)
    expect(result).toEqual({ error: 'Termin kann nicht mehr storniert werden' })
  })
})

// ============================================================================
// invalid actions + invariants
// ============================================================================

describe('buildActionUpdate — invariants', () => {
  it('unknown action returns "Ungültige Aktion: <name>"', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.REQUESTED), { action: 'teleport' }, CUSTOMER)
    expect(result).toEqual({ error: 'Ungültige Aktion: teleport' })
  })

  it('every successful update writes updatedAt', () => {
    const result = buildActionUpdate(appt(BOOKING_STATUS.REQUESTED), { action: 'accept' }, REPAIRER)
    if ('error' in result) throw new Error('expected success')
    expect(result.updateSet.updatedAt).toBeDefined()
  })

  it('Swiss German labels use proper umlauts (Ungültig not Ungueltig, Möglich not Moeglich)', () => {
    // Quick guard against ASCII-substitute regression in error strings
    const r1 = buildActionUpdate(appt(BOOKING_STATUS.REQUESTED), { action: 'xyz' }, CUSTOMER)
    if (!('error' in r1)) throw new Error('expected error')
    expect(r1.error).toContain('Ungültig')
    expect(r1.error).not.toMatch(/Ungueltig|ueber|aenderung/)
  })

  it('actions that do NOT change status return newStatus=null but still write updatedAt', () => {
    // 'rate' is the canonical non-status-changing action
    const result = buildActionUpdate(
      appt(BOOKING_STATUS.COMPLETED),
      { action: 'rate', customer_rating: 5 },
      CUSTOMER,
    )
    if ('error' in result) throw new Error('expected success')
    expect(result.newStatus).toBeNull()
    expect('status' in result.updateSet).toBe(false) // status not overwritten
    expect(result.updateSet.updatedAt).toBeDefined()
  })
})
