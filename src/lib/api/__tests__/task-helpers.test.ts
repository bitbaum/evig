/**
 * Tests for createInAppNotifications (task-helpers.ts)
 *
 * The implementation uses Drizzle ORM (db from @/db).
 */

// Mock Drizzle db with chainable API
let mockSelectResult: unknown[] = [];
const mockSelectChain = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockImplementation(() => Promise.resolve(mockSelectResult)),
};
const mockInsertChain = {
  values: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/db', () => ({
  db: {
    select: vi.fn((..._args: unknown[]) => mockSelectChain),
    insert: vi.fn((..._args: unknown[]) => mockInsertChain),
  },
}));
vi.mock('@/db/schema/auth', () => ({
  users: { id: 'users.id', email: 'users.email' },
}));
vi.mock('@/db/schema/messaging', () => ({
  notifications: { id: 'notifications.id', userId: 'notifications.user_id' },
}));
vi.mock('@/db/schema/misc', () => ({
  tasks: {
    id: 'tasks.id',
    title: 'tasks.title',
    createdBy: 'tasks.created_by',
    isArchived: 'tasks.is_archived',
  },
}));
vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  inArray: vi.fn(),
}));
vi.mock('@/lib/api/helpers', () => ({
  apiBadRequest: vi.fn((msg: string) => ({ error: msg })),
  apiNotFound: vi.fn((msg: string) => ({ error: msg })),
}));
vi.mock('@/lib/logger', () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock('@/lib/services/notifications', () => ({
  notifyUsers: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue(undefined),
  notifyAllStaff: vi.fn().mockResolvedValue(undefined),
  fireNotification: vi.fn(),
}));

// Import AFTER mocks
import type { Mock } from 'vitest';
import { createInAppNotifications } from '@/lib/api/task-helpers';
import { db } from '@/db';

beforeEach(() => {
  vi.clearAllMocks();
  mockSelectResult = [];
});

describe('createInAppNotifications', () => {
  it('does nothing when recipient list is empty', async () => {
    await createInAppNotifications({
      recipientIds: [],
      title: 'Titel',
      content: 'Inhalt',
    });

    expect(db.select).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('does nothing when all recipient ids are falsy', async () => {
    await createInAppNotifications({
      recipientIds: ['', ''],
      title: 'Titel',
      content: 'Inhalt',
    });

    expect(db.select).not.toHaveBeenCalled();
  });

  it('deduplicates recipients and delegates to notifyUsers', async () => {
    const { notifyUsers } = (await import('@/lib/services/notifications')) as any;

    await createInAppNotifications({
      recipientIds: ['u1', 'u2', 'u1'],
      title: 'Aufgabe',
      content: 'Bitte übernehmen',
      relatedType: 'task',
      relatedId: 'task-1',
    });

    // Should call notifyUsers with deduplicated IDs
    expect(notifyUsers).toHaveBeenCalledWith(
      ['u1', 'u2'],
      expect.objectContaining({
        type: 'system',
        title: 'Aufgabe',
        content: 'Bitte übernehmen',
        related_type: 'task',
        related_id: 'task-1',
      }),
    );
  });

  it('delegates single recipient to notifyUsers', async () => {
    const { notifyUsers } = (await import('@/lib/services/notifications')) as any;

    await createInAppNotifications({
      recipientIds: ['u1'],
      title: 'Test',
      content: 'Inhalt',
    });

    expect(notifyUsers).toHaveBeenCalledWith(
      ['u1'],
      expect.objectContaining({ title: 'Test', content: 'Inhalt' }),
    );
  });

  it('does not throw on notifyUsers failure (logs warning instead)', async () => {
    const { notifyUsers } = (await import('@/lib/services/notifications')) as any;
    notifyUsers.mockRejectedValueOnce(new Error('Service error'));

    await expect(
      createInAppNotifications({
        recipientIds: ['u1'],
        title: 'Test',
        content: 'Inhalt',
      }),
    ).resolves.toBeUndefined();

    const { logger } = (await import('@/lib/logger')) as any;
    expect(logger.warn).toHaveBeenCalledWith(
      'Failed to create in-app notifications',
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });
});
