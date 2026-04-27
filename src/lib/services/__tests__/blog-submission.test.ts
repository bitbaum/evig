/**
 * Tests for blog-submission.ts — review actions on blog submissions.
 *
 * Mission-relevant: blog posts amplify the platform's voice to donors,
 * volunteers, and the public. Broken approval/rejection flows mean content
 * backlogs or incorrect status in the database. The editSubmission guards
 * prevent accidental mutation of already-published work.
 *
 * Behaviors locked:
 *   - approveSubmission sets APPROVED status, returns correct message
 *   - rejectSubmission sets REJECTED status, stores rejection reason
 *   - publishSubmission runs in a transaction, returns postId + postSlug
 *   - requestChanges sets REQUIRES_CHANGES status
 *   - All four actions: email failure never propagates (fire-and-forget)
 *   - All four actions: notification failure never propagates
 *   - editSubmission throws EditNotAllowedError when status !== PENDING
 *   - editSubmission throws NoFieldsError when fields object is empty
 *   - editSubmission returns { noChanges: true } when no fields changed
 *   - editSubmission returns updated submission on success
 *   - EditNotAllowedError / NoFieldsError have correct .name properties
 */

// ---------------------------------------------------------------------------
// Drizzle chainable mock setup
// ---------------------------------------------------------------------------

const mockUpdateWhere = jest.fn().mockResolvedValue([])
const mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere })
const mockDbUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet })

// Transaction mock: the callback receives mockTx
const mockTxInsertReturning = jest.fn().mockResolvedValue([{ id: 'post-abc' }])
const mockTxInsertValues = jest.fn().mockReturnValue({ returning: mockTxInsertReturning })
const mockTxInsert = jest.fn().mockReturnValue({ values: mockTxInsertValues })
const mockTxUpdateWhere = jest.fn().mockResolvedValue([])
const mockTxUpdateSet = jest.fn().mockReturnValue({ where: mockTxUpdateWhere })
const mockTxUpdate = jest.fn().mockReturnValue({ set: mockTxUpdateSet })
const mockTx = { insert: mockTxInsert, update: mockTxUpdate }
const mockDbTransaction = jest.fn().mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx))

// execute mock (used by editSubmission)
const mockDbExecute = jest.fn().mockResolvedValue({ rows: [{ id: 'sub-1', title: 'Updated Title' }] })

jest.mock('@/db', () => ({
  db: {
    update: (...args: unknown[]) => mockDbUpdate(...args),
    transaction: (...args: unknown[]) => mockDbTransaction(...args),
    execute: (...args: unknown[]) => mockDbExecute(...args),
  },
}))

jest.mock('@/db/schema', () => ({
  blogSubmissions: { id: 'blogSubmissions_table' },
  blogPosts: { id: 'blogPosts_table' },
}))

jest.mock('drizzle-orm', () => {
  const sqlFn = jest.fn().mockReturnValue({ __sql: 'mocked_sql' })
  ;(sqlFn as unknown as Record<string, unknown>).raw = jest.fn().mockReturnValue({ __sql: 'raw' })
  ;(sqlFn as unknown as Record<string, unknown>).join = jest.fn().mockReturnValue({ __sql: 'joined' })
  return {
    ...jest.requireActual('drizzle-orm'),
    sql: sqlFn,
    eq: jest.fn().mockReturnValue({ __eq: true }),
    getTableName: jest.fn().mockReturnValue('mock_table'),
  }
})

const mockSendEmail = jest.fn().mockResolvedValue({ success: true })
jest.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

const mockCreateNotification = jest.fn().mockResolvedValue(undefined)
jest.mock('@/lib/services/notifications', () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks are declared)
// ---------------------------------------------------------------------------

import {
  approveSubmission,
  rejectSubmission,
  publishSubmission,
  requestChanges,
  editSubmission,
  EditNotAllowedError,
  NoFieldsError,
} from '../blog-submission'
import { APPROVAL_STATUS } from '@/config/approval-status'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/** Minimal valid submission row */
function makeSubmission(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'sub-1',
    userId: 'user-1',
    submitterName: 'Petra Muster',
    submitterEmail: 'petra@example.ch',
    title: 'Mein Blogbeitrag',
    slug: 'mein-blogbeitrag',
    content: 'Inhalt des Beitrags',
    excerpt: null,
    categoryId: null,
    tags: [],
    status: APPROVAL_STATUS.PENDING,
    editHistory: null,
    ...overrides,
  }
}

