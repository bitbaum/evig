/**
 * Tests for status/badge config utility functions.
 *
 * These functions are the SSOT for status labels, badge styling, and
 * state predicates shown throughout the admin and user-facing UI.
 * A regression here silently breaks status displays for bookings,
 * decisions, approvals, and canton map lookups.
 *
 * Covers:
 *   - decisions.ts: isStatusEditable, isStatusCommentable
 *   - approval-status.ts: getApprovalStatusLabel, getApprovalStatusBadge
 *   - booking-status.ts: getBookingStatusBadge, getBookingStatusLabel, getUrgencyBadge
 *   - canton-coordinates.ts: getCantonCoordinates
 */

// ============================================================================
// decisions.ts — isStatusEditable, isStatusCommentable
// ============================================================================

import {
  isStatusEditable,
  isStatusCommentable,
  DECISION_STATUS,
  EDITABLE_STATUSES,
  COMMENTABLE_STATUSES,
} from '../decisions'

describe('isStatusEditable', () => {
  it('draft is editable', () => {
    expect(isStatusEditable(DECISION_STATUS.DRAFT)).toBe(true)
  })

  it('discussion is editable', () => {
    expect(isStatusEditable(DECISION_STATUS.DISCUSSION)).toBe(true)
  })

  it('voting is NOT editable', () => {
    expect(isStatusEditable(DECISION_STATUS.VOTING)).toBe(false)
  })

  it('closed is NOT editable', () => {
    expect(isStatusEditable(DECISION_STATUS.CLOSED)).toBe(false)
  })

  it('cancelled is NOT editable', () => {
    expect(isStatusEditable(DECISION_STATUS.CANCELLED)).toBe(false)
  })

  it('EDITABLE_STATUSES contains exactly draft and discussion', () => {
    expect(EDITABLE_STATUSES).toContain('draft')
    expect(EDITABLE_STATUSES).toContain('discussion')
    expect(EDITABLE_STATUSES).toHaveLength(2)
  })

  it('returns true for all EDITABLE_STATUSES', () => {
    for (const status of EDITABLE_STATUSES) {
      expect(isStatusEditable(status)).toBe(true)
    }
  })
})

describe('isStatusCommentable', () => {
  it('discussion is commentable', () => {
    expect(isStatusCommentable(DECISION_STATUS.DISCUSSION)).toBe(true)
  })

  it('voting is commentable', () => {
    expect(isStatusCommentable(DECISION_STATUS.VOTING)).toBe(true)
  })

  it('closed is commentable', () => {
    expect(isStatusCommentable(DECISION_STATUS.CLOSED)).toBe(true)
  })

  it('draft is NOT commentable', () => {
    expect(isStatusCommentable(DECISION_STATUS.DRAFT)).toBe(false)
  })

  it('cancelled is NOT commentable', () => {
    expect(isStatusCommentable(DECISION_STATUS.CANCELLED)).toBe(false)
  })

  it('COMMENTABLE_STATUSES contains exactly discussion, voting, closed', () => {
    expect(COMMENTABLE_STATUSES).toContain('discussion')
    expect(COMMENTABLE_STATUSES).toContain('voting')
    expect(COMMENTABLE_STATUSES).toContain('closed')
    expect(COMMENTABLE_STATUSES).toHaveLength(3)
  })

  it('returns true for all COMMENTABLE_STATUSES', () => {
    for (const status of COMMENTABLE_STATUSES) {
      expect(isStatusCommentable(status)).toBe(true)
    }
  })
})

// ============================================================================
// approval-status.ts — getApprovalStatusLabel, getApprovalStatusBadge
// ============================================================================

import {
  getApprovalStatusLabel,
  getApprovalStatusBadge,
  APPROVAL_STATUS,
} from '../approval-status'

