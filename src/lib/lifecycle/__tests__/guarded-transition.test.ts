/**
 * Tests for lifecycle/guarded-transition.ts — the race-safe transition guard
 * shared by IT-Hilfe, service appointments, and marketplace orders.
 *
 * Behaviors locked:
 *   - locked row missing            → { ok: false }, apply NOT called
 *   - check() returns false         → { ok: false }, apply NOT called
 *   - check() returns true          → apply runs exactly once, result surfaced
 *   - async check() can read a 2nd entity via the provided tx
 *   - opts.db = an existing Tx      → reuses it (no new module-level transaction)
 *
 * These guarantee the helper aborts cleanly when the precondition fails (so a
 * second racing caller never double-applies) and runs the flow's writes only
 * when the precondition holds under the lock.
 */

// ---------------------------------------------------------------------------
// Mock the module db: db.transaction(cb) invokes cb with a fake tx.
// ---------------------------------------------------------------------------

interface FakeTx {
  execute: jest.Mock
  transaction: jest.Mock
}

function makeFakeTx(rowsQueue: Array<{ rows: unknown[] }>): FakeTx {
  // Each call to execute() shifts the next queued result (FOR UPDATE select
  // first, then any second-entity read the check performs).
  const tx: FakeTx = {
    execute: jest.fn(() => Promise.resolve(rowsQueue.shift() ?? { rows: [] })),
    transaction: jest.fn((cb: (t: FakeTx) => unknown) => cb(tx)),
  }
  return tx
}

let mockModuleTx: FakeTx

const mockTransaction = jest.fn((cb: (t: FakeTx) => unknown) => cb(mockModuleTx))

jest.mock('@/db', () => ({
  db: {
    transaction: (cb: (t: unknown) => unknown) => mockTransaction(cb as (t: FakeTx) => unknown),
  },
}))

import { guardedTransition } from '../guarded-transition'

describe('guardedTransition', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns { ok: false } and does not call apply when the locked row is missing', async () => {
    mockModuleTx = makeFakeTx([{ rows: [] }])
    const apply = jest.fn()

    const res = await guardedTransition({
      lockTable: 'it_hilfe_requests',
      lockId: 'r1',
      check: () => true,
      apply,
    })

    expect(res).toEqual({ ok: false, reason: 'not_found' })
    expect(apply).not.toHaveBeenCalled()
  })

  it('returns { ok: false } and does not call apply when check() is false', async () => {
    mockModuleTx = makeFakeTx([{ rows: [{ status: 'matched' }] }])
    const apply = jest.fn()

    const res = await guardedTransition<{ status: string }, void>({
      lockTable: 'it_hilfe_requests',
      lockId: 'r1',
      check: (row) => row.status === 'open',
      apply,
    })

    expect(res).toEqual({ ok: false, reason: 'check_failed' })
    expect(apply).not.toHaveBeenCalled()
  })

  it('runs apply exactly once and surfaces its result when check() passes', async () => {
    mockModuleTx = makeFakeTx([{ rows: [{ status: 'open' }] }])
    const apply = jest.fn((_tx: unknown, _row: unknown) => Promise.resolve('done'))

    const res = await guardedTransition<{ status: string }, string>({
      lockTable: 'it_hilfe_requests',
      lockId: 'r1',
      check: (row) => row.status === 'open',
      apply,
    })

    expect(res).toEqual({ ok: true, result: 'done' })
    expect(apply).toHaveBeenCalledTimes(1)
    // apply receives (tx, row)
    expect(apply.mock.calls[0][1]).toEqual({ status: 'open' })
  })

  it('lets an async check() read a second entity through the same tx', async () => {
    // First execute() = FOR UPDATE on the request; second = the offer re-read.
    mockModuleTx = makeFakeTx([
      { rows: [{ status: 'open' }] },
      { rows: [{ status: 'pending' }] },
    ])
    const apply = jest.fn(() => Promise.resolve(true))

    const res = await guardedTransition<{ status: string }, boolean>({
      lockTable: 'it_hilfe_requests',
      lockId: 'r1',
      check: async (row, tx) => {
        if (row.status !== 'open') return false
        const offer = await tx.execute({} as never)
        return (offer.rows[0] as { status: string }).status === 'pending'
      },
      apply,
    })

    expect(res).toEqual({ ok: true, result: true })
    expect(mockModuleTx.execute).toHaveBeenCalledTimes(2)
    expect(apply).toHaveBeenCalledTimes(1)
  })

  it('reuses a passed-in Tx instead of opening a module-level transaction', async () => {
    const passedTx = makeFakeTx([{ rows: [{ status: 'open' }] }])
    const apply = jest.fn(() => Promise.resolve('via-tx'))

    const res = await guardedTransition<{ status: string }, string>({
      lockTable: 'service_appointments',
      lockId: 'a1',
      check: (row) => row.status === 'open',
      apply,
      db: passedTx as never,
    })

    expect(res).toEqual({ ok: true, result: 'via-tx' })
    expect(passedTx.transaction).toHaveBeenCalledTimes(1)
    expect(mockTransaction).not.toHaveBeenCalled()
  })
})
