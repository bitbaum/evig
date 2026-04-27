/**
 * Tests for protocols-voting.ts — decision voting, auto-close, and task proposals.
 *
 * Mission-relevant: voting on decision action items is how cooperative members
 * collectively resolve open questions from meetings. A bug in toggle logic
 * (added/changed/removed), auto-close, or task creation means decisions are
 * either silently ignored or never converted to actionable work.
 *
 * Behaviors locked:
 *   castDecisionVote
 *   - throws DECISION_ALREADY_CLOSED when outcome.is_closed is true
 *   - returns action='added' for a brand-new vote
 *   - returns action='removed' when the same vote is cast again (toggle off)
 *   - returns action='changed' when a different vote type is cast
 *   - returns votesUp/votesDown from the recount
 *   - auto-closes and returns isClosed=true when all attendees have voted
 *   - does not auto-close when not all attendees have voted
 *
 *   closeDecision
 *   - throws DECISION_ALREADY_CLOSED when already closed
 *   - returns { isClosed: true, result, votesUp, votesDown } on success
 *
 *   getDecisionData
 *   - returns { votes: [], outcomes: [] } on empty tables
 *   - returns rows from both tables
 *
 *   generateTaskProposals
 *   - throws DECISION_NOT_FOUND when no outcome row or outcome is not closed
 *   - throws DECISION_NOT_APPROVED when result !== APPROVED
 *   - throws PROTOCOL_NOT_FOUND when protocol row is missing
 *   - throws AI_PROPOSAL_FAILED when processDecisionProposal returns null
 *   - returns { proposals, model } on success and stores in DB
 *
 *   createProposedTasks
 *   - throws DECISION_NOT_FOUND when outcome is missing
 *   - throws DECISION_NOT_APPROVED when result !== APPROVED
 *   - throws TASKS_ALREADY_CREATED when tasks_created is true
 *   - throws AI_PROPOSAL_FAILED when no proposed_tasks
 *   - creates one task per proposal via linkActionItemToTask
 *   - marks tasks_created and returns { taskCount, taskIds }
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute(...args),
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
  protocolDecisionVotes: { id: 'protocolDecisionVotes' },
  protocolDecisionOutcomes: { id: 'protocolDecisionOutcomes' },
}))

jest.mock('@/db/schema/auth', () => ({
  users: { id: 'users' },
}))

jest.mock('@/config/protocols', () => ({
  MEETING_TYPE_LABELS: { weekly: 'Wöchentlich', monthly: 'Monatlich' },
  DECISION_RESULTS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },
}))

jest.mock('@/lib/ai/config/prompts', () => ({
  PROTOCOL_PROMPTS: {
    proposeTasksFromDecision: 'template-{{decision}}',
    proposalSchema: '{}',
  },
  fillPromptTemplate: jest.fn().mockReturnValue('filled-prompt'),
}))

const mockProcessDecisionProposal = jest.fn()
jest.mock('@/lib/ai/protocol-processing', () => ({
  processDecisionProposal: (...args: unknown[]) => mockProcessDecisionProposal(...args),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

const mockLinkActionItemToTask = jest.fn()
jest.mock('../protocols-linking', () => ({
  linkActionItemToTask: (...args: unknown[]) => mockLinkActionItemToTask(...args),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  castDecisionVote,
  closeDecision,
  getDecisionData,
  generateTaskProposals,
  createProposedTasks,
} from '../protocols-voting'
import { DECISION_RESULTS } from '@/config/protocols'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PROTOCOL_ID = 'proto-1'
const ACTION_ITEM_ID = 'ai-1'
const VOTER_ID = 'voter-1'
const CREATOR_ID = 'creator-1'

function makeOutcomeRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    protocol_id: PROTOCOL_ID,
    action_item_id: ACTION_ITEM_ID,
    is_closed: false,
    result: DECISION_RESULTS.PENDING,
    votes_up: 0,
    votes_down: 0,
    tasks_created: false,
    proposed_tasks: null,
    ...overrides,
  }
}

function makeProtocolRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: PROTOCOL_ID,
    title: 'Teammeeting',
    meeting_type: 'weekly',
    attendees: ['u1', 'u2'],
    structured_notes: {
      topics: [{ id: 'topic-1', title: 'Budget', discussion: 'Diskussion über Budget' }],
      action_items: [
        {
          id: ACTION_ITEM_ID,
          description: 'Laptop kaufen',
          type: 'decision',
          topic_id: 'topic-1',
        },
      ],
    },
    ...overrides,
  }
}

/**
 * Queues execute calls for castDecisionVote "new vote, not auto-closing" path.
 * Call order:
 *   1. is_closed check → not closed
 *   2. existing vote check → none
 *   3. INSERT vote
 *   4. recount SELECT vote counts
 *   5. recount UPSERT outcome
 *   6. checkAutoClose: SELECT attendees
 *   7. checkAutoClose: COUNT voters (< attendees → no auto-close)
 *   8. checkAutoClose: SELECT current is_closed + result
 */
