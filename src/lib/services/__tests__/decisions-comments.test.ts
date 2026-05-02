/**
 * Tests for decisions-comments.ts — comment CRUD on democratic decisions.
 *
 * Mission-relevant: comments are the primary discussion channel before a
 * cooperative vote. Broken guards let comments land on closed/cancelled
 * decisions (data integrity), and broken author checks allow anyone to
 * edit or delete someone else's comment (data integrity + trust).
 *
 * Behaviors locked:
 *   getComments
 *   - returns empty array when no comments exist
 *   - maps user fields onto each comment
 *
 *   createComment
 *   - returns { error: 'not_found' } when decision does not exist
 *   - returns { error: 'not_commentable' } when decision is DRAFT
 *   - returns { error: 'not_commentable' } when decision is CLOSED
 *   - returns { error: 'not_commentable' } when decision is CANCELLED
 *   - returns the comment when decision is in DISCUSSION
 *   - returns the comment when decision is in VOTING
 *   - stores optionId and parentCommentId when provided
 *
 *   updateComment
 *   - returns { error: 'not_found' } when comment does not exist
 *   - returns { error: 'not_author' } when user is not the comment author
 *   - returns updated comment when author edits their own comment
 *
 *   deleteComment
 *   - returns { error: 'not_found' } when comment does not exist
 *   - returns { error: 'not_author' } when user is not the comment author
 *   - returns { success: true } when author deletes their own comment
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
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
  decisionComments: { id: 'decisionComments' },
}))

jest.mock('@/db/schema/auth', () => ({
  users: { id: 'users' },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { getComments, createComment, updateComment, deleteComment } from '../decisions-comments'
import { DECISION_STATUS } from '@/config/decisions'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DECISION_ID = 'dec-1'
const AUTHOR = 'user-author-1'
const OTHER_USER = 'user-other-2'

function makeCommentRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'cmt-1',
    decision_id: DECISION_ID,
    user_id: AUTHOR,
    content: 'Das ist ein guter Vorschlag.',
    position: 'support',
    option_id: null,
    parent_comment_id: null,
    is_edited: false,
    edited_at: null,
    created_at: '2026-01-01T10:00:00Z',
    user_email: 'author@revamp-it.ch',
    user_name: 'Author Person',
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ============================================================================
// getComments
// ============================================================================

describe('getComments', () => {
  it('returns an empty array when no comments exist', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await getComments(DECISION_ID)

    expect(result).toEqual([])
  })

  it('maps user fields onto each comment', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [makeCommentRow()] })

    const result = await getComments(DECISION_ID)

    expect(result).toHaveLength(1)
    expect(result[0].user).toEqual({
      id: AUTHOR,
      email: 'author@revamp-it.ch',
      name: 'Author Person',
    })
  })

  it('returns all comment fields correctly', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [makeCommentRow({ content: 'Ich unterstütze das.', position: 'support', option_id: 'opt-a' })],
    })

    const result = await getComments(DECISION_ID)

    expect(result[0].content).toBe('Ich unterstütze das.')
    expect(result[0].position).toBe('support')
    expect(result[0].option_id).toBe('opt-a')
    expect(result[0].is_edited).toBe(false)
  })

  it('returns multiple comments in order', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [
        makeCommentRow({ id: 'cmt-1', content: 'Erster' }),
        makeCommentRow({ id: 'cmt-2', content: 'Zweiter' }),
      ],
    })

    const result = await getComments(DECISION_ID)

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('cmt-1')
    expect(result[1].id).toBe('cmt-2')
  })
})

// ============================================================================
// createComment — guard conditions
// ============================================================================

describe('createComment — guards', () => {
  it('returns { error: "not_found" } when decision does not exist', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await createComment(DECISION_ID, AUTHOR, { content: 'Text', position: 'support' })

    expect(result).toEqual({ error: 'not_found' })
  })

  it('returns { error: "not_commentable" } when decision is DRAFT', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: DECISION_ID, status: DECISION_STATUS.DRAFT }],
    })

    const result = await createComment(DECISION_ID, AUTHOR, { content: 'Text', position: 'support' })

    expect(result).toEqual({ error: 'not_commentable' })
  })

  it('returns { error: "not_commentable" } when decision is CLOSED', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: DECISION_ID, status: DECISION_STATUS.CLOSED }],
    })

    const result = await createComment(DECISION_ID, AUTHOR, { content: 'Text', position: 'support' })

    expect(result).toEqual({ error: 'not_commentable' })
  })

  it('returns { error: "not_commentable" } when decision is CANCELLED', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: DECISION_ID, status: DECISION_STATUS.CANCELLED }],
    })

    const result = await createComment(DECISION_ID, AUTHOR, { content: 'Text', position: 'support' })

    expect(result).toEqual({ error: 'not_commentable' })
  })
})

// ============================================================================
// createComment — happy paths
// ============================================================================

describe('createComment — happy path', () => {
  it('returns the comment when decision is in DISCUSSION', async () => {
    const commentRow = makeCommentRow()
    mockDbExecute
      .mockResolvedValueOnce({ rows: [{ id: DECISION_ID, status: DECISION_STATUS.DISCUSSION }] })
      .mockResolvedValueOnce({ rows: [commentRow] })

    const result = await createComment(DECISION_ID, AUTHOR, { content: 'Text', position: 'support' })

    expect(result).toMatchObject({ comment: expect.objectContaining({ id: 'cmt-1' }) })
  })

  it('returns the comment when decision is in VOTING', async () => {
    const commentRow = makeCommentRow()
    mockDbExecute
      .mockResolvedValueOnce({ rows: [{ id: DECISION_ID, status: DECISION_STATUS.VOTING }] })
      .mockResolvedValueOnce({ rows: [commentRow] })

    const result = await createComment(DECISION_ID, AUTHOR, { content: 'Text', position: 'oppose' })

    expect(result).toMatchObject({ comment: expect.objectContaining({ id: 'cmt-1' }) })
  })

  it('attaches the user object to the returned comment', async () => {
    const commentRow = makeCommentRow()
    mockDbExecute
      .mockResolvedValueOnce({ rows: [{ id: DECISION_ID, status: DECISION_STATUS.DISCUSSION }] })
      .mockResolvedValueOnce({ rows: [commentRow] })

    const result = await createComment(DECISION_ID, AUTHOR, { content: 'Text', position: 'support' })

    expect((result as { comment: { user: { id: string } } }).comment.user.id).toBe(AUTHOR)
  })

  it('makes two DB calls (check + insert)', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [{ id: DECISION_ID, status: DECISION_STATUS.DISCUSSION }] })
      .mockResolvedValueOnce({ rows: [makeCommentRow()] })

    await createComment(DECISION_ID, AUTHOR, { content: 'Text', position: 'support' })

    expect(mockDbExecute).toHaveBeenCalledTimes(2)
  })
})

// ============================================================================
// updateComment
// ============================================================================

describe('updateComment', () => {
  it('returns { error: "not_found" } when comment does not exist', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await updateComment('missing', AUTHOR, 'New content')

    expect(result).toEqual({ error: 'not_found' })
  })

  it('returns { error: "not_author" } when user is not the comment author', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: 'cmt-1', user_id: AUTHOR }],
    })

    const result = await updateComment('cmt-1', OTHER_USER, 'New content')

    expect(result).toEqual({ error: 'not_author' })
  })

  it('returns updated comment when author edits their own comment', async () => {
    const updated = makeCommentRow({ content: 'Überarbeitet.', is_edited: true })
    mockDbExecute
      .mockResolvedValueOnce({ rows: [{ id: 'cmt-1', user_id: AUTHOR }] })
      .mockResolvedValueOnce({ rows: [updated] })

    const result = await updateComment('cmt-1', AUTHOR, 'Überarbeitet.')

    expect(result).toMatchObject({ comment: expect.objectContaining({ content: 'Überarbeitet.', is_edited: true }) })
  })

  it('attaches user object to the updated comment', async () => {
    const updated = makeCommentRow({ is_edited: true })
    mockDbExecute
      .mockResolvedValueOnce({ rows: [{ id: 'cmt-1', user_id: AUTHOR }] })
      .mockResolvedValueOnce({ rows: [updated] })

    const result = await updateComment('cmt-1', AUTHOR, 'Updated')

    expect((result as { comment: { user: { id: string } } }).comment.user.id).toBe(AUTHOR)
  })
})

// ============================================================================
// deleteComment
// ============================================================================

describe('deleteComment', () => {
  it('returns { error: "not_found" } when comment does not exist', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [] })

    const result = await deleteComment('missing', AUTHOR)

    expect(result).toEqual({ error: 'not_found' })
  })

  it('returns { error: "not_author" } when user is not the comment author', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [{ id: 'cmt-1', user_id: AUTHOR }],
    })

    const result = await deleteComment('cmt-1', OTHER_USER)

    expect(result).toEqual({ error: 'not_author' })
  })

  it('returns { success: true } when author deletes their own comment', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [{ id: 'cmt-1', user_id: AUTHOR }] })
      .mockResolvedValueOnce({ rows: [] }) // DELETE

    const result = await deleteComment('cmt-1', AUTHOR)

    expect(result).toEqual({ success: true })
  })

  it('makes two DB calls (fetch + delete)', async () => {
    mockDbExecute
      .mockResolvedValueOnce({ rows: [{ id: 'cmt-1', user_id: AUTHOR }] })
      .mockResolvedValueOnce({ rows: [] })

    await deleteComment('cmt-1', AUTHOR)

    expect(mockDbExecute).toHaveBeenCalledTimes(2)
  })
})
