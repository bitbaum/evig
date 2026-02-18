/**
 * Notification Service Unit Tests
 *
 * Tests createNotification, notifyAllStaff, notifyUsers, and fireNotification.
 * Verifies in-app delivery (sent_in_app), email delivery based on user
 * preferences, and that email failures never propagate.
 */

import { query } from '@/lib/auth/db'
import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
import { notificationEmail } from '@/lib/email/templates/notification'
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
jest.mock('@/lib/email', () => ({ sendCustomEmail: jest.fn() }))
jest.mock('@/lib/email/templates/notification', () => ({
  notificationEmail: jest.fn(() => ({
    subject: 'Test',
    html: '<p>Test</p>',
    text: 'Test',
  })),
}))

const mockQuery = query as jest.Mock
const mockSendEmail = sendCustomEmail as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  mockSendEmail.mockResolvedValue({ success: true })
})

// ---------------------------------------------------------------------------
// createNotification
// ---------------------------------------------------------------------------

describe('createNotification', () => {
  it('inserts one row with sent_in_app = true and RETURNING id', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'notif-1' }], rowCount: 1 }) // INSERT
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1', email: 'a@b.ch', email_notifications: true }] }) // user lookup
      .mockResolvedValueOnce({ rows: [] }) // UPDATE sent_email

    await createNotification('user-1', {
      type: 'decision_voting',
      title: 'Abstimmung geöffnet',
      content: 'Eine neue Abstimmung wartet auf deine Stimme.',
      related_type: 'decision',
      related_id: 'decision-1',
    })

    // INSERT call
    const [insertSql, insertParams] = mockQuery.mock.calls[0] as [string, unknown[]]
    expect(insertSql).toContain('INSERT INTO')
    expect(insertSql).toContain('sent_in_app')
    expect(insertSql).toContain('RETURNING id')
    expect(insertParams).toEqual([
      'user-1', 'decision_voting', 'Abstimmung geöffnet',
      'Eine neue Abstimmung wartet auf deine Stimme.', 'decision', 'decision-1',
    ])
  })

  it('passes null for optional related_type and related_id', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'notif-1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1', email: 'a@b.ch', email_notifications: true }] })
      .mockResolvedValueOnce({ rows: [] })

    await createNotification('user-1', {
      type: 'system',
      title: 'Systemnachricht',
      content: 'Eine Systemnachricht.',
    })

    const [, params] = mockQuery.mock.calls[0] as [string, unknown[]]
    expect(params[4]).toBeNull()
    expect(params[5]).toBeNull()
  })

  it('sends email when user has email_notifications = true', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'notif-1' }] })
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1', email: 'a@b.ch', email_notifications: true }] })
      .mockResolvedValueOnce({ rows: [] })

    await createNotification('user-1', {
      type: 'system',
      title: 'Test',
      content: 'Inhalt.',
    })

    expect(notificationEmail).toHaveBeenCalledWith('Test', 'Inhalt.')
    expect(mockSendEmail).toHaveBeenCalledWith('a@b.ch', expect.objectContaining({ subject: 'Test' }))
  })

  it('sends email when email_notifications is null (default opt-in)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'notif-1' }] })
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1', email: 'a@b.ch', email_notifications: null }] })
      .mockResolvedValueOnce({ rows: [] })

    await createNotification('user-1', {
      type: 'system',
      title: 'Test',
      content: 'Inhalt.',
    })

    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  it('skips email when email_notifications = false', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'notif-1' }] })
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1', email: 'a@b.ch', email_notifications: false }] })

    await createNotification('user-1', {
      type: 'system',
      title: 'Test',
      content: 'Inhalt.',
    })

    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('email failure does not throw — logs and continues', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP down'))

    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 'notif-1' }] })
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-1', email: 'a@b.ch', email_notifications: true }] })

    // Must not throw
    await expect(
      createNotification('user-1', { type: 'system', title: 'T', content: 'C' })
    ).resolves.toBeUndefined()

    expect(logger.error).toHaveBeenCalledWith(
      'Notification email failed',
      expect.objectContaining({ userId: 'user-1' }),
    )
  })
})

// ---------------------------------------------------------------------------
// notifyAllStaff
// ---------------------------------------------------------------------------