function mockNewVoteNoAutoClose(
  voteCountRows: unknown[] = [],
  attendees: string[] = ['u1', 'u2'],
  voterCnt = '1',
) {
  mockDbExecute
    .mockResolvedValueOnce({ rows: [] })                                   // 1. not closed
    .mockResolvedValueOnce({ rows: [] })                                   // 2. no existing vote
    .mockResolvedValueOnce({ rows: [] })                                   // 3. INSERT
    .mockResolvedValueOnce({ rows: voteCountRows })                        // 4. recount SELECT
    .mockResolvedValueOnce({ rows: [] })                                   // 5. recount UPSERT
    .mockResolvedValueOnce({ rows: [{ attendees }] })                      // 6. get attendees
    .mockResolvedValueOnce({ rows: [{ cnt: voterCnt }] })                  // 7. voter count
    .mockResolvedValueOnce({ rows: [{ is_closed: false, result: 'pending' }] }) // 8. current state
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================================
// castDecisionVote
// ============================================================================

describe('castDecisionVote', () => {
  it('throws DECISION_ALREADY_CLOSED when outcome is already closed', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [{ is_closed: true }] })

    await expect(
      castDecisionVote(PROTOCOL_ID, ACTION_ITEM_ID, VOTER_ID, 'up'),
    ).rejects.toThrow('DECISION_ALREADY_CLOSED')
  })

  it('returns action="added" when casting a new vote', async () => {
    mockNewVoteNoAutoClose()

    const result = await castDecisionVote(PROTOCOL_ID, ACTION_ITEM_ID, VOTER_ID, 'up')

    expect(result.action).toBe('added')
  })

  it('returns action="removed" when casting the same vote again (toggle off)', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [] })                                        // 1. not closed
      .mockResolvedValueOnce({ rows: [{ vote_type: 'up' }] })                     // 2. existing = 'up'
      .mockResolvedValueOnce({ rows: [] })                                        // 3. DELETE
      .mockResolvedValueOnce({ rows: [] })                                        // 4. recount SELECT
      .mockResolvedValueOnce({ rows: [] })                                        // 5. recount UPSERT
      .mockResolvedValueOnce({ rows: [{ attendees: ['u1', 'u2'] }] })             // 6. attendees
      .mockResolvedValueOnce({ rows: [{ cnt: '1' }] })                            // 7. voter count
      .mockResolvedValueOnce({ rows: [{ is_closed: false, result: 'pending' }] }) // 8. current state

    const result = await castDecisionVote(PROTOCOL_ID, ACTION_ITEM_ID, VOTER_ID, 'up')

    expect(result.action).toBe('removed')
  })

  it('returns action="changed" when casting a different vote type', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [] })                                        // 1. not closed
      .mockResolvedValueOnce({ rows: [{ vote_type: 'down' }] })                   // 2. existing = 'down'
      .mockResolvedValueOnce({ rows: [] })                                        // 3. UPDATE
      .mockResolvedValueOnce({ rows: [] })                                        // 4. recount SELECT
      .mockResolvedValueOnce({ rows: [] })                                        // 5. recount UPSERT
      .mockResolvedValueOnce({ rows: [{ attendees: ['u1', 'u2'] }] })             // 6. attendees
      .mockResolvedValueOnce({ rows: [{ cnt: '1' }] })                            // 7. voter count
      .mockResolvedValueOnce({ rows: [{ is_closed: false, result: 'pending' }] }) // 8. current state

    const result = await castDecisionVote(PROTOCOL_ID, ACTION_ITEM_ID, VOTER_ID, 'up')

    expect(result.action).toBe('changed')
  })

  it('returns votesUp and votesDown from the recount', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ vote_type: 'up', cnt: '3' }, { vote_type: 'down', cnt: '1' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ attendees: ['u1', 'u2', 'u3', 'u4', 'u5'] }] })
      .mockResolvedValueOnce({ rows: [{ cnt: '4' }] })
      .mockResolvedValueOnce({ rows: [{ is_closed: false, result: 'pending' }] })

    const result = await castDecisionVote(PROTOCOL_ID, ACTION_ITEM_ID, VOTER_ID, 'up')

    expect(result.votesUp).toBe(3)
    expect(result.votesDown).toBe(1)
  })

  it('auto-closes and returns isClosed=true when all attendees have voted', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [] })                               // 1. not closed
      .mockResolvedValueOnce({ rows: [] })                               // 2. no existing vote
      .mockResolvedValueOnce({ rows: [] })                               // 3. INSERT
      .mockResolvedValueOnce({ rows: [{ vote_type: 'up', cnt: '1' }] }) // 4. recount SELECT
      .mockResolvedValueOnce({ rows: [] })                               // 5. recount UPSERT
      .mockResolvedValueOnce({ rows: [{ attendees: ['u1'] }] })          // 6. 1 attendee
      .mockResolvedValueOnce({ rows: [{ cnt: '1' }] })                   // 7. 1 voter = all voted
      // closeDecisionInternal:
      .mockResolvedValueOnce({ rows: [{ votes_up: 1, votes_down: 0 }] }) // 8. get counts
      .mockResolvedValueOnce({ rows: [] })                               // 9. UPDATE close

    const result = await castDecisionVote(PROTOCOL_ID, ACTION_ITEM_ID, VOTER_ID, 'up')

    expect(result.isClosed).toBe(true)
    expect(result.result).toBe(DECISION_RESULTS.APPROVED)
  })

  it('does not auto-close when fewer attendees have voted', async () => {
    mockNewVoteNoAutoClose([], ['u1', 'u2', 'u3'], '1')

    const result = await castDecisionVote(PROTOCOL_ID, ACTION_ITEM_ID, VOTER_ID, 'up')

    expect(result.isClosed).toBe(false)
  })
})

