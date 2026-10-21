/**
 * A real adapter test: evig may retry after the original HTTP response is lost,
 * but it must reuse one create key and must not re-create already-linked items.
 */
const { mockSelect, mockUpdate, mockSync, mockConfigured, mockLogger } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockUpdate: vi.fn(),
  mockSync: vi.fn(),
  mockConfigured: vi.fn(),
  mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));
vi.mock('@/db/schema/inventory', () => ({
  inventoryItems: { id: 'inventory.id', kivviInventoryItemId: 'inventory.kivvi_id' },
}));
vi.mock('@/lib/kivvi/client', () => ({
  isKivviConfigured: (...args: unknown[]) => mockConfigured(...args),
  syncToKivvi: (...args: unknown[]) => mockSync(...args),
  mapConditionToKivvi: (condition: string) => (condition === 'new' ? 'like_new' : condition),
}));
vi.mock('@/lib/logger', () => ({ logger: mockLogger }));

import { kivviInventoryCreateKey, syncProductToKivvi } from '../sync-product';

function dbRow(kivviInventoryItemId: string | null) {
  mockSelect.mockReturnValue({
    from: () => ({
      where: () => ({ limit: async () => [{ kivviInventoryItemId }] }),
    }),
  });
}
function dbMissing() {
  mockSelect.mockReturnValue({
    from: () => ({
      where: () => ({ limit: async () => [] }),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockConfigured.mockReturnValue(true);
  mockSync.mockResolvedValue({
    success: true,
    kivviInventoryItemId: 'kivvi-1',
    itemNumber: 'IT-001',
  });
  dbRow(null);
  mockUpdate.mockReturnValue({ set: () => ({ where: async () => [] }) });
});

it('keys the create by the immutable local inventory identity, not by the price or title', () => {
  expect(kivviInventoryCreateKey('inv-789')).toBe('evig:inventory:create:v1:inv-789');
});

it('does not read or write ERP data when integration is disabled', () => {
  mockConfigured.mockReturnValue(false);
  syncProductToKivvi({ inventoryId: 'inv-789', produktname: 'ThinkPad' });
  expect(mockSelect).not.toHaveBeenCalled();
  expect(mockSync).not.toHaveBeenCalled();
});

it('does not create a second Kivvi item if one is already linked locally', async () => {
  dbRow('existing-kivvi-id');
  syncProductToKivvi({ inventoryId: 'inv-789', produktname: 'ThinkPad' });
  await vi.waitFor(() => expect(mockSelect).toHaveBeenCalledOnce());
  expect(mockSync).not.toHaveBeenCalled();
  expect(mockUpdate).not.toHaveBeenCalled();
});

it('does not create a remote item for an inventory ID that is absent locally', async () => {
  dbMissing();
  syncProductToKivvi({ inventoryId: 'missing', produktname: 'ThinkPad' });
  await vi.waitFor(() => expect(mockLogger.warn).toHaveBeenCalled());
  expect(mockSync).not.toHaveBeenCalled();
});

it('forwards a stable idempotency key and records the returned ERP identifier', async () => {
  syncProductToKivvi({
    inventoryId: 'inv-789',
    produktname: 'ThinkPad',
    hersteller: 'Lenovo',
    zustand: 'new',
    verkaufspreis: 125,
  });
  await vi.waitFor(() => expect(mockUpdate).toHaveBeenCalledOnce());
  expect(mockSync).toHaveBeenCalledWith(
    expect.objectContaining({
      description: 'Lenovo ThinkPad',
      condition: 'like_new',
      askingPrice: '125',
    }),
    'evig:inventory:create:v1:inv-789',
  );
});

it('records an ERP sync error without inventing a Kivvi item ID', async () => {
  mockSync.mockResolvedValueOnce({ success: false, error: 'network timeout' });
  syncProductToKivvi({ inventoryId: 'inv-789', produktname: 'ThinkPad' });
  await vi.waitFor(() => expect(mockLogger.warn).toHaveBeenCalled());
  expect(mockUpdate).toHaveBeenCalledOnce();
});