describe('notifyAllStaff', () => {
  it('fetches staff with email prefs via JOIN, bulk-inserts, and sends emails', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          { user_id: 'staff-a', email: 'a@r.ch', email_notifications: true },
          { user_id: 'staff-b', email: 'b@r.ch', email_notifications: true },
        ],
      }) // staff query with JOIN
      .mockResolvedValueOnce({ rows: [{ id: 'n1' }, { id: 'n2' }], rowCount: 2 }) // bulk INSERT
      .mockResolvedValueOnce({ rows: [] }) // UPDATE sent_email

    await notifyAllStaff({
      type: 'decision_voting',
      title: 'Abstimmung geöffnet',
      content: 'Bitte stimme ab.',
      related_type: 'decision',
      related_id: 'dec-1',
    })

    // Staff query uses LEFT JOIN
    const [selectSql] = mockQuery.mock.calls[0] as [string, unknown[]]
    expect(selectSql).toContain('LEFT JOIN')
    expect(selectSql).toContain('email_notifications')

    // Bulk INSERT includes sent_in_app, has 12 params (2 users × 6 fields)
    const [insertSql, insertParams] = mockQuery.mock.calls[1] as [string, unknown[]]
    expect(insertSql).toContain('INSERT INTO')
    expect(insertSql).toContain('sent_in_app')
    expect(insertParams).toHaveLength(12)
    expect(insertParams[0]).toBe('staff-a')
    expect(insertParams[6]).toBe('staff-b')

    // Emails sent to both staff
    expect(mockSendEmail).toHaveBeenCalledTimes(2)
  })

  it('excludes the specified user from notifications', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ user_id: 'staff-b', email: 'b@r.ch', email_notifications: true }] })
      .mockResolvedValueOnce({ rows: [{ id: 'n1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [] })

    await notifyAllStaff(
      { type: 'decision_voting', title: 'Test', content: 'Test.' },
      'staff-a',
    )

    const [selectSql, selectParams] = mockQuery.mock.calls[0] as [string, unknown[]]
    expect(selectSql).toContain('AND u.id != $1')
    expect(selectParams).toEqual(['staff-a'])
  })

  it('does nothing when there are no staff users', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] })

    await notifyAllStaff({ type: 'test', title: 'Test', content: 'Test.' })

    expect(mockQuery).toHaveBeenCalledTimes(1)
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('does not include AND u.id != when no excludeUserId is given', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ user_id: 'staff-a', email: 'a@r.ch', email_notifications: true }] })
      .mockResolvedValueOnce({ rows: [{ id: 'n1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [] })

    await notifyAllStaff({ type: 'test', title: 'Test', content: 'Test.' })

    const [selectSql, selectParams] = mockQuery.mock.calls[0] as [string, unknown[]]
    expect(selectSql).not.toContain('AND u.id != $1')
    expect(selectParams).toEqual([])
  })

  it('skips email for staff with email_notifications = false', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          { user_id: 'staff-a', email: 'a@r.ch', email_notifications: false },
          { user_id: 'staff-b', email: 'b@r.ch', email_notifications: true },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ id: 'n1' }, { id: 'n2' }], rowCount: 2 })
      .mockResolvedValueOnce({ rows: [] })

    await notifyAllStaff({ type: 'test', title: 'Test', content: 'Test.' })

    // Only staff-b gets email
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    expect(mockSendEmail).toHaveBeenCalledWith('b@r.ch', expect.anything())
  })
})

// ---------------------------------------------------------------------------
// notifyUsers
// ---------------------------------------------------------------------------

describe('notifyUsers', () => {
  it('fetches user email prefs, bulk-inserts, and sends emails', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          { user_id: 'user-a', email: 'a@x.ch', email_notifications: true },
          { user_id: 'user-b', email: 'b@x.ch', email_notifications: true },
        ],
      }) // user lookup
      .mockResolvedValueOnce({ rows: [{ id: 'n1' }, { id: 'n2' }], rowCount: 2 }) // bulk INSERT
      .mockResolvedValueOnce({ rows: [] }) // UPDATE sent_email

    await notifyUsers(['user-a', 'user-b'], {
      type: 'protocol_finalized',
      title: 'Protokoll abgeschlossen',
      content: 'Das Protokoll ist jetzt verfügbar.',
      related_type: 'protocol',
      related_id: 'proto-1',
    })

    // User lookup uses LEFT JOIN
    const [lookupSql] = mockQuery.mock.calls[0] as [string, unknown[]]
    expect(lookupSql).toContain('LEFT JOIN')

    // Bulk INSERT with sent_in_app
    const [insertSql, insertParams] = mockQuery.mock.calls[1] as [string, unknown[]]
    expect(insertSql).toContain('INSERT INTO')
    expect(insertSql).toContain('sent_in_app')
    expect(insertParams).toHaveLength(12)
    expect(insertParams[0]).toBe('user-a')
    expect(insertParams[6]).toBe('user-b')

    expect(mockSendEmail).toHaveBeenCalledTimes(2)
  })

  it('does nothing when userIds is empty', async () => {
    await notifyUsers([], { type: 'test', title: 'Test', content: 'Test.' })
    expect(mockQuery).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('generates correct placeholder count for a single user', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ user_id: 'user-only', email: 'u@x.ch', email_notifications: true }] })
      .mockResolvedValueOnce({ rows: [{ id: 'n1' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [] })

    await notifyUsers(['user-only'], {
      type: 'test',
      title: 'Test',
      content: 'Test.',
    })

    const [sql] = mockQuery.mock.calls[1] as [string, unknown[]]
    expect(sql).toContain('($1, $2, $3, $4, $5, $6, true)')
    expect(sql).not.toContain('$7')
  })

  it('skips email for opted-out users', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          { user_id: 'user-a', email: 'a@x.ch', email_notifications: false },
          { user_id: 'user-b', email: 'b@x.ch', email_notifications: true },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ id: 'n1' }, { id: 'n2' }], rowCount: 2 })
      .mockResolvedValueOnce({ rows: [] })

    await notifyUsers(['user-a', 'user-b'], {
      type: 'test',
      title: 'Test',
      content: 'Test.',
    })

    expect(mockSendEmail).toHaveBeenCalledTimes(1)
    expect(mockSendEmail).toHaveBeenCalledWith('b@x.ch', expect.anything())
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