describe('getApprovalStatusLabel', () => {
  it('returns German label for pending', () => {
    expect(getApprovalStatusLabel(APPROVAL_STATUS.PENDING)).toBe('Ausstehend')
  })

  it('returns German label for approved', () => {
    expect(getApprovalStatusLabel(APPROVAL_STATUS.APPROVED)).toBe('Genehmigt')
  })

  it('returns German label for rejected', () => {
    expect(getApprovalStatusLabel(APPROVAL_STATUS.REJECTED)).toBe('Abgelehnt')
  })

  it('returns German label for requires_changes', () => {
    expect(getApprovalStatusLabel(APPROVAL_STATUS.REQUIRES_CHANGES)).toBe('Änderungen erforderlich')
  })

  it('returns German label for published', () => {
    expect(getApprovalStatusLabel(APPROVAL_STATUS.PUBLISHED)).toBe('Veröffentlicht')
  })

  it('falls back to the raw status string for unknown status', () => {
    expect(getApprovalStatusLabel('unknown_status')).toBe('unknown_status')
  })
})

describe('getApprovalStatusBadge', () => {
  it('returns badge object with label, color, bg for pending', () => {
    const badge = getApprovalStatusBadge(APPROVAL_STATUS.PENDING)
    expect(badge.label).toBe('Ausstehend')
    expect(badge.color).toContain('warning')
    expect(badge.bg).toContain('warning')
  })

  it('returns badge object for approved (green)', () => {
    const badge = getApprovalStatusBadge(APPROVAL_STATUS.APPROVED)
    expect(badge.label).toBe('Genehmigt')
    expect(badge.color).toContain('primary')
  })

  it('returns badge object for rejected (red)', () => {
    const badge = getApprovalStatusBadge(APPROVAL_STATUS.REJECTED)
    expect(badge.label).toBe('Abgelehnt')
    expect(badge.color).toContain('error')
  })

  it('returns fallback badge for unknown status (uses raw status as label)', () => {
    const badge = getApprovalStatusBadge('totally_unknown')
    expect(badge.label).toBe('totally_unknown')
    expect(badge.color).toContain('neutral')
    expect(badge.bg).toContain('neutral')
  })

  it('each known status badge has label, color, bg', () => {
    for (const status of Object.values(APPROVAL_STATUS)) {
      const badge = getApprovalStatusBadge(status)
      expect(badge).toHaveProperty('label')
      expect(badge).toHaveProperty('color')
      expect(badge).toHaveProperty('bg')
    }
  })
})

// ============================================================================
// booking-status.ts — getBookingStatusBadge, getBookingStatusLabel, getUrgencyBadge
// ============================================================================

import {
  getBookingStatusBadge,
  getBookingStatusLabel,
  getUrgencyBadge,
  BOOKING_STATUS,
} from '../booking-status'

describe('getBookingStatusLabel', () => {
  it('returns "Angefragt" for requested', () => {
    expect(getBookingStatusLabel(BOOKING_STATUS.REQUESTED)).toBe('Angefragt')
  })

  it('returns "Abgeschlossen" for completed', () => {
    expect(getBookingStatusLabel(BOOKING_STATUS.COMPLETED)).toBe('Abgeschlossen')
  })

  it('returns "Storniert" for cancelled', () => {
    expect(getBookingStatusLabel(BOOKING_STATUS.CANCELLED)).toBe('Storniert')
  })

  it('returns "Abgelehnt" for rejected', () => {
    expect(getBookingStatusLabel(BOOKING_STATUS.REJECTED)).toBe('Abgelehnt')
  })

  it('falls back to raw status string for unknown', () => {
    expect(getBookingStatusLabel('unknown_status')).toBe('unknown_status')
  })
})

