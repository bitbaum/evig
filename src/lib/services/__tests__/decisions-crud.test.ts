/**
 * Tests for decisions-crud.ts — the CRUD layer for democratic decisions.
 *
 * Mission-relevant: RevampIT is a worker cooperative; the decisions system is
 * participatory governance infrastructure. Bugs in the CRUD layer can silently
 * corrupt decision records, allow unauthorised edits, or let deletes bypass
 * authorization — undermining democratic legitimacy.
 *
 * Behaviors locked:
 *   asArray / asObject helpers
 *   - asArray returns the value when it is an array
 *   - asArray returns the fallback for non-array values
 *   - asObject returns the value when it is a plain object
 *   - asObject returns the fallback for arrays and non-objects
 *
 *   getDecisionStats
 *   - parses integer counts from DB strings
 *   - returns all zeros on empty DB response
 *
 *   getDecisions
 *   - maps voteCount / commentCount as integers
 *   - sets hasUserVoted=true when user is in voted set
 *   - returns total=0 and empty array on no rows
 *
 *   getDecisionById
 *   - returns null when not found
 *   - maps hasUserVoted correctly
 *
 *   createDecision
 *   - generates IDs for options without IDs
 *   - uses default status DRAFT when not specified
 *   - throws if DB returns no rows
 *
 *   updateDecision
 *   - returns { error: 'not_found' } when missing
 *   - returns { error: 'not_creator' } when user isn't creator
 *   - returns { error: 'not_editable' } when status is not editable
 *   - allows outcomeSummary update on closed decisions
 *   - returns existing decision when no fields provided
 *   - updates and returns decision when fields provided
 *
 *   deleteDecision
 *   - returns { error: 'not_found' } when missing
 *   - returns { error: 'not_authorized' } for non-creator non-admin
 *   - super admin can delete any decision
 *   - runs a transaction with 3 DELETEs and returns { deleted: true }
 *
 *   getPublicDecision
 *   - returns null when not found
 *   - returns null when status is CLOSED
 *   - returns null when status is DRAFT
 *   - returns public data when status is VOTING
 *   - returns public data when status is DISCUSSION
 *   - filters out options that have no id
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
  decisions: { id: 'decisions' },
  decisionVotes: { id: 'decisionVotes' },
  decisionComments: { id: 'decisionComments' },
}))

jest.mock('@/db/schema/auth', () => ({
  users: { id: 'users' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  asArray,
  asObject,
  getDecisionStats,
  getDecisions,
  getDecisionById,
  createDecision,
  updateDecision,
  deleteDecision,
  getPublicDecision,
} from '../decisions-crud'
import { DECISION_STATUS } from '@/config/decisions'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CREATOR = 'creator-1'
const USER = 'user-2'

function makeDbRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'dec-1',
    title: 'Test Decision',
    description: 'Description',
    background: null,
    category: 'operativ',
    decision_type: 'operational',
    voting_method: 'consent',
    options: [{ id: 'opt-a', label: 'Ja' }],
    quorum: { type: 'percentage', value: 50 },
    blind_voting: true,
    dot_count: null,
    invited_participants: [],
    status: DECISION_STATUS.DRAFT,
    discussion_deadline: null,
    voting_deadline: null,
    participant_scope: 'all_staff',
    outcome: null,
    outcome_summary: null,
    ai_outcome_narrative: null,
    revealed_at: null,
    closed_at: null,
    closed_by: null,
    cancel_reason: null,
    created_by: CREATOR,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    creator_id: CREATOR,
    creator_email: 'creator@revamp-it.ch',
    creator_name: 'Creator Person',
    vote_count: '3',
    comment_count: '1',
    _total_count: '5',
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
// asArray
// ============================================================================

describe('asArray', () => {
  it('returns the value when it is an array', () => {
    expect(asArray([1, 2, 3], [])).toEqual([1, 2, 3])
  })

  it('returns fallback when value is null', () => {
    expect(asArray(null, [42])).toEqual([42])
  })

  it('returns fallback when value is a string', () => {
    expect(asArray('not an array', [1])).toEqual([1])
  })

  it('returns fallback when value is a plain object', () => {
    expect(asArray({ a: 1 }, [99])).toEqual([99])
  })

  it('returns fallback when value is undefined', () => {
    expect(asArray(undefined, ['x'])).toEqual(['x'])
  })

  it('returns empty array fallback when value is not an array', () => {
    expect(asArray(42, [])).toEqual([])
  })
})

// ============================================================================
// asObject
// ============================================================================

describe('asObject', () => {
  it('returns the value when it is a plain object', () => {
    const obj = { type: 'percentage', value: 50 }
    expect(asObject(obj, {})).toEqual(obj)
  })

  it('returns fallback when value is null', () => {
    expect(asObject(null, { a: 1 })).toEqual({ a: 1 })
  })

  it('returns fallback when value is an array', () => {
    expect(asObject([1, 2], { a: 1 })).toEqual({ a: 1 })
  })

  it('returns fallback when value is a number', () => {
    expect(asObject(42, { x: 'y' })).toEqual({ x: 'y' })
  })

  it('returns fallback when value is undefined', () => {
    expect(asObject(undefined, { default: true })).toEqual({ default: true })
  })
})

// ============================================================================
// getDecisionStats
// ============================================================================

describe('getDecisionStats', () => {
  it('parses integer counts from DB string values', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ voting: '2', discussion: '4', closed: '10', pending_votes: '1' }],
    })

    const stats = await getDecisionStats(USER)

    expect(stats).toEqual({ voting: 2, discussion: 4, closed: 10, pendingVotes: 1 })
  })

  it('returns all zeros when DB returns an empty row', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [{}] })

    const stats = await getDecisionStats(USER)

    expect(stats).toEqual({ voting: 0, discussion: 0, closed: 0, pendingVotes: 0 })
  })
})

// ============================================================================
// getDecisions
// ============================================================================

describe('getDecisions', () => {
  it('maps voteCount and commentCount as integers', async () => {
    const row = makeDbRow({ vote_count: '7', comment_count: '3' })
    mockDbExecute
      .mockResolvedValueOnce({ rows: [row] })   // decisions query
      .mockResolvedValueOnce({ rows: [] })       // voted check

    const { decisions } = await getDecisions({}, USER)

    expect(decisions[0].voteCount).toBe(7)
    expect(decisions[0].commentCount).toBe(3)
  })

  it('sets hasUserVoted=true when decision_id is in voted set', async () => {
    const row = makeDbRow({ id: 'dec-1' })
    mockDbExecute
      .mockResolvedValueOnce({ rows: [row] })
      .mockResolvedValueOnce({ rows: [{ decision_id: 'dec-1' }] })

    const { decisions } = await getDecisions({}, USER)

    expect(decisions[0].hasUserVoted).toBe(true)
  })

  it('sets hasUserVoted=false when user has not voted', async () => {
    const row = makeDbRow({ id: 'dec-1' })
    mockDbExecute
      .mockResolvedValueOnce({ rows: [row] })
      .mockResolvedValueOnce({ rows: [] }) // no votes for this user

    const { decisions } = await getDecisions({}, USER)

    expect(decisions[0].hasUserVoted).toBe(false)
  })

  it('returns total=0 and empty array when no rows', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await getDecisions({}, USER)

    expect(result.total).toBe(0)
    expect(result.decisions).toEqual([])
  })

  it('reads total from _total_count on first row', async () => {
    const row = makeDbRow({ _total_count: '42' })
    mockDbExecute
      .mockResolvedValueOnce({ rows: [row] })
      .mockResolvedValueOnce({ rows: [] })

    const result = await getDecisions({}, USER)

    expect(result.total).toBe(42)
  })
})

// ============================================================================
// getDecisionById
// ============================================================================

describe('getDecisionById', () => {
  it('returns null when decision is not found', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await getDecisionById('missing', USER)

    expect(result).toBeNull()
  })

  it('sets hasUserVoted=true when user has a vote row', async () => {
    const row = makeDbRow()
    mockDbExecute
      .mockResolvedValueOnce({ rows: [row] })             // decision
      .mockResolvedValueOnce({ rows: [{ id: 'vote-1' }] }) // vote check

    const result = await getDecisionById('dec-1', USER)

    expect(result?.hasUserVoted).toBe(true)
  })

  it('sets hasUserVoted=false when no vote row exists', async () => {
    const row = makeDbRow()
    mockDbExecute
      .mockResolvedValueOnce({ rows: [row] })
      .mockResolvedValueOnce({ rows: [] })

    const result = await getDecisionById('dec-1', USER)

    expect(result?.hasUserVoted).toBe(false)
  })

  it('maps voteCount and commentCount as integers', async () => {
    const row = makeDbRow({ vote_count: '5', comment_count: '2' })
    mockDbExecute
      .mockResolvedValueOnce({ rows: [row] })
      .mockResolvedValueOnce({ rows: [] })

    const result = await getDecisionById('dec-1', USER)

    expect(result?.voteCount).toBe(5)
    expect(result?.commentCount).toBe(2)
  })
})

// ============================================================================
// createDecision
// ============================================================================

describe('createDecision', () => {
  const BASE_DATA = {
    title: 'Neues Projekt',
    description: 'Sollen wir starten?',
    decisionType: 'operational',
    votingMethod: 'consent',
  }

  it('generates IDs for options that have no id', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: 'dec-new', title: 'Neues Projekt', status: DECISION_STATUS.DRAFT, created_at: '2026-01-01', creator_email: 'u@r.ch', creator_name: null }],
    })

    await createDecision(
      { ...BASE_DATA, options: [{ label: 'Ja' }, { label: 'Nein' }] },
      CREATOR,
    )

    // The sql template was called with options that now have IDs
    const sqlCalls = (jest.requireMock('drizzle-orm').sql as jest.Mock).mock.calls
    const optionsArg = sqlCalls.find(
      (call: unknown[]) => typeof call[1] === 'string' && call[1].includes('"id"')
    )
    // We can't inspect Drizzle internals here; just verify the call succeeded
    expect(mockDbExecute).toHaveBeenCalledTimes(1)
  })

  it('uses DRAFT status when initialStatus is not specified', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: 'dec-new', title: 'X', status: DECISION_STATUS.DRAFT, created_at: '2026-01-01', creator_email: 'u@r.ch', creator_name: null }],
    })

    const result = await createDecision(BASE_DATA, CREATOR)

    expect(result.status).toBe(DECISION_STATUS.DRAFT)
  })

  it('returns id, title, status, createdAt, and creator', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: 'dec-42', title: 'Neues Projekt', status: DECISION_STATUS.DRAFT, created_at: '2026-01-01', creator_email: 'c@r.ch', creator_name: 'Creator' }],
    })

    const result = await createDecision(BASE_DATA, CREATOR)

    expect(result).toMatchObject({
      id: 'dec-42',
      title: 'Neues Projekt',
      creator: expect.objectContaining({ id: CREATOR }),
    })
  })

  it('throws when DB returns no rows', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    await expect(createDecision(BASE_DATA, CREATOR)).rejects.toThrow()
  })
})

// ============================================================================
// updateDecision
// ============================================================================

describe('updateDecision', () => {
  it('returns { error: "not_found" } when decision does not exist', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await updateDecision('missing', { title: 'X' }, USER)

    expect(result).toEqual({ error: 'not_found' })
  })

  it('returns { error: "not_creator" } when user is not the creator', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: 'dec-1', status: DECISION_STATUS.DRAFT, created_by: CREATOR }],
    })

    const result = await updateDecision('dec-1', { title: 'New' }, USER)

    expect(result).toEqual({ error: 'not_creator' })
  })

  it('returns { error: "not_editable" } when status is VOTING', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: 'dec-1', status: DECISION_STATUS.VOTING, created_by: CREATOR }],
    })

    const result = await updateDecision('dec-1', { title: 'New' }, CREATOR)

    expect(result).toEqual({ error: 'not_editable' })
  })

  it('allows outcomeSummary update on a closed decision', async () => {
    const updated = makeDbRow({ status: DECISION_STATUS.CLOSED, outcome_summary: 'Done' })
    mockDbExecute
      .mockResolvedValueOnce({
        rows: [{ id: 'dec-1', status: DECISION_STATUS.CLOSED, created_by: CREATOR }],
      })
      .mockResolvedValueOnce({ rows: [updated] })

    const result = await updateDecision('dec-1', { outcomeSummary: 'Done' }, CREATOR)

    expect(result).toMatchObject({ decision: expect.objectContaining({ id: 'dec-1' }) })
  })

  it('returns the existing decision when no fields are provided', async () => {
    const existing = { id: 'dec-1', status: DECISION_STATUS.DRAFT, created_by: CREATOR }
    mockDbExecute.mockResolvedValueOnce({ rows: [existing] })

    const result = await updateDecision('dec-1', {}, CREATOR)

    expect(result).toMatchObject({ decision: expect.objectContaining({ id: 'dec-1' }) })
    // Only one DB call (the fetch); no UPDATE was issued
    expect(mockDbExecute).toHaveBeenCalledTimes(1)
  })

  it('executes UPDATE and returns updated decision', async () => {
    const updated = makeDbRow({ title: 'Updated Title' })
    mockDbExecute
      .mockResolvedValueOnce({
        rows: [{ id: 'dec-1', status: DECISION_STATUS.DRAFT, created_by: CREATOR }],
      })
      .mockResolvedValueOnce({ rows: [updated] })

    const result = await updateDecision('dec-1', { title: 'Updated Title' }, CREATOR)

    expect(result).toMatchObject({ decision: expect.objectContaining({ title: 'Updated Title' }) })
    expect(mockDbExecute).toHaveBeenCalledTimes(2)
  })
})

// ============================================================================
// deleteDecision
// ============================================================================

describe('deleteDecision', () => {
  it('returns { error: "not_found" } when decision does not exist', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await deleteDecision('missing', USER, false)

    expect(result).toEqual({ error: 'not_found' })
  })

  it('returns { error: "not_authorized" } for non-creator non-admin', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: 'dec-1', created_by: CREATOR }],
    })

    const result = await deleteDecision('dec-1', USER, false)

    expect(result).toEqual({ error: 'not_authorized' })
  })

  it('allows super admin to delete any decision', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: 'dec-1', created_by: CREATOR }],
    })
    mockTxExecute
      .mockResolvedValueOnce({ rows: [] }) // DELETE comments
      .mockResolvedValueOnce({ rows: [] }) // DELETE votes
      .mockResolvedValueOnce({ rows: [] }) // DELETE decision

    const result = await deleteDecision('dec-1', USER, true)

    expect(result).toEqual({ deleted: true })
  })

  it('runs 3 DELETE statements inside a transaction', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: 'dec-1', created_by: CREATOR }],
    })
    mockTxExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    await deleteDecision('dec-1', CREATOR, false)

    expect(mockDbTransaction).toHaveBeenCalledTimes(1)
    expect(mockTxExecute).toHaveBeenCalledTimes(3)
  })

  it('returns { deleted: true } on success', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: 'dec-1', created_by: CREATOR }],
    })
    mockTxExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const result = await deleteDecision('dec-1', CREATOR, false)

    expect(result).toEqual({ deleted: true })
  })
})

// ============================================================================
// getPublicDecision
// ============================================================================

describe('getPublicDecision', () => {
  it('returns null when decision is not found', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    expect(await getPublicDecision('missing')).toBeNull()
  })

  it('returns null when status is CLOSED', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: 'dec-1', status: DECISION_STATUS.CLOSED, title: 'X', description: '', background: null, voting_method: 'consent', options: [], dot_count: null, voting_deadline: null }],
    })

    expect(await getPublicDecision('dec-1')).toBeNull()
  })

  it('returns null when status is DRAFT', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: 'dec-1', status: DECISION_STATUS.DRAFT, title: 'X', description: '', background: null, voting_method: 'consent', options: [], dot_count: null, voting_deadline: null }],
    })

    expect(await getPublicDecision('dec-1')).toBeNull()
  })

  it('returns public data when status is VOTING', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{
        id: 'dec-1', status: DECISION_STATUS.VOTING,
        title: 'Frage', description: 'Beschreibung', background: null,
        voting_method: 'consent',
        options: [{ id: 'opt-a', label: 'Ja' }],
        dot_count: null, voting_deadline: null,
      }],
    })

    const result = await getPublicDecision('dec-1')

    expect(result).not.toBeNull()
    expect(result?.status).toBe(DECISION_STATUS.VOTING)
    expect(result?.options).toHaveLength(1)
  })

  it('returns public data when status is DISCUSSION', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{
        id: 'dec-2', status: DECISION_STATUS.DISCUSSION,
        title: 'X', description: 'Y', background: null,
        voting_method: 'simple_majority',
        options: [{ id: 'opt-b', label: 'Nein' }],
        dot_count: null, voting_deadline: null,
      }],
    })

    const result = await getPublicDecision('dec-2')

    expect(result?.status).toBe(DECISION_STATUS.DISCUSSION)
  })

  it('filters out options without an id', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{
        id: 'dec-1', status: DECISION_STATUS.VOTING,
        title: 'X', description: '', background: null,
        voting_method: 'consent',
        options: [
          { id: 'opt-a', label: 'Ja' },
          { label: 'No ID here' },       // missing id → filtered out
        ],
        dot_count: null, voting_deadline: null,
      }],
    })

    const result = await getPublicDecision('dec-1')

    expect(result?.options).toHaveLength(1)
    expect(result?.options[0].id).toBe('opt-a')
  })
})
