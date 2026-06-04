/**
 * Tests for the unified LifecycleStage taxonomy.
 * Verifies every subsystem-specific status maps to a sensible stage.
 */

import {
  LIFECYCLE_STAGE,
  bookingStatusToStage,
  appointmentStatusToStage,
  itHilfeStatusToStage,
  isPending,
  isActive,
  isDone,
  isCancelled,
  LIFECYCLE_STAGE_VARIANT,
} from '../lifecycle-stage'
import { BOOKING_STATUS } from '../booking-status'
import { APPOINTMENT_STATUS } from '../appointment-status'
import { REQUEST_STATUS } from '../it-hilfe'

describe('LifecycleStage', () => {
  describe('bookingStatusToStage', () => {
    it.each([
      [BOOKING_STATUS.REQUESTED, LIFECYCLE_STAGE.PENDING],
      [BOOKING_STATUS.PENDING, LIFECYCLE_STAGE.PENDING],
      [BOOKING_STATUS.QUOTED, LIFECYCLE_STAGE.PENDING],
      [BOOKING_STATUS.QUOTE_REJECTED, LIFECYCLE_STAGE.PENDING],
      [BOOKING_STATUS.ACCEPTED, LIFECYCLE_STAGE.ACTIVE],
      [BOOKING_STATUS.QUOTE_APPROVED, LIFECYCLE_STAGE.ACTIVE],
      [BOOKING_STATUS.CONFIRMED, LIFECYCLE_STAGE.ACTIVE],
      [BOOKING_STATUS.IN_PROGRESS, LIFECYCLE_STAGE.ACTIVE],
      [BOOKING_STATUS.COMPLETED, LIFECYCLE_STAGE.COMPLETED],
      [BOOKING_STATUS.REJECTED, LIFECYCLE_STAGE.CANCELLED],
      [BOOKING_STATUS.CANCELLED, LIFECYCLE_STAGE.CANCELLED],
    ])('maps %s → %s', (status, expected) => {
      expect(bookingStatusToStage(status)).toBe(expected)
    })

    it('falls back to PENDING for unknown status', () => {
      expect(bookingStatusToStage('garbage_value_xyz')).toBe(LIFECYCLE_STAGE.PENDING)
    })
  })

  describe('appointmentStatusToStage', () => {
    it.each([
      [APPOINTMENT_STATUS.PENDING_APPROVAL, LIFECYCLE_STAGE.PENDING],
      [APPOINTMENT_STATUS.REQUESTED, LIFECYCLE_STAGE.PENDING],
      [APPOINTMENT_STATUS.CONFIRMED, LIFECYCLE_STAGE.ACTIVE],
      [APPOINTMENT_STATUS.IN_PROGRESS, LIFECYCLE_STAGE.ACTIVE],
      [APPOINTMENT_STATUS.COMPLETED, LIFECYCLE_STAGE.COMPLETED],
      [APPOINTMENT_STATUS.CANCELLED, LIFECYCLE_STAGE.CANCELLED],
    ])('maps %s → %s', (status, expected) => {
      expect(appointmentStatusToStage(status)).toBe(expected)
    })
  })

  describe('itHilfeStatusToStage', () => {
    it.each([
      [REQUEST_STATUS.OPEN, LIFECYCLE_STAGE.PENDING],
      [REQUEST_STATUS.MATCHED, LIFECYCLE_STAGE.ACTIVE],
      [REQUEST_STATUS.COMPLETED, LIFECYCLE_STAGE.COMPLETED],
      [REQUEST_STATUS.CANCELLED, LIFECYCLE_STAGE.CANCELLED],
      [REQUEST_STATUS.EXPIRED, LIFECYCLE_STAGE.CANCELLED],
    ])('maps %s → %s', (status, expected) => {
      expect(itHilfeStatusToStage(status)).toBe(expected)
    })
  })

  describe('predicates', () => {
    it('isPending only matches PENDING', () => {
      expect(isPending(LIFECYCLE_STAGE.PENDING)).toBe(true)
      expect(isPending(LIFECYCLE_STAGE.ACTIVE)).toBe(false)
      expect(isPending(LIFECYCLE_STAGE.COMPLETED)).toBe(false)
      expect(isPending(LIFECYCLE_STAGE.CANCELLED)).toBe(false)
    })

    it('isActive only matches ACTIVE', () => {
      expect(isActive(LIFECYCLE_STAGE.ACTIVE)).toBe(true)
      expect(isActive(LIFECYCLE_STAGE.PENDING)).toBe(false)
    })

    it('isDone matches both COMPLETED and CANCELLED', () => {
      expect(isDone(LIFECYCLE_STAGE.COMPLETED)).toBe(true)
      expect(isDone(LIFECYCLE_STAGE.CANCELLED)).toBe(true)
      expect(isDone(LIFECYCLE_STAGE.PENDING)).toBe(false)
      expect(isDone(LIFECYCLE_STAGE.ACTIVE)).toBe(false)
    })

    it('isCancelled only matches CANCELLED', () => {
      expect(isCancelled(LIFECYCLE_STAGE.CANCELLED)).toBe(true)
      expect(isCancelled(LIFECYCLE_STAGE.COMPLETED)).toBe(false)
    })
  })

  describe('LIFECYCLE_STAGE_VARIANT', () => {
    it('maps every stage to a StatusBadge variant', () => {
      expect(LIFECYCLE_STAGE_VARIANT[LIFECYCLE_STAGE.PENDING]).toBe('warning')
      expect(LIFECYCLE_STAGE_VARIANT[LIFECYCLE_STAGE.ACTIVE]).toBe('success')
      expect(LIFECYCLE_STAGE_VARIANT[LIFECYCLE_STAGE.COMPLETED]).toBe('success')
      expect(LIFECYCLE_STAGE_VARIANT[LIFECYCLE_STAGE.CANCELLED]).toBe('neutral')
    })
  })
})
