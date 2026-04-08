/**
 * Tests for createInAppNotifications (task-helpers.ts)
 *
 * The implementation uses Drizzle ORM (db from @/db).
 */

// Mock Drizzle db with chainable API
let mockSelectResult: unknown[] = []
const mockSelectChain = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockImplementation(() => Promise.resolve(mockSelectResult)),
}
const mockInsertChain = {
  values: jest.fn().mockResolvedValue(undefined),
}

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(() => mockSelectChain),
    insert: jest.fn(() => mockInsertChain),
  },
}))
jest.mock('@/db/schema/auth', () => ({
  users: { id: 'users.id', email: 'users.email' },
}))
jest.mock('@/db/schema/messaging', () => ({
  notifications: { id: 'notifications.id', userId: 'notifications.user_id' },
}))
jest.mock('@/db/schema/misc', () => ({
  tasks: { id: 'tasks.id', title: 'tasks.title', createdBy: 'tasks.created_by', isArchived: 'tasks.is_archived' },
}))
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  inArray: jest.fn(),
}))
jest.mock('@/lib/api/helpers', () => ({
  apiBadRequest: jest.fn((msg: string) => ({ error: msg })),
  apiNotFound: jest.fn((msg: string) => ({ error: msg })),
}))
jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}))
jest.mock('@/lib/services/notifications', () => ({
  notifyUsers: jest.fn().mockResolvedValue(undefined),
  createNotification: jest.fn().mockResolvedValue(undefined),
  notifyAllStaff: jest.fn().mockResolvedValue(undefined),
  fireNotification: jest.fn(),
}))

// Import AFTER mocks
import { createInAppNotifications } from '@/lib/api/task-helpers'
import { db } from '@/db'

beforeEach(() => {
  jest.clearAllMocks()
  mockSelectResult = []
})

describe('createInAppNotifications', () => {
  it('does nothing when recipient list is empty', async () => {
    await createInAppNotifications({
      recipientIds: [],
      title: 'Titel',
      content: 'Inhalt',
    })

    expect(db.select).not.toHaveBeenCalled()
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('does nothing when all recipient ids are falsy', async () => {
    await createInAppNotifications({
      recipientIds: ['', ''],
      title: 'Titel',
      content: 'Inhalt',
    })

    expect(db.select).not.toHaveBeenCalled()
  })

  it('deduplicates recipients and delegates to notifyUsers', async () => {
    const { notifyUsers } = require('@/lib/services/notifications')

    await createInAppNotifications({
      recipientIds: ['u1', 'u2', 'u1'],
      title: 'Aufgabe',
      content: 'Bitte übernehmen',
      relatedType: 'task',
      relatedId: 'task-1',
    })

    // Should call notifyUsers with deduplicated IDs
    expect(notifyUsers).toHaveBeenCalledWith(
      ['u1', 'u2'],
      expect.objectContaining({
        type: 'system',
        title: 'Aufgabe',
        content: 'Bitte übernehmen',
        related_type: 'task',
        related_id: 'task-1',
      })
    )
  })

  it('delegates single recipient to notifyUsers', async () => {
    const { notifyUsers } = require('@/lib/services/notifications')

    await createInAppNotifications({
      recipientIds: ['u1'],
      title: 'Test',
      content: 'Inhalt',
    })

    expect(notifyUsers).toHaveBeenCalledWith(
      ['u1'],
      expect.objectContaining({ title: 'Test', content: 'Inhalt' })
    )
  })

  it('does not throw on notifyUsers failure (logs warning instead)', async () => {
    const { notifyUsers } = require('@/lib/services/notifications')
    notifyUsers.mockRejectedValueOnce(new Error('Service error'))

    await expect(
      createInAppNotifications({
        recipientIds: ['u1'],
        title: 'Test',
        content: 'Inhalt',
      })
    ).resolves.toBeUndefined()

    const { logger } = require('@/lib/logger')
    expect(logger.warn).toHaveBeenCalledWith(
      'Failed to create in-app notifications',
      expect.objectContaining({ error: expect.any(Error) })
    )
  })
})
