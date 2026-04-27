/**
 * Tests for protocols-queries.ts — CRUD & query operations for meeting protocols.
 *
 * Mission-relevant: meeting protocols are the official record of cooperative
 * governance decisions, action items, and vote outcomes. Bugs here can corrupt
 * records, allow unauthorized deletes, or let finalized protocols be
 * silently skipped in notification flows.
 *
 * Behaviors locked:
 *   getProtocolStats
 *   - parses integer stats from DB strings
 *   - returns all zeros on empty/missing row
 *
 *   getTeamMembers
 *   - returns name+id rows from the DB
 *
 *   getProtocols
 *   - strips _total_count from returned protocol objects
 *   - returns total from _total_count on first row
 *   - returns { protocols: [], total: 0 } on no rows
 *
 *   getProtocolById
 *   - returns null when not found or not visible
 *   - returns the row when found
 *
 *   createProtocol
 *   - returns { id } from insert
 *
 *   updateProtocol
 *   - returns null when protocol not found
 *   - throws PROTOCOL_NOT_EDITABLE when status is FINALIZED
 *   - returns null when no fields are provided
 *   - executes update and returns row when fields provided
 *
 *   deleteProtocol
 *   - returns { error: 'not_found' } when protocol missing
 *   - returns { error: 'not_authorized' } for non-creator non-admin
 *   - super admin can delete any protocol
 *   - runs 4-DELETE transaction and returns { deleted: true }
 *
 *   finalizeProtocol
 *   - returns false when no rows updated (not in REVIEW state)
 *   - returns true and fires notification when protocol finalized
 *   - does not fire notification when attendees list is empty
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbExecute = jest.fn()
const mockTxExecute = jest.fn()
const mockTx = { execute: (...args: unknown[]) => mockTxExecute(...args) }
const mockDbTransaction = jest.fn().mockImplementation(
  async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
)

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute(...args),
    transaction: (...args: unknown[]) => mockDbTransaction(...args),
  },
}))

jest.mock('drizzle-orm', () => {
  const sqlFn = jest.fn().mockReturnValue({ __sql: 'mocked' })
  ;(sqlFn as unknown as Record<string, unknown>).raw = jest.fn().mockReturnValue({ __sql: 'raw' })
  ;(sqlFn as unknown as Record<string, unknown>).join = jest.fn().mockReturnValue({ __sql: 'joined' })
  return {
    ...jest.requireActual('drizzle-orm'),
    sql: sqlFn,
    getTableName: jest.fn().mockReturnValue('mock_table'),
  }
})

jest.mock('@/db/schema/misc', () => ({
  meetingProtocols: { id: 'meetingProtocols' },
  protocolActionLinks: { id: 'protocolActionLinks' },
  protocolDecisionVotes: { id: 'protocolDecisionVotes' },
  protocolDecisionOutcomes: { id: 'protocolDecisionOutcomes' },
}))

jest.mock('@/db/schema/auth', () => ({
  users: { id: 'users' },
}))

jest.mock('@/config/protocol-status', () => ({
  PROTOCOL_STATUS: {
    DRAFT: 'draft',
    PROCESSING: 'processing',
    REVIEW: 'review',
    FINALIZED: 'finalized',
  },
}))

const mockFireNotification = jest.fn().mockImplementation((fn: () => void) => { fn() })
const mockNotifyUsers = jest.fn().mockResolvedValue(undefined)

jest.mock('@/lib/services/notifications', () => ({
  notifyUsers: (...args: unknown[]) => mockNotifyUsers(...args),
  fireNotification: (...args: unknown[]) => mockFireNotification(...args),
}))

jest.mock('@/config/notifications', () => ({
  RELATED_TYPES: {
    TASK: 'task',
    PROTOCOL: 'protocol',
    DECISION: 'decision',
    CONVERSATION: 'conversation',
    APPOINTMENT: 'appointment',
    IT_HILFE: 'it_hilfe',
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  getProtocolStats,
  getTeamMembers,
  getProtocols,
  getProtocolById,
  createProtocol,
  updateProtocol,
  deleteProtocol,
  finalizeProtocol,
} from '../protocols-queries'
import { PROTOCOL_STATUS } from '@/config/protocol-status'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = 'user-1'
const CREATOR_ID = 'creator-1'
const OTHER_USER = 'user-other'
const PROTOCOL_ID = 'proto-1'

function makeProtocolRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: PROTOCOL_ID,
    title: 'Teammeeting März 2026',
    meeting_date: '2026-03-15',
    meeting_type: 'weekly',
    visibility: 'team',
    attendees: [USER_ID],
    status: PROTOCOL_STATUS.DRAFT,
    created_by: CREATOR_ID,
    created_at: '2026-03-15T10:00:00Z',
    created_by_name: 'Creator Person',
    _total_count: '5',
    action_item_count: 3,
    unlinked_action_item_count: 1,
    has_structured_notes: true,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  // Re-initialize transaction: clearAllMocks keeps implementations but we
  // want a fresh pass-through each test.
  mockDbTransaction.mockImplementation(
    async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
  )
  // Re-initialize fire-and-forget helpers
  mockFireNotification.mockImplementation((fn: () => void) => { fn() })
  mockNotifyUsers.mockResolvedValue(undefined)
})

// ============================================================================
// getProtocolStats
// ============================================================================

describe('getProtocolStats', () => {
  it('parses integer stats from DB string values', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ total: '10', draft: '3', review: '2', finalized: '5' }],
    })

    const stats = await getProtocolStats(USER_ID, false)

    expect(stats).toEqual({ total: 10, draft: 3, review: 2, finalized: 5 })
  })

  it('returns all zeros on empty row', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [{}] })

    const stats = await getProtocolStats(USER_ID, false)

    expect(stats).toEqual({ total: 0, draft: 0, review: 0, finalized: 0 })
  })
})

// ============================================================================
// getTeamMembers
// ============================================================================

describe('getTeamMembers', () => {
  it('returns id+name rows from the DB', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [
        { id: 'u1', name: 'Alice' },
        { id: 'u2', name: 'Bob' },
      ],
    })

    const members = await getTeamMembers()

    expect(members).toHaveLength(2)
    expect(members[0]).toEqual({ id: 'u1', name: 'Alice' })
  })

  it('returns empty array when no team members exist', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const members = await getTeamMembers()

    expect(members).toEqual([])
  })
})

// ============================================================================
// getProtocols
// ============================================================================

describe('getProtocols', () => {
  it('strips _total_count from returned protocol objects', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [makeProtocolRow()] })

    const { protocols } = await getProtocols(USER_ID, false)

    expect(protocols[0]).not.toHaveProperty('_total_count')
  })

  it('returns total from _total_count on first row', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [makeProtocolRow({ _total_count: '42' })],
    })

    const { total } = await getProtocols(USER_ID, false)

    expect(total).toBe(42)
  })

  it('returns { protocols: [], total: 0 } when no rows', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await getProtocols(USER_ID, false)

    expect(result.protocols).toEqual([])
    expect(result.total).toBe(0)
  })

  it('returns all protocol fields except _total_count', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [makeProtocolRow()] })

    const { protocols } = await getProtocols(USER_ID, false)

    expect(protocols[0].title).toBe('Teammeeting März 2026')
    expect(protocols[0].status).toBe(PROTOCOL_STATUS.DRAFT)
  })
})

// ============================================================================
// getProtocolById
// ============================================================================

describe('getProtocolById', () => {
  it('returns null when protocol is not found', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await getProtocolById('missing', USER_ID, false)

    expect(result).toBeNull()
  })

  it('returns the protocol row when found and visible', async () => {
    const row = makeProtocolRow()
    mockDbExecute.mockResolvedValueOnce({ rows: [row] })

    const result = await getProtocolById(PROTOCOL_ID, USER_ID, false)

    expect(result).not.toBeNull()
    expect(result?.id).toBe(PROTOCOL_ID)
  })
})

// ============================================================================
// createProtocol
// ============================================================================

describe('createProtocol', () => {
  it('returns { id } from the insert', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [{ id: 'new-proto-1' }] })

    const result = await createProtocol(
      {
        title: 'Neues Protokoll',
        meeting_date: '2026-04-01',
        meeting_type: 'weekly',
        visibility: 'team',
        attendees: [USER_ID],
        input_method: 'transcript',
      },
      USER_ID,
    )

    expect(result).toEqual({ id: 'new-proto-1' })
  })
})

// ============================================================================
// updateProtocol
// ============================================================================

describe('updateProtocol', () => {
  it('returns null when protocol is not found', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await updateProtocol(PROTOCOL_ID, { title: 'New' }, USER_ID)

    expect(result).toBeNull()
  })

  it('throws PROTOCOL_NOT_EDITABLE when status is FINALIZED', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ status: PROTOCOL_STATUS.FINALIZED, created_by: CREATOR_ID }],
    })

    await expect(
      updateProtocol(PROTOCOL_ID, { title: 'New' }, USER_ID),
    ).rejects.toThrow('PROTOCOL_NOT_EDITABLE')
  })

  it('returns null when no update fields are provided', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ status: PROTOCOL_STATUS.DRAFT, created_by: CREATOR_ID }],
    })

    const result = await updateProtocol(PROTOCOL_ID, {}, USER_ID)

    expect(result).toBeNull()
    // Only the initial SELECT was called; no UPDATE
    expect(mockDbExecute).toHaveBeenCalledTimes(1)
  })

  it('executes UPDATE and returns the updated row', async () => {
    const updated = makeProtocolRow({ title: 'Aktualisierter Titel' })
    mockDbExecute
      .mockResolvedValueOnce({
        rows: [{ status: PROTOCOL_STATUS.DRAFT, created_by: CREATOR_ID }],
      })
      .mockResolvedValueOnce({ rows: [updated] })

    const result = await updateProtocol(PROTOCOL_ID, { title: 'Aktualisierter Titel' }, USER_ID)

    expect(result?.title).toBe('Aktualisierter Titel')
    expect(mockDbExecute).toHaveBeenCalledTimes(2)
  })

  it('accepts REVIEW status for updates', async () => {
    const updated = makeProtocolRow({ status: PROTOCOL_STATUS.REVIEW })
    mockDbExecute
      .mockResolvedValueOnce({
        rows: [{ status: PROTOCOL_STATUS.REVIEW, created_by: CREATOR_ID }],
      })
      .mockResolvedValueOnce({ rows: [updated] })

    const result = await updateProtocol(PROTOCOL_ID, { title: 'Updated' }, USER_ID)

    expect(result).not.toBeNull()
  })
})

// ============================================================================
// deleteProtocol
// ============================================================================

describe('deleteProtocol', () => {
  it('returns { error: "not_found" } when protocol missing', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await deleteProtocol(PROTOCOL_ID, USER_ID, false)

    expect(result).toEqual({ error: 'not_found' })
  })

  it('returns { error: "not_authorized" } for non-creator non-admin', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: PROTOCOL_ID, created_by: CREATOR_ID }],
    })

    const result = await deleteProtocol(PROTOCOL_ID, OTHER_USER, false)

    expect(result).toEqual({ error: 'not_authorized' })
  })

  it('allows super admin to delete any protocol', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: PROTOCOL_ID, created_by: CREATOR_ID }],
    })
    mockTxExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const result = await deleteProtocol(PROTOCOL_ID, OTHER_USER, true)

    expect(result).toEqual({ deleted: true })
  })

  it('runs 4 DELETEs inside a transaction and returns { deleted: true }', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: PROTOCOL_ID, created_by: CREATOR_ID }],
    })
    mockTxExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const result = await deleteProtocol(PROTOCOL_ID, CREATOR_ID, false)

    expect(result).toEqual({ deleted: true })
    expect(mockDbTransaction).toHaveBeenCalledTimes(1)
    expect(mockTxExecute).toHaveBeenCalledTimes(4)
  })
})

// ============================================================================
// finalizeProtocol
// ============================================================================

describe('finalizeProtocol', () => {
  it('returns false when no rows updated (protocol not in REVIEW state)', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await finalizeProtocol(PROTOCOL_ID)

    expect(result).toBe(false)
  })

  it('returns true when protocol is successfully finalized', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: PROTOCOL_ID, title: 'Teammeeting', attendees: [USER_ID] }],
    })

    const result = await finalizeProtocol(PROTOCOL_ID)

    expect(result).toBe(true)
  })

  it('fires notification to attendees when protocol is finalized', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: PROTOCOL_ID, title: 'Teammeeting', attendees: ['u1', 'u2'] }],
    })

    await finalizeProtocol(PROTOCOL_ID)

    expect(mockFireNotification).toHaveBeenCalledTimes(1)
    expect(mockNotifyUsers).toHaveBeenCalledWith(
      ['u1', 'u2'],
      expect.objectContaining({ type: 'protocol_finalized' }),
    )
  })

  it('does NOT fire notification when attendees list is empty', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: PROTOCOL_ID, title: 'Teammeeting', attendees: [] }],
    })

    await finalizeProtocol(PROTOCOL_ID)

    expect(mockFireNotification).not.toHaveBeenCalled()
  })
})