describe('getBookingStatusBadge', () => {
  it('returns badge with label and color for requested', () => {
    const badge = getBookingStatusBadge(BOOKING_STATUS.REQUESTED)
    expect(badge.label).toBe('Angefragt')
    expect(badge.color).toContain('warning')
  })

  it('returns badge for in_progress', () => {
    const badge = getBookingStatusBadge(BOOKING_STATUS.IN_PROGRESS)
    expect(badge.label).toBe('In Bearbeitung')
  })

  it('returns badge for quote_approved', () => {
    const badge = getBookingStatusBadge(BOOKING_STATUS.QUOTE_APPROVED)
    expect(badge.label).toBe('Bestätigt')
  })

  it('returns fallback badge for unknown status', () => {
    const badge = getBookingStatusBadge('xyz_unknown')
    expect(badge.label).toBe('xyz_unknown')
    expect(badge.color).toContain('neutral')
  })

  it('each known status badge has label and color', () => {
    for (const status of Object.values(BOOKING_STATUS)) {
      const badge = getBookingStatusBadge(status)
      expect(badge).toHaveProperty('label')
      expect(badge).toHaveProperty('color')
    }
  })
})

describe('getUrgencyBadge', () => {
  it('returns "Dringend" (red) for urgent', () => {
    const badge = getUrgencyBadge('urgent')
    expect(badge.label).toBe('Dringend')
    expect(badge.color).toContain('error')
  })

  it('returns "Hoch" (orange) for high', () => {
    const badge = getUrgencyBadge('high')
    expect(badge.label).toBe('Hoch')
    expect(badge.color).toContain('orange')
  })

  it('returns "Normal" (blue) for normal', () => {
    const badge = getUrgencyBadge('normal')
    expect(badge.label).toBe('Normal')
    expect(badge.color).toContain('info')
  })

  it('falls back to normal badge for unknown urgency', () => {
    const badge = getUrgencyBadge('unknown_urgency')
    expect(badge.label).toBe('Normal')
    expect(badge.color).toContain('info')
  })
})

// ============================================================================
// canton-coordinates.ts — getCantonCoordinates
// ============================================================================

import { getCantonCoordinates, CANTON_COORDINATES } from '../canton-coordinates'

describe('getCantonCoordinates', () => {
  it('returns coordinates for Zürich (direct match)', () => {
    const coords = getCantonCoordinates('Zürich')
    expect(coords).not.toBeNull()
    expect(coords?.lat).toBeCloseTo(47.38, 1)
    expect(coords?.lng).toBeCloseTo(8.54, 1)
  })

  it('returns coordinates for Bern', () => {
    const coords = getCantonCoordinates('Bern')
    expect(coords).not.toBeNull()
    expect(typeof coords?.lat).toBe('number')
    expect(typeof coords?.lng).toBe('number')
  })

  it('returns coordinates for Basel-Stadt', () => {
    const coords = getCantonCoordinates('Basel-Stadt')
    expect(coords).not.toBeNull()
    expect(coords?.lat).toBeGreaterThan(47)
    expect(coords?.lng).toBeGreaterThan(7)
  })

  it('is case-insensitive — "zürich" matches "Zürich"', () => {
    const lower = getCantonCoordinates('zürich')
    const proper = getCantonCoordinates('Zürich')
    expect(lower).toEqual(proper)
  })

  it('is case-insensitive — "BERN" matches "Bern"', () => {
    expect(getCantonCoordinates('BERN')).toEqual(getCantonCoordinates('Bern'))
  })

  it('returns null for an unknown canton', () => {
    expect(getCantonCoordinates('Atlantis')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(getCantonCoordinates('')).toBeNull()
  })

  it('all 26 CANTON_COORDINATES entries return valid coords', () => {
    for (const canton of Object.keys(CANTON_COORDINATES)) {
      const coords = getCantonCoordinates(canton)
      expect(coords).not.toBeNull()
      // Swiss cantons: lat 45-48, lng 5-11
      expect(coords!.lat).toBeGreaterThan(45)
      expect(coords!.lat).toBeLessThan(48)
      expect(coords!.lng).toBeGreaterThan(5)
      expect(coords!.lng).toBeLessThan(11)
    }
  })
})