// ============================================================================
// closeDecision
// ============================================================================

describe('closeDecision', () => {
  it('throws DECISION_ALREADY_CLOSED when already closed', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [{ is_closed: true }] })

    await expect(
      closeDecision(PROTOCOL_ID, ACTION_ITEM_ID, CREATOR_ID),
    ).rejects.toThrow('DECISION_ALREADY_CLOSED')
  })

  it('returns { isClosed: true, result, votesUp, votesDown } on success', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [] })                                // not closed
      // recountVotes:
      .mockResolvedValueOnce({ rows: [{ vote_type: 'up', cnt: '2' }, { vote_type: 'down', cnt: '1' }] })
      .mockResolvedValueOnce({ rows: [] })                                // UPSERT
      // closeDecisionInternal:
      .mockResolvedValueOnce({ rows: [{ votes_up: 2, votes_down: 1 }] }) // get counts
      .mockResolvedValueOnce({ rows: [] })                                // UPDATE close
      // final count:
      .mockResolvedValueOnce({ rows: [{ votes_up: 2, votes_down: 1 }] })

    const result = await closeDecision(PROTOCOL_ID, ACTION_ITEM_ID, CREATOR_ID)

    expect(result.isClosed).toBe(true)
    expect(result.result).toBe(DECISION_RESULTS.APPROVED)
    expect(result.votesUp).toBe(2)
    expect(result.votesDown).toBe(1)
  })

  it('result is REJECTED when votes_down >= votes_up', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ vote_type: 'down', cnt: '3' }, { vote_type: 'up', cnt: '1' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ votes_up: 1, votes_down: 3 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ votes_up: 1, votes_down: 3 }] })

    const result = await closeDecision(PROTOCOL_ID, ACTION_ITEM_ID, CREATOR_ID)

    expect(result.result).toBe(DECISION_RESULTS.REJECTED)
  })
})

// ============================================================================
// getDecisionData
// ============================================================================

