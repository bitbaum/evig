/**
 * Tests for lifecycle/review-workflow.ts — the shared review-transition recipe.
 *
 * Behaviors locked:
 *   - not_found (pre-read empty) → no transaction opened
 *   - invalid_transition carries the resolve reason + offending `from`
 *   - conflict: legal at pre-read, illegal under the lock (a racer won)
 *   - guard_failed carries the guard code; apply/emit never run
 *   - success: standard UPDATE runs, applyInTxn runs in-txn, emit dispatched
 *     AFTER commit with the locked row
 *   - rollback: applyInTxn throwing means dispatch is NEVER called
 *   - write policy: reviewer 'clear' + extra() produce NULL/extra assignments
 */

interface FakeConn {
  execute: jest.Mock
  transaction: jest.Mock
}

let preReadResults: Array<{ rows: unknown[] }>
let txResults: Array<{ rows: unknown[] }>
let executedTxSql: string[]
let fakeTx: { execute: jest.Mock; transaction: jest.Mock }
let mockDb: FakeConn

function sqlToString(query: unknown): string {
  // Drizzle SQL objects expose queryChunks (recursively — sql.join nests SQL
  // fragments). Cheap best-effort flatten for assertions.
  if (typeof query === 'string') return query
  if (!query || typeof query !== 'object') return '?'
  if ('queryChunks' in query) {
    return ((query as { queryChunks: unknown[] }).queryChunks).map(sqlToString).join('')
  }
  if ('value' in query) {
    const value = (query as { value: unknown }).value
    return Array.isArray(value) ? value.join('') : String(value)
  }
  return '?'
}

jest.mock('@/db', () => ({
  db: {
    execute: (q: unknown) => mockDb.execute(q),
    transaction: (cb: (t: unknown) => unknown) => mockDb.transaction(cb),
  },
}))

const mockDispatch = jest.fn().mockResolvedValue(undefined)
jest.mock('../dispatch', () => ({
  dispatchWorkflowEvent: (event: unknown) => mockDispatch(event),
}))

jest.mock('@/lib/logger', () => ({
  logger: { warn: jest.fn(), error: jest.fn(), info: jest.fn() },
}))

import { runReviewTransition } from '../review-workflow'

const TRANSITIONS = [
  { action: 'approve', from: 'submitted', to: 'approved' },
  { action: 'reject', from: 'submitted', to: 'rejected' },
  { action: 'reopen', from: 'approved', to: 'draft' },
] as const

function setup(opts: { pre: unknown[]; locked?: unknown[] }) {
  preReadResults = [{ rows: opts.pre }]
  txResults = [{ rows: opts.locked ?? opts.pre }]
  executedTxSql = []
  fakeTx = {
    execute: jest.fn((q: unknown) => {
      executedTxSql.push(sqlToString(q))
      return Promise.resolve(txResults.shift() ?? { rows: [] })
    }),
    transaction: jest.fn((cb: (t: unknown) => unknown) => cb(fakeTx)),
  }
  mockDb = {
    execute: jest.fn(() => Promise.resolve(preReadResults.shift() ?? { rows: [] })),
    transaction: jest.fn(async (cb: (t: unknown) => unknown) => cb(fakeTx)),
  }
}

const baseOpts = {
  target: { table: 'widgets', select: ['user_id'] },
  transitions: TRANSITIONS,
  id: 'w1',
  actor: { id: 'admin-1' },
} as const