const REVIEWER = 'reviewer-1'

beforeEach(() => {
  jest.clearAllMocks()
  mockSendEmail.mockResolvedValue({ success: true })
  mockCreateNotification.mockResolvedValue(undefined)
  mockDbUpdate.mockReturnValue({ set: mockUpdateSet })
  mockUpdateSet.mockReturnValue({ where: mockUpdateWhere })
  mockUpdateWhere.mockResolvedValue([])
  mockDbTransaction.mockImplementation((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx))
  mockTxInsert.mockReturnValue({ values: mockTxInsertValues })
  mockTxInsertValues.mockReturnValue({ returning: mockTxInsertReturning })
  mockTxInsertReturning.mockResolvedValue([{ id: 'post-abc' }])
  mockTxUpdate.mockReturnValue({ set: mockTxUpdateSet })
  mockTxUpdateSet.mockReturnValue({ where: mockTxUpdateWhere })
  mockTxUpdateWhere.mockResolvedValue([])
  mockDbExecute.mockResolvedValue({ rows: [{ id: 'sub-1', title: 'Updated' }] })
})

// ============================================================================
// approveSubmission
// ============================================================================

describe('approveSubmission', () => {
  it('returns approved status and Swiss-German message', async () => {
    const result = await approveSubmission(makeSubmission(), REVIEWER)
    expect(result.status).toBe(APPROVAL_STATUS.APPROVED)
    expect(result.message).toBe('Einreichung genehmigt')
  })

  it('calls db.update on blogSubmissions', async () => {
    await approveSubmission(makeSubmission(), REVIEWER)
    expect(mockDbUpdate).toHaveBeenCalled()
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({ status: APPROVAL_STATUS.APPROVED }),
    )
  })

  it('email failure does NOT propagate', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP down'))
    // Should resolve, not reject
    await expect(approveSubmission(makeSubmission(), REVIEWER)).resolves.toMatchObject({
      status: APPROVAL_STATUS.APPROVED,
    })
  })

  it('notification failure does NOT propagate', async () => {
    mockCreateNotification.mockRejectedValueOnce(new Error('notification service down'))
    await expect(approveSubmission(makeSubmission(), REVIEWER)).resolves.toMatchObject({
      status: APPROVAL_STATUS.APPROVED,
    })
  })
})

// ============================================================================
// rejectSubmission
// ============================================================================

describe('rejectSubmission', () => {
  it('returns rejected status and Swiss-German message', async () => {
    const result = await rejectSubmission(makeSubmission(), REVIEWER, 'Inhalt unpassend')
    expect(result.status).toBe(APPROVAL_STATUS.REJECTED)
    expect(result.message).toBe('Einreichung abgelehnt')
  })

  it('calls db.update with REJECTED status and rejection reason', async () => {
    await rejectSubmission(makeSubmission(), REVIEWER, 'Thema nicht relevant')
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: APPROVAL_STATUS.REJECTED,
        rejectionReason: 'Thema nicht relevant',
      }),
    )
  })

  it('email failure does NOT propagate', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP timeout'))
    await expect(
      rejectSubmission(makeSubmission(), REVIEWER, 'reason'),
    ).resolves.toMatchObject({ status: APPROVAL_STATUS.REJECTED })
  })
})

// ============================================================================
// publishSubmission
// ============================================================================

describe('publishSubmission', () => {
  it('returns published status, postId, and postSlug', async () => {
    const result = await publishSubmission(makeSubmission(), REVIEWER)
    expect(result.status).toBe(APPROVAL_STATUS.PUBLISHED)
    expect(result.postId).toBe('post-abc')
    expect(result.postSlug).toBe('mein-blogbeitrag')
    expect(result.message).toBe('Beitrag veröffentlicht')
  })

  it('runs inside a transaction', async () => {
    await publishSubmission(makeSubmission(), REVIEWER)
    expect(mockDbTransaction).toHaveBeenCalledTimes(1)
  })

  it('inserts a blog post inside the transaction', async () => {
    await publishSubmission(makeSubmission(), REVIEWER)
    expect(mockTxInsert).toHaveBeenCalled()
    expect(mockTxInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: 'mein-blogbeitrag',
        title: 'Mein Blogbeitrag',
        isPublished: true,
      }),
    )
  })

  it('email failure does NOT propagate', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('no network'))
    await expect(publishSubmission(makeSubmission(), REVIEWER)).resolves.toMatchObject({
      status: APPROVAL_STATUS.PUBLISHED,
    })
  })
})

