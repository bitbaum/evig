/**
 * Notification Service Unit Tests
 *
 * Tests createNotification, notifyAllStaff, notifyUsers, and fireNotification.
 * The query mock is reset before each test to avoid cross-test pollution.
 */

import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import {
  createNotification,
  notifyAllStaff,
  notifyUsers,
  fireNotification,
} from '@/lib/services/notifications'

jest.mock('@/lib/auth/db', () => ({ query: jest.fn() }))
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}))

const mockQuery = query as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

// ---------------------------------------------------------------------------
// createNotification
// ---------------------------------------------------------------------------

describe('createNotification', () => {
  it('inserts one row with the correct params', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

    await createNotification('user-1', {
      type: 'decision_voting',
      title: 'Abstimmung geöffnet',
      content: 'Eine neue Abstimmung wartet auf deine Stimme.',
      related_type: 'decision',
      related_id: 'decision-1',
    })

    expect(mockQuery).toHaveBeenCalledTimes(1)
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO'),
      ['user-1', 'decision_voting', 'Abstimmung geöffnet', 'Eine neue Abstimmung wartet auf deine Stimme.', 'decision', 'decision-1']
    )
  })

  it('passes null for optional related_type and related_id', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

    await createNotification('user-1', {
      type: 'system',
      title: 'Systemnachricht',
      content: 'Eine Systemnachricht.',
    })

    const [, params] = mockQuery.mock.calls[0] as [string, unknown[]]
    expect(params[4]).toBeNull()
    expect(params[5]).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// notifyAllStaff
// ---------------------------------------------------------------------------

describe('notifyAllStaff', () => {
  it('fetches staff users and bulk-inserts one row per user', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'staff-a' }, { id: 'staff-b' }] }) // staff query
      .mockResolvedValueOnce({ rows: [], rowCount: 2 })                          // bulk INSERT

    await notifyAllStaff({
      type: 'decision_voting',
      title: 'Abstimmung geöffnet',
      content: 'Bitte stimme ab.',
      related_type: 'decision',
      related_id: 'dec-1',
    })

    expect(mockQuery).toHaveBeenCalledTimes(2)

    // Second call is the bulk INSERT — params should have 12 values (2 users × 6 fields)
    const [insertSql, insertParams] = mockQuery.mock.calls[1] as [string, unknown[]]
    expect(insertSql).toContain('INSERT INTO')
    expect(insertParams).toHaveLength(12)
    expect(insertParams[0]).toBe('staff-a')
    expect(insertParams[6]).toBe('staff-b')
  })

  it('excludes the specified user from notifications', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'staff-b' }] }) // staff-a excluded at SQL level
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })

    await notifyAllStaff(
      { type: 'decision_voting', title: 'Test', content: 'Test.' },
      'staff-a',
    )

    const [selectSql, selectParams] = mockQuery.mock.calls[0] as [string, unknown[]]
    expect(selectSql).toContain('AND id != $1')
    expect(selectParams).toEqual(['staff-a'])
  })

  it('does nothing when there are no staff users', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    await notifyAllStaff({ type: 'test', title: 'Test', content: 'Test.' })

    // Only the staff SELECT — no INSERT
    expect(mockQuery).toHaveBeenCalledTimes(1)
  })

  it('does not include AND id != when no excludeUserId is given', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'staff-a' }] })
      .mockResolvedValueOnce({ rows: [] })

    await notifyAllStaff({ type: 'test', title: 'Test', content: 'Test.' })

    const [selectSql, selectParams] = mockQuery.mock.calls[0] as [string, unknown[]]
    expect(selectSql).not.toContain('AND id != $1')
    expect(selectParams).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// notifyUsers
// ---------------------------------------------------------------------------

describe('notifyUsers', () => {
  it('bulk-inserts one row per user ID', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 2 })

    await notifyUsers(['user-a', 'user-b'], {
      type: 'protocol_finalized',
      title: 'Protokoll abgeschlossen',
      content: 'Das Protokoll ist jetzt verfügbar.',
      related_type: 'protocol',
      related_id: 'proto-1',
    })

    expect(mockQuery).toHaveBeenCalledTimes(1)
    const [sql, params] = mockQuery.mock.calls[0] as [string, unknown[]]
    expect(sql).toContain('INSERT INTO')
    expect(params).toHaveLength(12)
    expect(params[0]).toBe('user-a')
    expect(params[6]).toBe('user-b')
  })

  it('does nothing when userIds is empty', async () => {
    await notifyUsers([], { type: 'test', title: 'Test', content: 'Test.' })
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('generates correct placeholder count for a single user', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

    await notifyUsers(['user-only'], {
      type: 'test',
      title: 'Test',
      content: 'Test.',
    })

    const [sql] = mockQuery.mock.calls[0] as [string, unknown[]]
    // Single-row VALUES clause: ($1, $2, $3, $4, $5, $6)
    expect(sql).toContain('($1, $2, $3, $4, $5, $6)')
    expect(sql).not.toContain('$7')
  })
})

// ---------------------------------------------------------------------------
// fireNotification
// ---------------------------------------------------------------------------

describe('fireNotification', () => {
  it('calls the provided function', async () => {
    const fn = jest.fn().mockResolvedValue(undefined)
    fireNotification(fn, 'test-context')
    // Allow the microtask queue to flush
    await Promise.resolve()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('logs errors without rethrowing — never breaks the caller', async () => {
    const error = new Error('DB down')
    const fn = jest.fn().mockRejectedValue(error)

    // Must not throw
    expect(() => fireNotification(fn, 'failing-context')).not.toThrow()

    // Allow the rejection to propagate through the microtask queue
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(logger.error).toHaveBeenCalledWith(
      'Notification failed: failing-context',
      { error }
    )
  })
})