describe('getDecisionData', () => {
  it('returns empty arrays when no data exists', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const result = await getDecisionData(PROTOCOL_ID)

    expect(result.votes).toEqual([])
    expect(result.outcomes).toEqual([])
  })

  it('returns votes and outcomes from both tables', async () => {
    const vote = { protocol_id: PROTOCOL_ID, voter_id: VOTER_ID, vote_type: 'up' }
    const outcome = makeOutcomeRow({ votes_up: 1 })

    mockDbExecute
      .mockResolvedValueOnce({ rows: [vote] })
      .mockResolvedValueOnce({ rows: [outcome] })

    const result = await getDecisionData(PROTOCOL_ID)

    expect(result.votes).toHaveLength(1)
    expect(result.votes[0]).toMatchObject({ vote_type: 'up' })
    expect(result.outcomes).toHaveLength(1)
  })
})

// ============================================================================
// generateTaskProposals
// ============================================================================

describe('generateTaskProposals', () => {
  it('throws DECISION_NOT_FOUND when outcome row does not exist', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    await expect(
      generateTaskProposals(PROTOCOL_ID, ACTION_ITEM_ID),
    ).rejects.toThrow('DECISION_NOT_FOUND')
  })

  it('throws DECISION_NOT_FOUND when outcome exists but is not closed', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [makeOutcomeRow({ is_closed: false, result: DECISION_RESULTS.APPROVED })],
    })

    await expect(
      generateTaskProposals(PROTOCOL_ID, ACTION_ITEM_ID),
    ).rejects.toThrow('DECISION_NOT_FOUND')
  })

  it('throws DECISION_NOT_APPROVED when result is not APPROVED', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [makeOutcomeRow({ is_closed: true, result: DECISION_RESULTS.REJECTED })],
    })

    await expect(
      generateTaskProposals(PROTOCOL_ID, ACTION_ITEM_ID),
    ).rejects.toThrow('DECISION_NOT_APPROVED')
  })

  it('throws PROTOCOL_NOT_FOUND when protocol row is missing', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeOutcomeRow({ is_closed: true, result: DECISION_RESULTS.APPROVED })] })
      .mockResolvedValueOnce({ rows: [] }) // protocol not found

    await expect(
      generateTaskProposals(PROTOCOL_ID, ACTION_ITEM_ID),
    ).rejects.toThrow('PROTOCOL_NOT_FOUND')
  })

  it('throws AI_PROPOSAL_FAILED when processDecisionProposal returns null', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeOutcomeRow({ is_closed: true, result: DECISION_RESULTS.APPROVED })] })
      .mockResolvedValueOnce({ rows: [makeProtocolRow()] })
      .mockResolvedValueOnce({ rows: [{ name: 'Alice' }] }) // resolveAttendeeIds

    mockProcessDecisionProposal.mockResolvedValueOnce(null)

    await expect(
      generateTaskProposals(PROTOCOL_ID, ACTION_ITEM_ID),
    ).rejects.toThrow('AI_PROPOSAL_FAILED')
  })

  it('returns { proposals, model } and stores proposals in DB on success', async () => {
    const proposals = [{ title: 'Task 1', priority: 'high' }]
    const model = 'claude-3-5-haiku'

    mockDbExecute
      .mockResolvedValueOnce({ rows: [makeOutcomeRow({ is_closed: true, result: DECISION_RESULTS.APPROVED })] })
      .mockResolvedValueOnce({ rows: [makeProtocolRow()] })
      .mockResolvedValueOnce({ rows: [{ name: 'Alice' }, { name: 'Bob' }] }) // resolveAttendeeIds
      .mockResolvedValueOnce({ rows: [] })                                    // UPDATE outcome

    mockProcessDecisionProposal.mockResolvedValueOnce({ proposals, model })

    const result = await generateTaskProposals(PROTOCOL_ID, ACTION_ITEM_ID)

    expect(result.proposals).toEqual(proposals)
    expect(result.model).toBe(model)
    // UPDATE was called (4th execute call)
    expect(mockDbExecute).toHaveBeenCalledTimes(4)
  })
})

// ============================================================================
// createProposedTasks
// ============================================================================

