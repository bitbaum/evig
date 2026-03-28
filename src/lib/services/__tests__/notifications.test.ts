/**
 * Notification Service Unit Tests
 *
 * Tests createNotification, notifyAllStaff, notifyUsers, and fireNotification.
 * Verifies in-app delivery (sent_in_app), email delivery based on user
 * preferences, and that email failures never propagate.
 */

import { logger } from '@/lib/logger'
import { sendCustomEmail } from '@/lib/email'
import { notificationEmail } from '@/lib/email/templates/notification'

// ---------------------------------------------------------------------------
// Drizzle chainable mock setup
// ---------------------------------------------------------------------------

/** Results to return from the various chain terminators. */
let insertReturningResult: unknown[] = []
let selectResult: unknown[] = []
let updateResult: unknown[] = []

const mockInsertChain = {
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockImplementation(() => Promise.resolve(insertReturningResult)),
}

const mockSelectChain = {
  from: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  where: jest.fn().mockImplementation(() => Promise.resolve(selectResult)),
}

const mockUpdateChain = {
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockImplementation(() => Promise.resolve(updateResult)),
  catch: jest.fn().mockReturnThis(),
}

// The update().set().where() chain needs a .catch() on its terminal — but
// in the implementation it's chained as:
//   db.update(notifications).set({...}).where(...).catch(...)
// So we need where() to return an object with .catch()
const mockUpdateTerminal = {
  catch: jest.fn().mockImplementation(() => Promise.resolve(undefined)),
}

jest.mock('@/db', () => ({
  db: {
    insert: jest.fn(() => mockInsertChain),
    select: jest.fn(() => mockSelectChain),
    update: jest.fn(() => ({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue(mockUpdateTerminal),
      }),
    })),
  },
}))

jest.mock('@/db/schema', () => ({
  notifications: {
    id: 'notifications.id',
    userId: 'notifications.user_id',
    type: 'notifications.type',
    title: 'notifications.title',
    content: 'notifications.content',
    relatedType: 'notifications.related_type',
    relatedId: 'notifications.related_id',
    sentInApp: 'notifications.sent_in_app',
    sentEmail: 'notifications.sent_email',
  },
  users: {
    id: 'users.id',
    email: 'users.email',
    isStaff: 'users.is_staff',
  },
  userProfiles: {
    userId: 'user_profiles.user_id',
    emailNotifications: 'user_profiles.email_notifications',
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: jest.fn((...args: unknown[]) => ({ _tag: 'eq', args })),
  ne: jest.fn((...args: unknown[]) => ({ _tag: 'ne', args })),
  and: jest.fn((...args: unknown[]) => ({ _tag: 'and', args })),
  inArray: jest.fn((...args: unknown[]) => ({ _tag: 'inArray', args })),
  sql: jest.fn(),
}))

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

// Import AFTER mocks
import {
  createNotification,
  notifyAllStaff,
  notifyUsers,
  fireNotification,
} from '@/lib/services/notifications'
import { db } from '@/db'

const mockSendEmail = sendCustomEmail as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  insertReturningResult = []
  selectResult = []
  updateResult = []
  mockSendEmail.mockResolvedValue({ success: true })

  // Reset chain implementations that may have been overridden
  mockInsertChain.values.mockReturnThis()
  mockInsertChain.returning.mockImplementation(() => Promise.resolve(insertReturningResult))
  mockSelectChain.from.mockReturnThis()
  mockSelectChain.innerJoin.mockReturnThis()
  mockSelectChain.leftJoin.mockReturnThis()
  mockSelectChain.where.mockImplementation(() => Promise.resolve(selectResult))
  mockUpdateTerminal.catch.mockImplementation(() => Promise.resolve(undefined))
})

// ---------------------------------------------------------------------------
// createNotification
// ---------------------------------------------------------------------------