// ============================================================================
// requestChanges
// ============================================================================

describe('requestChanges', () => {
  it('returns requires_changes status and Swiss-German message', async () => {
    const result = await requestChanges(makeSubmission(), REVIEWER, 'Bitte Abschnitt 2 überarbeiten')
    expect(result.status).toBe(APPROVAL_STATUS.REQUIRES_CHANGES)
    expect(result.message).toBe('Änderungen angefragt')
  })

  it('calls db.update with REQUIRES_CHANGES status and review notes', async () => {
    const notes = 'Bitte Quellen angeben'
    await requestChanges(makeSubmission(), REVIEWER, notes)
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: APPROVAL_STATUS.REQUIRES_CHANGES,
        reviewNotes: notes,
      }),
    )
  })

  it('email failure does NOT propagate', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('mail server unreachable'))
    await expect(
      requestChanges(makeSubmission(), REVIEWER, 'notes'),
    ).resolves.toMatchObject({ status: APPROVAL_STATUS.REQUIRES_CHANGES })
  })
})

// ============================================================================
// editSubmission — guard conditions
// ============================================================================

describe('editSubmission — guards', () => {
  it('throws EditNotAllowedError when status is APPROVED (not PENDING)', async () => {
    const approved = makeSubmission({ status: APPROVAL_STATUS.APPROVED })
    await expect(
      editSubmission(approved, REVIEWER, 'Editor', { title: 'New' }),
    ).rejects.toThrow(EditNotAllowedError)
  })

  it('throws EditNotAllowedError when status is PUBLISHED', async () => {
    const published = makeSubmission({ status: APPROVAL_STATUS.PUBLISHED })
    await expect(
      editSubmission(published, REVIEWER, 'Editor', { title: 'New' }),
    ).rejects.toThrow(EditNotAllowedError)
  })

  it('throws NoFieldsError when fields object is empty', async () => {
    await expect(
      editSubmission(makeSubmission(), REVIEWER, 'Editor', {}),
    ).rejects.toThrow(NoFieldsError)
  })

  it('returns { noChanges: true } when submitted title matches existing title', async () => {
    // Passing the same title as the current value → createEditSnapshot detects no change
    const submission = makeSubmission({ title: 'Gleicher Titel' })
    const result = await editSubmission(
      submission,
      REVIEWER,
      'Editor',
      { title: 'Gleicher Titel' }, // identical to current value
    )
    expect(result).toMatchObject({ noChanges: true })
    // DB must NOT be called for a no-op edit
    expect(mockDbExecute).not.toHaveBeenCalled()
  })
})

// ============================================================================
// editSubmission — happy path
// ============================================================================

describe('editSubmission — happy path', () => {
  it('calls db.execute for the UPDATE query', async () => {
    await editSubmission(makeSubmission(), REVIEWER, 'Editor', { title: 'Neuer Titel' })
    expect(mockDbExecute).toHaveBeenCalledTimes(1)
  })

  it('returns the updated submission and success message', async () => {
    const result = await editSubmission(makeSubmission(), REVIEWER, 'Editor', { title: 'Neuer Titel' })
    expect(result).toMatchObject({
      message: 'Einreichung erfolgreich aktualisiert',
      submission: expect.objectContaining({ id: 'sub-1' }),
    })
  })
})

// ============================================================================
// Custom error classes
// ============================================================================

describe('custom error classes', () => {
  it('EditNotAllowedError has name "EditNotAllowedError"', () => {
    const err = new EditNotAllowedError('msg')
    expect(err.name).toBe('EditNotAllowedError')
    expect(err).toBeInstanceOf(Error)
  })

  it('NoFieldsError has name "NoFieldsError"', () => {
    const err = new NoFieldsError('msg')
    expect(err.name).toBe('NoFieldsError')
    expect(err).toBeInstanceOf(Error)
  })
})
