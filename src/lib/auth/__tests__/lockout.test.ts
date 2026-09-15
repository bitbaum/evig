/**
 * Tests for lockout.ts — in-memory and DB-backed account lockout.
 */

// Mock dependencies before imports
vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
    select: vi.fn(),
    update: vi.fn((..._args: unknown[]) => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    })),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import type { Mock } from 'vitest';
import {
  recordFailedAttempt,
  isAccountLocked,
  resetLockout,
  clearFailedAttempts,
  isAccountLockedDb,
} from '../lockout';

const mockDb = (await import('@/db')).db as unknown as {
  select: Mock;
};

// ============================================================================
// Account Lockout
// ============================================================================

describe('recordFailedAttempt', () => {
  let testId = 0;
  const getUniqueId = () => `lockout-test-${++testId}-${Date.now()}`;

  it('tracks failed attempts', () => {
    const id = getUniqueId();
    const result = recordFailedAttempt(id);
    expect(result.locked).toBe(false);
    expect(result.remainingAttempts).toBe(4); // 5 max - 1 attempt
  });

  it('locks account after max failed attempts', () => {
    const id = getUniqueId();
    let result;
    for (let i = 0; i < 5; i++) {
      result = recordFailedAttempt(id);
    }
    expect(result!.locked).toBe(true);
    expect(result!.remainingAttempts).toBe(0);
    expect(result!.retryAfter).toBeGreaterThan(0);
  });

  it('keeps account locked on subsequent attempts', () => {
    const id = getUniqueId();
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(id);
    }
    // Attempt again while locked
    const result = recordFailedAttempt(id);
    expect(result.locked).toBe(true);
  });
});

describe('isAccountLocked', () => {
  let testId = 0;
  const getUniqueId = () => `locked-test-${++testId}-${Date.now()}`;

  it('returns not locked for unknown identifier', () => {
    const result = isAccountLocked(getUniqueId());
    expect(result.locked).toBe(false);
    expect(result.remainingAttempts).toBe(5);
  });

  it('returns locked after max failures', () => {
    const id = getUniqueId();
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(id);
    }
    const result = isAccountLocked(id);
    expect(result.locked).toBe(true);
  });
});

describe('resetLockout', () => {
  it('clears lockout state', () => {
    const id = `reset-lockout-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(id);
    }
    expect(isAccountLocked(id).locked).toBe(true);

    resetLockout(id);
    expect(isAccountLocked(id).locked).toBe(false);
  });
});

describe('clearFailedAttempts', () => {
  it('resets failed attempt count without removing entry', () => {
    const id = `clear-attempts-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      recordFailedAttempt(id);
    }
    clearFailedAttempts(id);
    const result = isAccountLocked(id);
    expect(result.locked).toBe(false);
    expect(result.remainingAttempts).toBe(5);
  });
});

describe('isAccountLockedDb', () => {
  function mockLockoutRows(rows: unknown[]) {
    const limit = vi.fn().mockResolvedValue(rows);
    const where = vi.fn((..._args: unknown[]) => ({ limit }));
    const from = vi.fn((..._args: unknown[]) => ({ where }));
    mockDb.select.mockReturnValue({ from });
    return { from, where, limit };
  }

  beforeEach(() => {
    mockDb.select.mockReset();
  });

  it('returns unlocked when no persistent lockout row exists', async () => {
    mockLockoutRows([]);

    const result = await isAccountLockedDb('user-1');

    expect(result).toEqual({ locked: false, remainingAttempts: 5 });
  });

  it('returns locked when locked_until is in the future', async () => {
    const lockedUntil = new Date(Date.now() + 60_000).toISOString();
    mockLockoutRows([{ failedAttempts: 5, lockedUntil }]);

    const result = await isAccountLockedDb('user-1');

    expect(result.locked).toBe(true);
    expect(result.remainingAttempts).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('falls back to in-memory lockout if the DB read fails', async () => {
    mockDb.select.mockImplementationOnce(() => {
      throw new Error('db unavailable');
    });

    const id = 'user-fallback';
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(`${id}:login`);
    }

    const result = await isAccountLockedDb(id);

    expect(result.locked).toBe(true);
  });
});
