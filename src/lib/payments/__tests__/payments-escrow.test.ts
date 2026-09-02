/**
 * Tests for payments/payments-escrow.ts — escrow account creation.
 *
 * Mission-relevant: escrow accounts hold payment funds between buyer and seller
 * in service transactions. If createEscrowAccount inserts with the wrong status
 * (e.g., 'released' instead of 'active'), funds are immediately released.
 *
 * Behaviors locked:
 *   createEscrowAccount
 *   - calls db.insert once
 *   - inserts with ESCROW_STATUS.ACTIVE
 *   - passes transactionId, amount, currency, autoReleaseDays from params
 */

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeChain(result: unknown = undefined) {
  const resolved = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.values = vi.fn().mockReturnValue(chain);
  chain.then = (resolved as Promise<unknown>).then.bind(resolved);
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved);
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved);
  return chain;
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbInsert = vi.fn((..._args: unknown[]) => makeChain());

vi.mock('@/db', () => ({
  db: {
    insert: (...args: unknown[]) => mockDbInsert(...args),
  },
}));

vi.mock('@/db/schema', () => ({
  escrowAccounts: {
    transactionId: 'ea_transactionId',
    totalAmountCents: 'ea_totalAmountCents',
    currency: 'ea_currency',
    autoReleaseDays: 'ea_autoReleaseDays',
    releaseDeadline: 'ea_releaseDeadline',
    buyerId: 'ea_buyerId',
    status: 'ea_status',
  },
}));

vi.mock('drizzle-orm', async () => ({
  ...(await vi.importActual('drizzle-orm')),
  sql: Object.assign(vi.fn().mockReturnValue({ __sql: 'mocked' }), {
    raw: vi.fn().mockReturnValue({ __raw: true }),
  }),
}));

vi.mock('@/config/payment-status', () => ({
  ESCROW_STATUS: { ACTIVE: 'active', RELEASED: 'released' },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import type { Mock } from 'vitest';
import { createEscrowAccount } from '../payments-escrow';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_PARAMS = {
  transactionId: 'tx-1',
  totalAmountCents: 15000,
  currency: 'CHF' as const,
  autoReleaseDays: 7,
  buyerId: 'user-1',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockDbInsert.mockImplementation(() => makeChain());
});

// ============================================================================
// createEscrowAccount
// ============================================================================

describe('createEscrowAccount', () => {
  it('calls db.insert once', async () => {
    await createEscrowAccount(BASE_PARAMS);

    expect(mockDbInsert).toHaveBeenCalledTimes(1);
  });

  it('inserts with ESCROW_STATUS.ACTIVE', async () => {
    let capturedValues: Record<string, unknown> | null = null;
    mockDbInsert.mockImplementationOnce(() => {
      const chain = makeChain();
      const origValues = chain.values as Mock;
      chain.values = vi.fn((...args: unknown[]) => {
        capturedValues = args[0] as Record<string, unknown>;
        return origValues(...args);
      });
      return chain;
    });

    await createEscrowAccount(BASE_PARAMS);

    expect((capturedValues as unknown as Record<string, unknown>)?.status).toBe('active');
  });

  it('passes all params from EscrowParams', async () => {
    let capturedValues: Record<string, unknown> | null = null;
    mockDbInsert.mockImplementationOnce(() => {
      const chain = makeChain();
      const origValues = chain.values as Mock;
      chain.values = vi.fn((...args: unknown[]) => {
        capturedValues = args[0] as Record<string, unknown>;
        return origValues(...args);
      });
      return chain;
    });

    await createEscrowAccount(BASE_PARAMS);

    expect((capturedValues as unknown as Record<string, unknown>)?.transactionId).toBe('tx-1');
    expect((capturedValues as unknown as Record<string, unknown>)?.totalAmountCents).toBe(15000);
    expect((capturedValues as unknown as Record<string, unknown>)?.currency).toBe('CHF');
    expect((capturedValues as unknown as Record<string, unknown>)?.autoReleaseDays).toBe(7);
    expect((capturedValues as unknown as Record<string, unknown>)?.buyerId).toBe('user-1');
  });
});