describe('runReviewTransition', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns not_found without opening a transaction when the row is missing', async () => {
    setup({ pre: [] })
    const res = await runReviewTransition({ ...baseOpts, action: 'approve' })
    expect(res).toEqual({ ok: false, code: 'not_found' })
    expect(mockDb.transaction).not.toHaveBeenCalled()
  })

  it('returns invalid_transition with reason + from when pre-read state is illegal', async () => {
    setup({ pre: [{ status: 'draft', user_id: 'u1' }] })
    const res = await runReviewTransition({ ...baseOpts, action: 'approve' })
    expect(res).toEqual({ ok: false, code: 'invalid_transition', reason: 'wrong_state', from: 'draft' })
    expect(mockDb.transaction).not.toHaveBeenCalled()
  })

  it('returns conflict when the state changed between pre-read and lock', async () => {
    setup({
      pre: [{ status: 'submitted', user_id: 'u1' }],
      locked: [{ status: 'approved', user_id: 'u1' }],
    })
    const res = await runReviewTransition({ ...baseOpts, action: 'approve' })
    expect(res).toEqual({ ok: false, code: 'conflict' })
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('returns guard_failed with the guard code; emit never dispatched', async () => {
    setup({ pre: [{ status: 'submitted', user_id: 'admin-1' }] })
    const res = await runReviewTransition({
      ...baseOpts,
      action: 'approve',
      guards: [{ code: 'self_review', check: (row, actor) => row.user_id !== actor.id }],
      emit: () => ({ type: 't', recipients: { userId: 'x' }, title: '', content: '' }),
    })
    expect(res).toEqual({ ok: false, code: 'guard_failed', guard: 'self_review' })
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('success: UPDATE + applyInTxn in the transaction, emit dispatched after', async () => {
    setup({ pre: [{ status: 'submitted', user_id: 'u1' }] })
    const order: string[] = []
    const applyInTxn = jest.fn(async () => { order.push('apply') })
    mockDispatch.mockImplementation(async () => { order.push('dispatch') })

    const res = await runReviewTransition({
      ...baseOpts,
      action: 'approve',
      reason: 'looks good',
      applyInTxn,
      emit: (row, ctx) => ({
        type: 'test_event',
        recipients: { userId: String(row.user_id) },
        title: `now ${ctx.to}`,
        content: '',
      }),
    })

    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.from).toBe('submitted')
      expect(res.to).toBe('approved')
    }
    // FOR UPDATE select + the standard UPDATE both ran in the tx.
    const updateSql = executedTxSql.find(s => s.trimStart().startsWith('UPDATE'))
    expect(updateSql).toContain('status')
    expect(updateSql).toContain('reviewed_by')
    expect(updateSql).toContain('review_notes')
    expect(applyInTxn).toHaveBeenCalledTimes(1)
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'test_event',
      recipients: { userId: 'u1' },
      title: 'now approved',
    }))
    expect(order).toEqual(['apply', 'dispatch'])
  })

  it('rollback: applyInTxn throwing rejects and dispatch is never called', async () => {
    setup({ pre: [{ status: 'submitted', user_id: 'u1' }] })
    await expect(runReviewTransition({
      ...baseOpts,
      action: 'approve',
      applyInTxn: async () => { throw new Error('domain write failed') },
      emit: () => ({ type: 't', recipients: { userId: 'x' }, title: '', content: '' }),
    })).rejects.toThrow('domain write failed')
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it('write policy: reviewer clear + extra produce NULL and extra assignments', async () => {
    setup({ pre: [{ status: 'approved', user_id: 'u1' }] })
    const res = await runReviewTransition({
      ...baseOpts,
      action: 'reopen',
      write: {
        reopen: {
          reviewer: 'clear',
          reason: 'clear',
          extra: () => ({ submitted_at: null }),
        },
      },
    })
    expect(res.ok).toBe(true)
    const updateSql = executedTxSql.find(s => s.trimStart().startsWith('UPDATE'))
    expect(updateSql).toContain('reviewed_by = NULL')
    expect(updateSql).toContain('reviewed_at = NULL')
    expect(updateSql).toContain('submitted_at')
  })

  it('emit failure is swallowed — the transition still reports ok', async () => {
    setup({ pre: [{ status: 'submitted', user_id: 'u1' }] })
    const res = await runReviewTransition({
      ...baseOpts,
      action: 'approve',
      emit: () => { throw new Error('emit exploded') },
    })
    expect(res.ok).toBe(true)
  })
})
