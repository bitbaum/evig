/**
 * Tests for status label helpers:
 *   - config/refund.ts
 *   - config/approval-status.ts
 *   - config/workshop-registration-status.ts
 *
 * Mission-relevant: refund status labels appear on the admin finances page.
 * If getRefundStatusLabel('completed') returns 'completed' instead of
 * 'Abgeschlossen', the staff UI shows untranslated English. Approval badges
 * drive the content submission workflow — a wrong color signals the wrong
 * state to admins.
 *
 * Behaviors locked:
 *   getRefundStatusLabel / getRefundReasonLabel
 *   - return German label for known values, raw value as fallback
 *
 *   getApprovalStatusLabel
 *   - returns German label for known status, raw value as fallback
 *
 *   getApprovalStatusBadge
 *   - returns badge with label, color, bg for known status
 *   - returns gray fallback badge for unknown status
 *
 *   getWorkshopRegistrationStatusLabel
 *   - returns German label for known status, raw value as fallback
 */

import {
  getRefundStatusLabel,
  getRefundReasonLabel,
  REFUND_STATUS,
  REFUND_REASON,
} from '../refund'

import {
  getApprovalStatusLabel,
  getApprovalStatusBadge,
  APPROVAL_STATUS,
} from '../approval-status'

import {
  getWorkshopRegistrationStatusLabel,
  WORKSHOP_REGISTRATION_STATUS,
} from '../workshop-registration-status'

// ============================================================================
// refund.ts
// ============================================================================

describe('getRefundStatusLabel', () => {
  it('returns "Angefragt" for requested', () => {
    expect(getRefundStatusLabel(REFUND_STATUS.REQUESTED)).toBe('Angefragt')
  })

  it('returns "Abgeschlossen" for completed', () => {
    expect(getRefundStatusLabel(REFUND_STATUS.COMPLETED)).toBe('Abgeschlossen')
  })

  it('falls back to raw value for unknown status', () => {
    expect(getRefundStatusLabel('unknown_status')).toBe('unknown_status')
  })
})

describe('getRefundReasonLabel', () => {
  it('returns "Kundenwunsch" for customer_request', () => {
    expect(getRefundReasonLabel(REFUND_REASON.CUSTOMER_REQUEST)).toBe('Kundenwunsch')
  })

  it('returns "Betrug" for fraud', () => {
    expect(getRefundReasonLabel(REFUND_REASON.FRAUD)).toBe('Betrug')
  })

  it('falls back to raw value for unknown reason', () => {
    expect(getRefundReasonLabel('unknown_reason')).toBe('unknown_reason')
  })
})

// ============================================================================
// approval-status.ts
// ============================================================================

describe('getApprovalStatusLabel', () => {
  it('returns "Ausstehend" for pending', () => {
    expect(getApprovalStatusLabel(APPROVAL_STATUS.PENDING)).toBe('Ausstehend')
  })

  it('returns "Genehmigt" for approved', () => {
    expect(getApprovalStatusLabel(APPROVAL_STATUS.APPROVED)).toBe('Genehmigt')
  })

  it('returns "Abgelehnt" for rejected', () => {
    expect(getApprovalStatusLabel(APPROVAL_STATUS.REJECTED)).toBe('Abgelehnt')
  })

  it('returns "Veröffentlicht" for published', () => {
    expect(getApprovalStatusLabel(APPROVAL_STATUS.PUBLISHED)).toBe('Veröffentlicht')
  })

  it('falls back to raw value for unknown status', () => {
    expect(getApprovalStatusLabel('draft')).toBe('draft')
  })
})

describe('getApprovalStatusBadge', () => {
  it('returns badge with label for pending', () => {
    const badge = getApprovalStatusBadge(APPROVAL_STATUS.PENDING)
    expect(badge.label).toBe('Ausstehend')
    expect(badge.color).toContain('warning')
    expect(badge.bg).toContain('warning')
  })

  it('returns badge for approved (green)', () => {
    const badge = getApprovalStatusBadge(APPROVAL_STATUS.APPROVED)
    expect(badge.color).toContain('primary')
  })

  it('returns gray fallback badge for unknown status', () => {
    const badge = getApprovalStatusBadge('unknown_status')
    expect(badge.label).toBe('unknown_status')
    expect(badge.color).toContain('neutral')
    expect(badge.bg).toContain('neutral')
  })
})

// ============================================================================
// workshop-registration-status.ts
// ============================================================================

describe('getWorkshopRegistrationStatusLabel', () => {
  it('returns "Bestätigt" for confirmed', () => {
    expect(getWorkshopRegistrationStatusLabel(WORKSHOP_REGISTRATION_STATUS.CONFIRMED)).toBe('Bestätigt')
  })

  it('returns "Warteliste" for waitlist', () => {
    expect(getWorkshopRegistrationStatusLabel(WORKSHOP_REGISTRATION_STATUS.WAITLIST)).toBe('Warteliste')
  })

  it('returns "Nicht erschienen" for no_show', () => {
    expect(getWorkshopRegistrationStatusLabel(WORKSHOP_REGISTRATION_STATUS.NO_SHOW)).toBe('Nicht erschienen')
  })

  it('falls back to raw value for unknown status', () => {
    expect(getWorkshopRegistrationStatusLabel('archived')).toBe('archived')
  })
})
