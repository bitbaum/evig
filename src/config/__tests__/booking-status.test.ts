/**
 * Tests for config/booking-status.ts — booking lifecycle status helpers.
 *
 * Mission-relevant: bookings are the payment-sensitive repair workflow.
 * If getBookingStatusLabel('completed') returns 'completed' instead of
 * 'Abgeschlossen', the customer dashboard shows an English label on a
 * completed repair. If getUrgencyBadge falls back to 'normal' for unknown
 * urgency, that's the documented behavior — but it must not throw.
 *
 * Behaviors locked:
 *   getBookingStatusBadge
 *   - returns badge with label and color for known status
 *   - returns raw status as label with gray color for unknown status
 *
 *   getBookingStatusLabel
 *   - returns German label for known status
 *   - falls back to raw status string for unknown
 *
 *   getUrgencyBadge
 *   - returns urgent badge (red) for 'urgent'
 *   - falls back to 'normal' (blue) for unknown urgency
 */

import {
  getBookingStatusBadge,
  getBookingStatusLabel,
  getUrgencyBadge,
  BOOKING_STATUS,
} from '../booking-status'

// ============================================================================
// getBookingStatusBadge
// ============================================================================

describe('getBookingStatusBadge', () => {
  it('returns badge for "requested"', () => {
    const badge = getBookingStatusBadge(BOOKING_STATUS.REQUESTED)
    expect(badge.label).toBe('Angefragt')
    expect(badge.color).toContain('warning')
  })

  it('returns badge for "completed"', () => {
    const badge = getBookingStatusBadge(BOOKING_STATUS.COMPLETED)
    expect(badge.label).toBe('Abgeschlossen')
    expect(badge.color).toContain('primary')
  })

  it('returns badge for "cancelled"', () => {
    const badge = getBookingStatusBadge(BOOKING_STATUS.CANCELLED)
    expect(badge.label).toBe('Storniert')
    expect(badge.color).toContain('neutral')
  })

  it('returns badge for "in_progress"', () => {
    const badge = getBookingStatusBadge(BOOKING_STATUS.IN_PROGRESS)
    expect(badge.label).toBe('In Bearbeitung')
  })

  it('returns raw status as label with gray color for unknown status', () => {
    const badge = getBookingStatusBadge('unknown_status')
    expect(badge.label).toBe('unknown_status')
    expect(badge.color).toContain('neutral')
  })

  it('badge has label and color properties', () => {
    const badge = getBookingStatusBadge(BOOKING_STATUS.QUOTED)
    expect(typeof badge.label).toBe('string')
    expect(typeof badge.color).toBe('string')
  })
})

// ============================================================================
// getBookingStatusLabel
// ============================================================================

describe('getBookingStatusLabel', () => {
  it('returns "Angefragt" for requested', () => {
    expect(getBookingStatusLabel(BOOKING_STATUS.REQUESTED)).toBe('Angefragt')
  })

  it('returns "Abgelehnt" for rejected', () => {
    expect(getBookingStatusLabel(BOOKING_STATUS.REJECTED)).toBe('Abgelehnt')
  })

  it('returns "Angebot erhalten" for quoted', () => {
    expect(getBookingStatusLabel(BOOKING_STATUS.QUOTED)).toBe('Angebot erhalten')
  })

  it('falls back to raw status string for unknown', () => {
    expect(getBookingStatusLabel('mystery_status')).toBe('mystery_status')
  })
})

// ============================================================================
// getUrgencyBadge
// ============================================================================

describe('getUrgencyBadge', () => {
  it('returns red badge for "urgent"', () => {
    const badge = getUrgencyBadge('urgent')
    expect(badge.label).toBe('Dringend')
    expect(badge.color).toContain('error')
  })

  it('returns orange badge for "high"', () => {
    const badge = getUrgencyBadge('high')
    expect(badge.color).toContain('orange')
  })

  it('returns neutral badge for "normal"', () => {
    const badge = getUrgencyBadge('normal')
    expect(badge.color).toContain('neutral')
  })

  it('falls back to normal badge for unknown urgency', () => {
    const normal = getUrgencyBadge('normal')
    const unknown = getUrgencyBadge('unknown_urgency')
    expect(unknown).toEqual(normal)
  })
})
