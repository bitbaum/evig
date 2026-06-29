/**
 * Tests for executeAppointmentUpdate (lib/services/appointment-actions.ts).
 *
 * The write now runs through guardedTransition: it locks the appointment row
 * (FOR UPDATE), re-checks the precondition under the lock, and only then
 * writes. This guards the customer ↔ technician flow against a concurrent
 * action (or a double-click) double-applying a transition or a rating.
 *
 * Behaviors locked:
 *   - status unchanged since validation  → writes, returns the updated row
 *   - status changed under the lock      → returns null, NO write (race-loser)
 *   - 'rate' first time (rating null)    → writes
 *   - 'rate' when already rated          → returns null, NO write
 *
 * True FOR UPDATE serialization is a Postgres guarantee (covered by E2E); here
 * we verify the re-check wiring decides write-vs-skip correctly.
 */

// The FOR UPDATE lock select. Returns the row the re-check sees under the lock.
const mockTxExecute = jest.fn()
// The update().set().where().returning() chain inside apply.
const mockReturning = jest.fn()
const mockTxUpdate = jest.fn(() => ({
  set: () => ({ where: () => ({ returning: mockReturning }) }),
}))

jest.mock('@/db', () => ({
  db: {
    // guardedTransition runs `db.transaction(cb)`; invoke cb with a fake tx.
    transaction: (cb: (tx: unknown) => unknown) => cb({
      execute: (...a: unknown[]) => mockTxExecute(...a),
      update: () => mockTxUpdate(),
    }),
  },
}))

import { executeAppointmentUpdate } from '../appointment-actions'
import { BOOKING_STATUS } from '@/config/booking-status'

const APPT_ID = 'appt-1'
const UPDATED_ROW = { id: APPT_ID, status: BOOKING_STATUS.COMPLETED } as never

beforeEach(() => {
  jest.clearAllMocks()
  mockReturning.mockResolvedValue([UPDATED_ROW])
})

describe('executeAppointmentUpdate — status transition', () => {
  it('writes and returns the row when the status is unchanged under the lock', async () => {
    mockTxExecute.mockResolvedValue({ rows: [{ status: BOOKING_STATUS.IN_PROGRESS, customer_rating: null }] })

    const result = await executeAppointmentUpdate(
      APPT_ID,
      'complete',
      { status: BOOKING_STATUS.COMPLETED },
      BOOKING_STATUS.IN_PROGRESS,
    )

    expect(result).toBe(UPDATED_ROW)
    expect(mockTxUpdate).toHaveBeenCalledTimes(1)
  })

  it('returns null and does NOT write when the status changed under the lock', async () => {
    // Validated against IN_PROGRESS, but a concurrent action already completed it.
    mockTxExecute.mockResolvedValue({ rows: [{ status: BOOKING_STATUS.COMPLETED, customer_rating: null }] })

    const result = await executeAppointmentUpdate(
      APPT_ID,
      'complete',
      { status: BOOKING_STATUS.COMPLETED },
      BOOKING_STATUS.IN_PROGRESS,
    )

    expect(result).toBeNull()
    expect(mockTxUpdate).not.toHaveBeenCalled()
  })
})

describe('executeAppointmentUpdate — rate (compare-and-set)', () => {
  it('writes the rating when the appointment is not yet rated', async () => {
    mockTxExecute.mockResolvedValue({ rows: [{ status: BOOKING_STATUS.COMPLETED, customer_rating: null }] })

    const result = await executeAppointmentUpdate(
      APPT_ID,
      'rate',
      { customerRating: 5 },
      BOOKING_STATUS.COMPLETED,
    )

    expect(result).toBe(UPDATED_ROW)
    expect(mockTxUpdate).toHaveBeenCalledTimes(1)
  })

  it('returns null and does NOT write when the appointment is already rated', async () => {
    mockTxExecute.mockResolvedValue({ rows: [{ status: BOOKING_STATUS.COMPLETED, customer_rating: 4 }] })

    const result = await executeAppointmentUpdate(
      APPT_ID,
      'rate',
      { customerRating: 5 },
      BOOKING_STATUS.COMPLETED,
    )

    expect(result).toBeNull()
    expect(mockTxUpdate).not.toHaveBeenCalled()
  })
})
