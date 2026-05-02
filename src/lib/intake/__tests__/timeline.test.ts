/**
 * Tests for intake/timeline.ts — device processing audit trail.
 *
 * Mission-relevant: the intake timeline is the audit log for every device
 * processed at Revamp-IT. If appendIntakeEvent throws instead of silently
 * swallowing errors, the entire erfassung save fails just because the
 * non-critical audit log couldn't be written.
 *
 * Behaviors locked:
 *   appendIntakeEvent
 *   - calls db.update once with the inventory ID in the WHERE clause
 *   - adds timestamp when event has none (uses ISO string)
 *   - preserves provided timestamp when present
 *   - never throws on DB error (non-critical — just logs)
 */

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeChain(result: unknown = undefined) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.update = jest.fn().mockReturnValue(chain)
  chain.set = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbUpdate = jest.fn(() => makeChain())

jest.mock('@/db', () => ({
  db: {
    update: (...args: unknown[]) => mockDbUpdate.apply(null, args),
  },
}))

jest.mock('@/db/schema/inventory', () => ({
  inventoryItems: {
    id: 'ii_id', intakeEvents: 'ii_intakeEvents',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  sql: Object.assign(
    jest.fn().mockReturnValue({ __sql: 'mocked' }),
    { raw: jest.fn().mockReturnValue({ __raw: true }) },
  ),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { appendIntakeEvent } from '../timeline'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_EVENT = {
  type: 'created' as const,
  description: 'Gerät erfasst',
  userId: 'user-1',
  userEmail: 'tech@revamp-it.ch',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbUpdate.mockImplementation(() => makeChain())
})

// ============================================================================
// appendIntakeEvent
// ============================================================================

describe('appendIntakeEvent', () => {
  it('calls db.update once', async () => {
    await appendIntakeEvent('inv-1', BASE_EVENT)

    expect(mockDbUpdate).toHaveBeenCalledTimes(1)
  })

  it('passes the inventory ID to eq for WHERE clause', async () => {
    const { eq } = jest.requireMock('drizzle-orm') as { eq: jest.Mock }

    await appendIntakeEvent('inv-abc', BASE_EVENT)

    const call = eq.mock.calls.find(([, v]: [unknown, string]) => v === 'inv-abc')
    expect(call).toBeDefined()
  })

  it('adds ISO timestamp when event has no timestamp', async () => {
    const { sql } = jest.requireMock('drizzle-orm') as { sql: jest.Mock }
    const before = new Date().toISOString().slice(0, 10)  // YYYY-MM-DD

    await appendIntakeEvent('inv-1', { ...BASE_EVENT, timestamp: undefined })

    const sqlCall = sql.mock.calls[0]
    // The serialized event JSON is passed to sql — find the one with timestamp
    const serialized = JSON.stringify(sqlCall).toLowerCase()
    expect(serialized).toContain(before)
  })

  it('preserves provided timestamp when present', async () => {
    const { sql } = jest.requireMock('drizzle-orm') as { sql: jest.Mock }
    const fixedTs = '2026-01-15T10:00:00.000Z'

    await appendIntakeEvent('inv-1', { ...BASE_EVENT, timestamp: fixedTs })

    const sqlCall = JSON.stringify(sql.mock.calls[0])
    expect(sqlCall).toContain(fixedTs)
  })

  it('never throws on DB error (swallows and logs)', async () => {
    mockDbUpdate.mockImplementationOnce(() => {
      throw new Error('DB connection lost')
    })

    await expect(appendIntakeEvent('inv-1', BASE_EVENT)).resolves.toBeUndefined()
  })

  it('does not throw when DB update rejects', async () => {
    mockDbUpdate.mockImplementationOnce(() => {
      const chain = makeChain(Promise.reject(new Error('update failed')))
      return chain
    })

    // Should not throw
    await expect(appendIntakeEvent('inv-1', BASE_EVENT)).resolves.toBeUndefined()
  })
})