describe('createProposedTasks', () => {
  it('throws DECISION_NOT_FOUND when outcome is missing', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    await expect(
      createProposedTasks(PROTOCOL_ID, ACTION_ITEM_ID, CREATOR_ID),
    ).rejects.toThrow('DECISION_NOT_FOUND')
  })

  it('throws DECISION_NOT_APPROVED when result is not APPROVED', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [makeOutcomeRow({ result: DECISION_RESULTS.REJECTED })],
    })

    await expect(
      createProposedTasks(PROTOCOL_ID, ACTION_ITEM_ID, CREATOR_ID),
    ).rejects.toThrow('DECISION_NOT_APPROVED')
  })

  it('throws TASKS_ALREADY_CREATED when tasks_created is true', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [makeOutcomeRow({ result: DECISION_RESULTS.APPROVED, tasks_created: true })],
    })

    await expect(
      createProposedTasks(PROTOCOL_ID, ACTION_ITEM_ID, CREATOR_ID),
    ).rejects.toThrow('TASKS_ALREADY_CREATED')
  })

  it('throws AI_PROPOSAL_FAILED when proposed_tasks is empty', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [makeOutcomeRow({ result: DECISION_RESULTS.APPROVED, proposed_tasks: [] })],
    })

    await expect(
      createProposedTasks(PROTOCOL_ID, ACTION_ITEM_ID, CREATOR_ID),
    ).rejects.toThrow('AI_PROPOSAL_FAILED')
  })

  it('creates one task per proposal and returns { taskCount, taskIds }', async () => {
    const proposals = [
      { title: 'Task A', description: 'Desc A', priority: 'high' },
      { title: 'Task B', priority: 'normal' },
    ]

    mockDbExecute
      .mockResolvedValueOnce({
        rows: [makeOutcomeRow({ result: DECISION_RESULTS.APPROVED, proposed_tasks: proposals })],
      })
      .mockResolvedValueOnce({ rows: [] }) // UPDATE tasks_created

    mockLinkActionItemToTask
      .mockResolvedValueOnce({ taskId: 'task-a', linkId: 'link-1' })
      .mockResolvedValueOnce({ taskId: 'task-b', linkId: 'link-2' })

    const result = await createProposedTasks(PROTOCOL_ID, ACTION_ITEM_ID, CREATOR_ID)

    expect(result.taskCount).toBe(2)
    expect(result.taskIds).toEqual(['task-a', 'task-b'])
    expect(mockLinkActionItemToTask).toHaveBeenCalledTimes(2)
  })

  it('passes correct fields to linkActionItemToTask', async () => {
    const proposals = [{ title: 'Laptop kaufen', description: 'Für den neuen Mitarbeiter', priority: 'high' }]

    mockDbExecute
      .mockResolvedValueOnce({
        rows: [makeOutcomeRow({ result: DECISION_RESULTS.APPROVED, proposed_tasks: proposals })],
      })
      .mockResolvedValueOnce({ rows: [] })

    mockLinkActionItemToTask.mockResolvedValueOnce({ taskId: 'task-1', linkId: 'link-1' })

    await createProposedTasks(PROTOCOL_ID, ACTION_ITEM_ID, CREATOR_ID)

    expect(mockLinkActionItemToTask).toHaveBeenCalledWith(
      PROTOCOL_ID,
      ACTION_ITEM_ID,
      expect.objectContaining({
        title: 'Laptop kaufen',
        description: 'Für den neuen Mitarbeiter',
        priority: 'high',
        task_type: 'one_time',
        category: 'admin',
      }),
      CREATOR_ID,
    )
  })

  it('marks tasks_created=true in DB after creating tasks', async () => {
    const proposals = [{ title: 'T', priority: 'normal' }]

    mockDbExecute
      .mockResolvedValueOnce({
        rows: [makeOutcomeRow({ result: DECISION_RESULTS.APPROVED, proposed_tasks: proposals })],
      })
      .mockResolvedValueOnce({ rows: [] }) // UPDATE

    mockLinkActionItemToTask.mockResolvedValueOnce({ taskId: 'task-1', linkId: 'link-1' })

    await createProposedTasks(PROTOCOL_ID, ACTION_ITEM_ID, CREATOR_ID)

    // 2 execute calls: initial SELECT + UPDATE tasks_created
    expect(mockDbExecute).toHaveBeenCalledTimes(2)
  })
})
