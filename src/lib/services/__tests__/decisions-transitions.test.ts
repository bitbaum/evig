/**
 * Tests for decisions-transitions.ts — the decision state machine.
 *
 * Mission-relevant: RevampIT runs as a worker cooperative with participatory
 * governance. The transitionDecision function guards every status change and
 * enforces quorum before closing a vote. A bug here could let a decision close
 * without the required participation, undermining democratic legitimacy.
 *
 * Behaviors locked:
 *   - returns { error: 'not_found' } when decision does not exist
 *   - returns { error: 'invalid_transition' } for forbidden state moves
 *   - CANCELLED transition updates status, stores cancelReason, returns decision
 *   - CLOSED transition: quorum not met → { error: 'quorum_not_met', message }
 *   - quorum message format: "N von M Stimmen benötigt (P%)."
 *   - percentage quorum: Math.ceil(value% × eligible) required votes
 *   - absolute quorum: exact value required
 *   - quorum met → transaction runs, decision returned
 *   - default transition (draft → discussion) returns updated decision
 *   - VOTING transition resolves eligible voters
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
}))

jest.mock('@/db/schema/auth', () => ({
  users: { id: 'users' },
}))

const mockResolveEligibleUserIds = jest.fn()
const mockComputeTallies = jest.fn()

jest.mock('@/lib/services/decisions-voting', () => ({
  resolveEligibleUserIds: (...args: unknown[]) => mockResolveEligibleUserIds(...args),
  computeTallies: (...args: unknown[]) => mockComputeTallies(...args),
}))

// fireNotification is fire-and-forget — execute the callback synchronously so
// we can assert side effects without waiting on unresolved promises
jest.mock('@/lib/services/notifications', () => ({
  notifyUsers: jest.fn().mockResolvedValue(undefined),
  createNotification: jest.fn().mockResolvedValue(undefined),
  fireNotification: jest.fn().mockImplementation((fn: () => void) => { fn() }),
}))

jest.mock('@/lib/ai/decisions-narrative', () => ({
  generateOutcomeNarrative: jest.fn().mockResolvedValue(null),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { transitionDecision } from '../decisions-transitions'
import { DECISION_STATUS } from '@/config/decisions'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeDecision(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'dec-1',
    title: 'Neues Projekt starten',
    status: DECISION_STATUS.DRAFT,
    quorum: { type: 'percentage', value: 50 },
    invited_participants: [],
    participant_scope: 'all_staff',
    options: [{ id: 'opt-a', label: 'Ja' }, { id: 'opt-b', label: 'Nein' }],
    voting_method: 'consent',
    voting_deadline: null,
    outcome: null,
    outcome_summary: null,
    cancel_reason: null,
    created_by: 'creator-1',
    description: 'Sollen wir ein neues Projekt starten?',
    category: 'operativ',
    ...overrides,
  }
}

const ACTOR = 'user-actor-1'

beforeEach(() => {
  jest.clearAllMocks()
  // Default: 5 eligible voters
  mockResolveEligibleUserIds.mockResolvedValue(['u1', 'u2', 'u3', 'u4', 'u5'])
  mockComputeTallies.mockReturnValue({ 'opt-a': { votes: 3, percentage: 100 } })
})

// ============================================================================
// Not found
// ============================================================================

describe('transitionDecision — not found', () => {
  it('returns { error: "not_found" } when decision does not exist', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await transitionDecision('missing-id', DECISION_STATUS.DISCUSSION, ACTOR)

    expect(result).toEqual({ error: 'not_found' })
  })
})

// ============================================================================
// Invalid transition
// ============================================================================

describe('transitionDecision — invalid transition', () => {
  it('returns { error: "invalid_transition" } for a forbidden status move', async () => {
    // closed → voting is not in VALID_TRANSITIONS
    mockDbExecute.mockResolvedValueOnce({ rows: [makeDecision({ status: DECISION_STATUS.CLOSED })] })

    const result = await transitionDecision('dec-1', DECISION_STATUS.VOTING, ACTOR)

    expect(result).toEqual({ error: 'invalid_transition' })
  })

  it('returns { error: "invalid_transition" } for cancelled → discussion', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [makeDecision({ status: DECISION_STATUS.CANCELLED })] })

    const result = await transitionDecision('dec-1', DECISION_STATUS.DISCUSSION, ACTOR)

    expect(result).toEqual({ error: 'invalid_transition' })
  })
})

// ============================================================================
// CANCELLED transition
// ============================================================================

describe('transitionDecision — CANCELLED', () => {
  it('returns the updated decision', async () => {
    const decision = makeDecision({ status: DECISION_STATUS.VOTING })
    const updated = { ...decision, status: DECISION_STATUS.CANCELLED, cancel_reason: 'Nicht mehr relevant' }

    mockDbExecute
      .mockResolvedValueOnce({ rows: [decision] })   // SELECT existing
      .mockResolvedValueOnce({ rows: [updated] })    // UPDATE RETURNING

    const result = await transitionDecision('dec-1', DECISION_STATUS.CANCELLED, ACTOR, {
      cancelReason: 'Nicht mehr relevant',
    })

    expect(result).toMatchObject({ decision: expect.objectContaining({ status: DECISION_STATUS.CANCELLED }) })
  })

  it('does NOT enforce quorum when cancelling', async () => {
    const decision = makeDecision({ status: DECISION_STATUS.VOTING })
    mockDbExecute
      .mockResolvedValueOnce({ rows: [decision] })
      .mockResolvedValueOnce({ rows: [decision] })

    await transitionDecision('dec-1', DECISION_STATUS.CANCELLED, ACTOR)

    // resolveEligibleUserIds is a quorum concern — must not be called on cancel
    expect(mockResolveEligibleUserIds).not.toHaveBeenCalled()
  })
})

// ============================================================================
// CLOSED transition — quorum enforcement
// ============================================================================

describe('transitionDecision — CLOSED / quorum not met', () => {
  it('returns { error: "quorum_not_met" } when votes fall short (percentage quorum)', async () => {
    const decision = makeDecision({
      status: DECISION_STATUS.VOTING,
      quorum: { type: 'percentage', value: 50 },
    })
    // 5 eligible, need ceil(50% × 5) = 3 votes; only 1 actual
    mockResolveEligibleUserIds.mockResolvedValue(['u1', 'u2', 'u3', 'u4', 'u5'])
    mockDbExecute
      .mockResolvedValueOnce({ rows: [decision] })        // SELECT existing
      .mockResolvedValueOnce({ rows: [{ cnt: '1' }] })   // COUNT votes

    const result = await transitionDecision('dec-1', DECISION_STATUS.CLOSED, ACTOR)

    expect(result).toMatchObject({ error: 'quorum_not_met' })
  })

  it('includes Swiss-German quorum message with vote counts and percentage', async () => {
    const decision = makeDecision({
      status: DECISION_STATUS.VOTING,
      quorum: { type: 'percentage', value: 50 },
    })
    // 10 eligible, need ceil(50% × 10) = 5; have 2 → 20%
    mockResolveEligibleUserIds.mockResolvedValue(['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10'])
    mockDbExecute
      .mockResolvedValueOnce({ rows: [decision] })
      .mockResolvedValueOnce({ rows: [{ cnt: '2' }] })

    const result = await transitionDecision('dec-1', DECISION_STATUS.CLOSED, ACTOR) as { error: string; message: string }

    expect(result.message).toBe('Quorum nicht erreicht. 2 von 5 Stimmen benötigt (20%).')
  })

  it('uses Math.ceil for percentage quorum calculation', async () => {
    // 3 eligible, 50% → Math.ceil(1.5) = 2 required; have 1
    const decision = makeDecision({
      status: DECISION_STATUS.VOTING,
      quorum: { type: 'percentage', value: 50 },
    })
    mockResolveEligibleUserIds.mockResolvedValue(['u1', 'u2', 'u3'])
    mockDbExecute
      .mockResolvedValueOnce({ rows: [decision] })
      .mockResolvedValueOnce({ rows: [{ cnt: '1' }] })

    const result = await transitionDecision('dec-1', DECISION_STATUS.CLOSED, ACTOR) as { error: string; message: string }

    expect(result.error).toBe('quorum_not_met')
    // required = ceil(50% * 3) = 2; actual = 1 → message shows "1 von 2"
    expect(result.message).toContain('1 von 2')
  })

  it('enforces absolute quorum (type="absolute")', async () => {
    const decision = makeDecision({
      status: DECISION_STATUS.VOTING,
      quorum: { type: 'absolute', value: 3 },
    })
    mockResolveEligibleUserIds.mockResolvedValue(['u1', 'u2', 'u3', 'u4', 'u5'])
    mockDbExecute
      .mockResolvedValueOnce({ rows: [decision] })
      .mockResolvedValueOnce({ rows: [{ cnt: '2' }] })  // 2 < 3

    const result = await transitionDecision('dec-1', DECISION_STATUS.CLOSED, ACTOR)

    expect(result).toMatchObject({ error: 'quorum_not_met' })
  })
})

describe('transitionDecision — CLOSED / quorum met', () => {
  it('runs a transaction and returns the updated decision', async () => {
    const decision = makeDecision({ status: DECISION_STATUS.VOTING })
    const closedDecision = { ...decision, status: DECISION_STATUS.CLOSED }

    // 5 eligible, need ceil(50% × 5) = 3; have 4 → quorum met
    mockResolveEligibleUserIds.mockResolvedValue(['u1', 'u2', 'u3', 'u4', 'u5'])
    mockDbExecute
      .mockResolvedValueOnce({ rows: [decision] })          // SELECT existing
      .mockResolvedValueOnce({ rows: [{ cnt: '4' }] })     // COUNT votes

    // Transaction: votes SELECT + UPDATE RETURNING
    mockTxExecute
      .mockResolvedValueOnce({ rows: [{ vote_data: { response: 'agree' } }] })  // votes
      .mockResolvedValueOnce({ rows: [closedDecision] })                        // UPDATE

    const result = await transitionDecision('dec-1', DECISION_STATUS.CLOSED, ACTOR)

    expect(result).toMatchObject({ decision: expect.objectContaining({ status: DECISION_STATUS.CLOSED }) })
    expect(mockDbTransaction).toHaveBeenCalledTimes(1)
  })

  it('calls computeTallies with the votes and options', async () => {
    const decision = makeDecision({ status: DECISION_STATUS.VOTING })
    const closedDecision = { ...decision, status: DECISION_STATUS.CLOSED }

    mockResolveEligibleUserIds.mockResolvedValue(['u1', 'u2', 'u3', 'u4', 'u5'])
    mockDbExecute
      .mockResolvedValueOnce({ rows: [decision] })
      .mockResolvedValueOnce({ rows: [{ cnt: '5' }] })

    mockTxExecute
      .mockResolvedValueOnce({ rows: [{ vote_data: { response: 'agree' } }] })
      .mockResolvedValueOnce({ rows: [closedDecision] })

    await transitionDecision('dec-1', DECISION_STATUS.CLOSED, ACTOR)

    expect(mockComputeTallies).toHaveBeenCalledWith(
      'consent',
      expect.any(Array),  // vote_data array
      expect.any(Array),  // options array
    )
  })
})

// ============================================================================
// Default transition (e.g., draft → discussion)
// ============================================================================

describe('transitionDecision — default (draft → discussion)', () => {
  it('returns the updated decision', async () => {
    const decision = makeDecision({ status: DECISION_STATUS.DRAFT })
    const updated = { ...decision, status: DECISION_STATUS.DISCUSSION }

    mockDbExecute
      .mockResolvedValueOnce({ rows: [decision] })   // SELECT
      .mockResolvedValueOnce({ rows: [updated] })    // UPDATE

    const result = await transitionDecision('dec-1', DECISION_STATUS.DISCUSSION, ACTOR)

    expect(result).toMatchObject({ decision: expect.objectContaining({ status: DECISION_STATUS.DISCUSSION }) })
  })
})

// ============================================================================
// VOTING transition — notification side-effect
// ============================================================================

describe('transitionDecision — VOTING', () => {
  it('resolves eligible voter IDs when opening voting', async () => {
    const decision = makeDecision({ status: DECISION_STATUS.DISCUSSION })
    const updated = { ...decision, status: DECISION_STATUS.VOTING }

    mockDbExecute
      .mockResolvedValueOnce({ rows: [decision] })
      .mockResolvedValueOnce({ rows: [updated] })

    await transitionDecision('dec-1', DECISION_STATUS.VOTING, ACTOR)

    expect(mockResolveEligibleUserIds).toHaveBeenCalledWith(
      decision.participant_scope,
      decision.invited_participants,
    )
  })
})
