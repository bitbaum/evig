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

  it('deduplicates recipients, looks up valid users, and inserts notifications', async () => {
    mockSelectResult = [{ id: 'u1' }, { id: 'u2' }]

    await createInAppNotifications({
      recipientIds: ['u1', 'u2', 'u1'],
      title: 'Aufgabe',
      content: 'Bitte übernehmen',
      relatedType: 'task',
      relatedId: 'task-1',
    })

    // Should look up valid users via select
    expect(db.select).toHaveBeenCalledTimes(1)
    expect(mockSelectChain.from).toHaveBeenCalled()
    expect(mockSelectChain.where).toHaveBeenCalled()

    // Should insert notifications for valid users
    expect(db.insert).toHaveBeenCalledTimes(1)
    expect(mockInsertChain.values).toHaveBeenCalledWith([
      expect.objectContaining({ userId: 'u1', title: 'Aufgabe', content: 'Bitte übernehmen', relatedType: 'task', relatedId: 'task-1' }),
      expect.objectContaining({ userId: 'u2', title: 'Aufgabe', content: 'Bitte übernehmen', relatedType: 'task', relatedId: 'task-1' }),
    ])
  })

  it('skips insert when no valid users found', async () => {
    mockSelectResult = []

    await createInAppNotifications({
      recipientIds: ['unknown-id'],
      title: 'Test',
      content: 'Inhalt',
    })

    expect(db.select).toHaveBeenCalledTimes(1)
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('does not throw on insert failure (logs warning instead)', async () => {
    mockSelectResult = [{ id: 'u1' }]
    mockInsertChain.values.mockRejectedValueOnce(new Error('DB error'))

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
