/**
 * Tests for lib/activity.ts — fire-and-forget activity feed writes.
 *
 * Mission-relevant: the activity feed powers the admin team dashboard.
 * If logActivity throws, it would interrupt the primary action that
 * triggered it (approving a listing, capturing a device, etc.).
 * The fire-and-forget contract means DB failures must be swallowed.
 *
 * Behaviors locked:
 *   logActivity
 *   - calls db.insert once with correct values
 *   - null-fills optional fields when not provided
 *   - does NOT throw even when DB insert fails
 *   - does NOT return a promise (fire-and-forget, void return)
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockInsertReturning = vi.fn().mockResolvedValue([]);
const mockInsertValues = vi
  .fn()
  .mockReturnValue({ returning: mockInsertReturning, catch: mockInsertReturning });
const mockDbInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

// Make .values() return a thenable that resolves (simulates Drizzle promise-like)
// logActivity calls .catch() on the result of db.insert().values() — mock the chain
function makeChain(error?: Error) {
  const result = error ? Promise.reject(error) : Promise.resolve([]);
  const chain = {
    catch: vi.fn((handler: (e: unknown) => void) => {
      if (error) return result.catch(handler);
      return result;
    }),
  };
  return chain;
}

vi.mock('@/db', () => ({
  db: {
    insert: (...args: unknown[]) => mockDbInsert(...args),
  },
}));

vi.mock('@/db/schema/misc', () => ({
  activityFeed: { tableName: 'activity_feed' },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import type { Mock } from 'vitest';
import { logActivity } from '../activity';
import { logger } from '../logger';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Default: successful insert
  mockInsertValues.mockReturnValue(makeChain());
  mockDbInsert.mockReturnValue({ values: mockInsertValues });
});

function flushPromises() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

// ============================================================================
// logActivity — basic call
// ============================================================================

describe('logActivity', () => {
  it('calls db.insert once', async () => {
    logActivity({ actorId: 'user-1', action: 'approved_listing' });
    await flushPromises();
    expect(mockDbInsert).toHaveBeenCalledTimes(1);
  });

  it('passes actorId and action to insert values', async () => {
    logActivity({ actorId: 'user-2', action: 'captured_device' });
    await flushPromises();
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'user-2',
        action: 'captured_device',
      }),
    );
  });

  it('includes subjectType, subjectId, subjectLabel when provided', async () => {
    logActivity({
      actorId: 'user-1',
      action: 'approved_blog',
      subjectType: 'blog_post',
      subjectId: 'post-123',
      subjectLabel: 'Mein Blog',
    });
    await flushPromises();
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        subjectType: 'blog_post',
        subjectId: 'post-123',
        subjectLabel: 'Mein Blog',
      }),
    );
  });

  it('null-fills optional fields when not provided', async () => {
    logActivity({ actorId: 'user-1', action: 'closed_it_hilfe' });
    await flushPromises();
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        subjectType: null,
        subjectId: null,
        subjectLabel: null,
      }),
    );
  });

  it('returns void (fire-and-forget)', () => {
    const result = logActivity({ actorId: 'user-1', action: 'approved_repairer' });
    expect(result).toBeUndefined();
  });

  it('does NOT throw when DB insert fails', async () => {
    mockInsertValues.mockReturnValueOnce(makeChain(new Error('DB connection lost')));

    expect(() => logActivity({ actorId: 'user-1', action: 'approved_listing' })).not.toThrow();
    await flushPromises();
  });

  it('logs a warning when DB insert fails', async () => {
    mockInsertValues.mockReturnValueOnce(makeChain(new Error('timeout')));

    logActivity({ actorId: 'user-1', action: 'captured_device' });
    await flushPromises();

    expect(logger.warn as Mock).toHaveBeenCalledWith(
      'activity feed insert failed',
      expect.objectContaining({ action: 'captured_device' }),
    );
  });
});
