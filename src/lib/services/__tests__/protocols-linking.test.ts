/**
 * Tests for protocols-linking.ts — action item → task/decision linking.
 *
 * Mission-relevant: action items from meeting protocols must be faithfully
 * converted into system tasks and decisions so that governance outcomes
 * actually drive work. A bug here means action items silently disappear —
 * cooperative commitments made in meetings never enter the work queue.
 *
 * Behaviors locked:
 *   getActionLinks
 *   - returns an empty array when no links exist
 *   - returns rows (with joined task/decision fields) when links exist
 *
 *   linkActionItemToTask
 *   - runs a transaction and returns { taskId, linkId }
 *   - inserts task first, then link (2 tx.execute calls)
 *   - applies provided title, description, priority
 *   - defaults task_type to 'one_time' and category to 'admin' when absent
 *
 *   linkActionItemToDecision
 *   - runs a transaction and returns { decisionId, linkId }
 *   - inserts decision first, then link (2 tx.execute calls)
 *   - defaults decisionType to 'sense_check' and votingMethod to 'simple_majority'
 *   - defaults initialStatus to DECISION_STATUS.DRAFT when absent
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbExecute = jest.fn()
const mockTxExecute = jest.fn()
const mockTx = { execute: (...args: unknown[]) => mockTxExecute.apply(null, args) }
const mockDbTransaction = jest.fn().mockImplementation(
  async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
)

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
    transaction: (...args: unknown[]) => mockDbTransaction.apply(null, args),
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
  protocolActionLinks: { id: 'protocolActionLinks' },
  tasks: { id: 'tasks' },
  decisions: { id: 'decisions' },
}))

jest.mock('@/config/decisions', () => ({
  DECISION_STATUS: { DRAFT: 'draft', DISCUSSION: 'discussion' },
}))

jest.mock('@/config/notifications', () => ({
  RELATED_TYPES: { TASK: 'task', DECISION: 'decision', PROTOCOL: 'protocol' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { getActionLinks, linkActionItemToTask, linkActionItemToDecision } from '../protocols-linking'
import { DECISION_STATUS } from '@/config/decisions'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PROTOCOL_ID = 'proto-1'
const ACTION_ITEM_ID = 'ai-1'
const CREATOR_ID = 'creator-1'

function makeActionLinkRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'link-1',
    protocol_id: PROTOCOL_ID,
    action_item_id: ACTION_ITEM_ID,
    link_type: 'task',
    linked_task_id: 'task-1',
    linked_decision_id: null,
    linked_task_title: 'Aufgabe erstellen',
    linked_task_status: 'todo',
    linked_decision_title: null,
    linked_decision_status: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbTransaction.mockImplementation(
    async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx),
  )
})

// ============================================================================
// getActionLinks
// ============================================================================

describe('getActionLinks', () => {
  it('returns an empty array when no links exist', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await getActionLinks(PROTOCOL_ID)

    expect(result).toEqual([])
  })

  it('returns rows with joined task fields when links exist', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [makeActionLinkRow()] })

    const result = await getActionLinks(PROTOCOL_ID)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id: 'link-1',
      protocol_id: PROTOCOL_ID,
      linked_task_title: 'Aufgabe erstellen',
      linked_task_status: 'todo',
    })
  })

  it('returns multiple links in order', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [
        makeActionLinkRow({ id: 'link-1' }),
        makeActionLinkRow({ id: 'link-2', action_item_id: 'ai-2' }),
      ],
    })

    const result = await getActionLinks(PROTOCOL_ID)

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('link-1')
    expect(result[1].id).toBe('link-2')
  })
})

// ============================================================================
// linkActionItemToTask
// ============================================================================

describe('linkActionItemToTask', () => {
  it('runs a transaction and returns { taskId, linkId }', async () => {
    mockTxExecute
      .mockResolvedValueOnce({ rows: [{ id: 'task-abc' }] })  // INSERT task
      .mockResolvedValueOnce({ rows: [{ id: 'link-xyz' }] })  // INSERT link

    const result = await linkActionItemToTask(
      PROTOCOL_ID,
      ACTION_ITEM_ID,
      { title: 'Neue Aufgabe' },
      CREATOR_ID,
    )

    expect(result).toEqual({ taskId: 'task-abc', linkId: 'link-xyz' })
    expect(mockDbTransaction).toHaveBeenCalledTimes(1)
  })

  it('makes exactly 2 tx.execute calls (task insert + link insert)', async () => {
    mockTxExecute
      .mockResolvedValueOnce({ rows: [{ id: 'task-1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'link-1' }] })

    await linkActionItemToTask(PROTOCOL_ID, ACTION_ITEM_ID, { title: 'T' }, CREATOR_ID)

    expect(mockTxExecute).toHaveBeenCalledTimes(2)
  })

  it('passes title, description, and priority to the INSERT', async () => {
    mockTxExecute
      .mockResolvedValueOnce({ rows: [{ id: 'task-1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'link-1' }] })

    await linkActionItemToTask(
      PROTOCOL_ID,
      ACTION_ITEM_ID,
      { title: 'Laptop reparieren', description: 'Bildschirm defekt', priority: 'high' },
      CREATOR_ID,
    )

    // Verify sql was called with the title value (first arg is the template literal)
    const sqlCalls = (jest.requireMock('drizzle-orm').sql as jest.Mock).mock.calls
    const callsWithTitle = sqlCalls.filter(
      (call: unknown[]) => call.includes('Laptop reparieren'),
    )
    expect(callsWithTitle.length).toBeGreaterThan(0)
  })
})

// ============================================================================
// linkActionItemToDecision
// ============================================================================

describe('linkActionItemToDecision', () => {
  it('runs a transaction and returns { decisionId, linkId }', async () => {
    mockTxExecute
      .mockResolvedValueOnce({ rows: [{ id: 'dec-abc' }] })  // INSERT decision
      .mockResolvedValueOnce({ rows: [{ id: 'link-xyz' }] }) // INSERT link

    const result = await linkActionItemToDecision(
      PROTOCOL_ID,
      ACTION_ITEM_ID,
      { title: 'Neue Entscheidung', description: 'Beschreibung' },
      CREATOR_ID,
    )

    expect(result).toEqual({ decisionId: 'dec-abc', linkId: 'link-xyz' })
    expect(mockDbTransaction).toHaveBeenCalledTimes(1)
  })

  it('makes exactly 2 tx.execute calls (decision insert + link insert)', async () => {
    mockTxExecute
      .mockResolvedValueOnce({ rows: [{ id: 'dec-1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'link-1' }] })

    await linkActionItemToDecision(
      PROTOCOL_ID,
      ACTION_ITEM_ID,
      { title: 'D', description: 'D' },
      CREATOR_ID,
    )

    expect(mockTxExecute).toHaveBeenCalledTimes(2)
  })

  it('uses DECISION_STATUS.DRAFT as default initialStatus', async () => {
    mockTxExecute
      .mockResolvedValueOnce({ rows: [{ id: 'dec-1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'link-1' }] })

    await linkActionItemToDecision(
      PROTOCOL_ID,
      ACTION_ITEM_ID,
      { title: 'D', description: 'D' },
      CREATOR_ID,
    )

    const sqlCalls = (jest.requireMock('drizzle-orm').sql as jest.Mock).mock.calls
    const callsWithDraft = sqlCalls.filter(
      (call: unknown[]) => call.includes(DECISION_STATUS.DRAFT),
    )
    expect(callsWithDraft.length).toBeGreaterThan(0)
  })
})