describe('createNotification', () => {
  it('inserts one row with sentInApp = true and returns id', async () => {
    insertReturningResult = [{ id: 'notif-1' }]
    selectResult = [{ user_id: 'user-1', email: 'a@b.ch', email_notifications: true }]

    await createNotification('user-1', {
      type: 'decision_voting',
      title: 'Abstimmung geöffnet',
      content: 'Eine neue Abstimmung wartet auf deine Stimme.',
      related_type: 'decision',
      related_id: 'decision-1',
    })

    // db.insert was called
    expect(db.insert).toHaveBeenCalledTimes(1)
    // values() was called with the notification data
    expect(mockInsertChain.values).toHaveBeenCalledWith({
      userId: 'user-1',
      type: 'decision_voting',
      title: 'Abstimmung geöffnet',
      content: 'Eine neue Abstimmung wartet auf deine Stimme.',
      relatedType: 'decision',
      relatedId: 'decision-1',
      sentInApp: true,
    })
    // returning() was called to get id
    expect(mockInsertChain.returning).toHaveBeenCalled()
  })

  it('passes null for optional related_type and related_id', async () => {
    insertReturningResult = [{ id: 'notif-1' }]
    selectResult = [{ user_id: 'user-1', email: 'a@b.ch', email_notifications: true }]

    await createNotification('user-1', {
      type: 'system',
      title: 'Systemnachricht',
      content: 'Eine Systemnachricht.',
    })

    expect(mockInsertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({
        relatedType: null,
        relatedId: null,
      }),
    )
  })

  it('sends email when user has email_notifications = true', async () => {
    insertReturningResult = [{ id: 'notif-1' }]
    selectResult = [{ user_id: 'user-1', email: 'a@b.ch', email_notifications: true }]

    await createNotification('user-1', {
      type: 'system',
      title: 'Test',
      content: 'Inhalt.',
    })

    expect(notificationEmail).toHaveBeenCalledWith('Test', 'Inhalt.')
    expect(mockSendEmail).toHaveBeenCalledWith('a@b.ch', expect.objectContaining({ subject: 'Test' }))
  })

  it('sends email when email_notifications is null (default opt-in)', async () => {
    insertReturningResult = [{ id: 'notif-1' }]
    selectResult = [{ user_id: 'user-1', email: 'a@b.ch', email_notifications: null }]

    await createNotification('user-1', {
      type: 'system',
      title: 'Test',
      content: 'Inhalt.',
    })

    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  it('skips email when email_notifications = false', async () => {
    insertReturningResult = [{ id: 'notif-1' }]
    selectResult = [{ user_id: 'user-1', email: 'a@b.ch', email_notifications: false }]

    await createNotification('user-1', {
      type: 'system',
      title: 'Test',
      content: 'Inhalt.',
    })

    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('email failure does not throw — logs and continues', async () => {
    mockSendEmail.mockRejectedValueOnce(new Error('SMTP down'))
    insertReturningResult = [{ id: 'notif-1' }]
    selectResult = [{ user_id: 'user-1', email: 'a@b.ch', email_notifications: true }]

    // Must not throw
    await expect(
      createNotification('user-1', { type: 'system', title: 'T', content: 'C' }),
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
  it('fetches staff, bulk-inserts, and sends emails', async () => {
    // First select returns staff list, then insert returns ids
    selectResult = [
      { user_id: 'staff-a', email: 'a@r.ch', email_notifications: true },
      { user_id: 'staff-b', email: 'b@r.ch', email_notifications: true },
    ]
    insertReturningResult = [{ id: 'n1' }, { id: 'n2' }]

    await notifyAllStaff({
      type: 'decision_voting',
      title: 'Abstimmung geöffnet',
      content: 'Bitte stimme ab.',
      related_type: 'decision',
      related_id: 'dec-1',
    })

    // Staff query: db.select().from(users).leftJoin(...).where(...)
    expect(db.select).toHaveBeenCalled()
    expect(mockSelectChain.leftJoin).toHaveBeenCalled()
    expect(mockSelectChain.where).toHaveBeenCalled()

    // Bulk insert for 2 staff members
    expect(db.insert).toHaveBeenCalledTimes(1)
    expect(mockInsertChain.values).toHaveBeenCalledWith([
      expect.objectContaining({ userId: 'staff-a', sentInApp: true }),
      expect.objectContaining({ userId: 'staff-b', sentInApp: true }),
    ])

    // Emails sent to both staff
    expect(mockSendEmail).toHaveBeenCalledTimes(2)
  })

  it('excludes the specified user from notifications', async () => {
    const { ne } = require('drizzle-orm')

    selectResult = [{ user_id: 'staff-b', email: 'b@r.ch', email_notifications: true }]
    insertReturningResult = [{ id: 'n1' }]

    await notifyAllStaff(
      { type: 'decision_voting', title: 'Test', content: 'Test.' },
      'staff-a',
    )

    // ne() should have been called to exclude staff-a
    expect(ne).toHaveBeenCalledWith('users.id', 'staff-a')
  })

  it('does nothing when there are no staff users', async () => {
    selectResult = []

    await notifyAllStaff({ type: 'test', title: 'Test', content: 'Test.' })

    // Only the select query should have been made, no insert
    expect(db.select).toHaveBeenCalledTimes(1)
    expect(db.insert).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('does not call ne() when no excludeUserId is given', async () => {
    const { ne } = require('drizzle-orm')

    selectResult = [{ user_id: 'staff-a', email: 'a@r.ch', email_notifications: true }]
    insertReturningResult = [{ id: 'n1' }]

    await notifyAllStaff({ type: 'test', title: 'Test', content: 'Test.' })

    expect(ne).not.toHaveBeenCalled()
  })

  it('skips email for staff with email_notifications = false', async () => {
    selectResult = [
      { user_id: 'staff-a', email: 'a@r.ch', email_notifications: false },
      { user_id: 'staff-b', email: 'b@r.ch', email_notifications: true },
    ]
    insertReturningResult = [{ id: 'n1' }, { id: 'n2' }]

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
    selectResult = [
      { user_id: 'user-a', email: 'a@x.ch', email_notifications: true },
      { user_id: 'user-b', email: 'b@x.ch', email_notifications: true },
    ]
    insertReturningResult = [{ id: 'n1' }, { id: 'n2' }]

    await notifyUsers(['user-a', 'user-b'], {
      type: 'protocol_finalized',
      title: 'Protokoll abgeschlossen',
      content: 'Das Protokoll ist jetzt verfügbar.',
      related_type: 'protocol',
      related_id: 'proto-1',
    })

    // User lookup uses leftJoin
    expect(mockSelectChain.leftJoin).toHaveBeenCalled()

    // Bulk insert with sentInApp for both users
    expect(db.insert).toHaveBeenCalledTimes(1)
    expect(mockInsertChain.values).toHaveBeenCalledWith([
      expect.objectContaining({ userId: 'user-a', sentInApp: true }),
      expect.objectContaining({ userId: 'user-b', sentInApp: true }),
    ])

    expect(mockSendEmail).toHaveBeenCalledTimes(2)
  })

  it('does nothing when userIds is empty', async () => {
    await notifyUsers([], { type: 'test', title: 'Test', content: 'Test.' })
    expect(db.select).not.toHaveBeenCalled()
    expect(db.insert).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('handles a single user correctly', async () => {
    selectResult = [{ user_id: 'user-only', email: 'u@x.ch', email_notifications: true }]
    insertReturningResult = [{ id: 'n1' }]

    await notifyUsers(['user-only'], {
      type: 'test',
      title: 'Test',
      content: 'Test.',
    })

    expect(mockInsertChain.values).toHaveBeenCalledWith([
      expect.objectContaining({ userId: 'user-only', sentInApp: true }),
    ])
    expect(mockSendEmail).toHaveBeenCalledTimes(1)
  })

  it('skips email for opted-out users', async () => {
    selectResult = [
      { user_id: 'user-a', email: 'a@x.ch', email_notifications: false },
      { user_id: 'user-b', email: 'b@x.ch', email_notifications: true },
    ]
    insertReturningResult = [{ id: 'n1' }, { id: 'n2' }]

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
      { error },
    )
  })
})
