/**
 * Tests for order-service.ts
 *
 * Tests order creation with mocked Drizzle ORM (db.execute + db.transaction).
 */

// ---------------------------------------------------------------------------
// Drizzle mock setup
// ---------------------------------------------------------------------------

// Use an object container so we can reference it inside hoisted jest.mock factories.
// jest.mock is hoisted above const declarations, so direct references would hit TDZ.
const mocks = {
  execute: jest.fn(),
  txExecute: jest.fn(),
  transaction: jest.fn(),
}

// Wire up transaction to call the callback with a fake tx
mocks.transaction.mockImplementation(async (cb: (tx: { execute: jest.Mock }) => Promise<unknown>) => {
  return cb({ execute: mocks.txExecute })
})

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mocks.execute(...args),
    transaction: (...args: unknown[]) => mocks.transaction(...args),
  },
}))

jest.mock('drizzle-orm', () => ({
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
    {
      raw: (v: string) => v,
      join: (items: unknown[], sep: unknown) => ({ items, sep }),
    }
  ),
  getTableName: (table: unknown) => {
    if (table && typeof table === 'object' && '_name' in table) return (table as { _name: string })._name
    return 'mock_table'
  },
}))

jest.mock('@/db/schema', () => ({
  inventoryItems: { _name: 'inventory_items' },
  aiExtractedProducts: { _name: 'ai_extracted_products' },
  orders: { _name: 'orders' },
  orderItems: { _name: 'order_items' },
}))

jest.mock('@/config/payment-status', () => ({
  PAYMENT_STATUS: { PENDING: 'pending' },
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

import { createOrder } from '../order-service'
import type { CreateOrderParams, ShippingAddress } from '../order-service'

describe('createOrder', () => {
  beforeEach(() => {
    mocks.execute.mockReset()
    mocks.transaction.mockClear()
    mocks.transaction.mockImplementation(async (cb: (tx: { execute: jest.Mock }) => Promise<unknown>) => {
      return cb({ execute: mocks.txExecute })
    })
    mocks.txExecute.mockReset()
  })

  it('creates an order with inventory items and returns id + timestamp', async () => {
    // db.execute: inventory lookup
    mocks.execute.mockResolvedValueOnce({
      rows: [{
        id: 'inv-1',
        selling_price_chf: 50,
        quantity_available: 10,
        product_name: 'Test Product',
      }],
    })

    // tx.execute calls inside transaction:
    // 1) INSERT INTO orders RETURNING id, created_at
    mocks.txExecute.mockResolvedValueOnce({
      rows: [{ id: 'order-1', created_at: '2024-01-15T10:00:00Z' }],
    })
    // 2) INSERT INTO order_items
    mocks.txExecute.mockResolvedValueOnce({ rows: [] })
    // 3) UPDATE inventory_items (decrement)
    mocks.txExecute.mockResolvedValueOnce({ rows: [] })

    const params: CreateOrderParams = {
      userId: 'user-1',
      items: [{ inventoryItemId: 'inv-1', quantity: 1 }],
      paymentTransactionId: 'txn_test123',
    }

    const result = await createOrder(params)
    expect(result.orderId).toBe('order-1')
    expect(result.createdAt).toBe('2024-01-15T10:00:00Z')

    // 1 db.execute (inventory lookup) + 1 db.transaction call
    expect(mocks.execute).toHaveBeenCalledTimes(1)
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
    // Inside transaction: order insert + order_item insert + inventory decrement
    expect(mocks.txExecute).toHaveBeenCalledTimes(3)
  })

  it('includes shipping address when provided', async () => {
    mocks.execute.mockResolvedValueOnce({
      rows: [{
        id: 'inv-1',
        selling_price_chf: 50,
        quantity_available: 10,
        product_name: 'Test Product',
      }],
    })

    mocks.txExecute.mockResolvedValueOnce({
      rows: [{ id: 'order-2', created_at: '2024-01-15' }],
    })
    mocks.txExecute.mockResolvedValueOnce({ rows: [] })
    mocks.txExecute.mockResolvedValueOnce({ rows: [] })

    const address: ShippingAddress = {
      firstName: 'Hans',
      lastName: 'Müller',
      street: 'Bahnhofstrasse 1',
      city: 'Zürich',
      postalCode: '8001',
      country: 'CH',
    }

    await createOrder({
      userId: 'user-1',
      items: [{ inventoryItemId: 'inv-1', quantity: 1 }],
      paymentTransactionId: 'txn_test',
      shippingAddress: address,
    })

    // The first tx.execute call is the order INSERT — its sql template
    // should contain the JSON-serialized shipping address in its values
    const orderInsertCall = mocks.txExecute.mock.calls[0][0]
    expect(orderInsertCall.values).toContainEqual(JSON.stringify(address))
  })

  it('passes null when no shipping address', async () => {
    mocks.execute.mockResolvedValueOnce({
      rows: [{
        id: 'inv-1',
        selling_price_chf: 50,
        quantity_available: 10,
        product_name: 'Test Product',
      }],
    })

    mocks.txExecute.mockResolvedValueOnce({
      rows: [{ id: 'order-3', created_at: '2024-01-15' }],
    })
    mocks.txExecute.mockResolvedValueOnce({ rows: [] })
    mocks.txExecute.mockResolvedValueOnce({ rows: [] })

    await createOrder({
      userId: 'user-1',
      items: [{ inventoryItemId: 'inv-1', quantity: 1 }],
      paymentTransactionId: 'txn_test',
    })

    // The first tx.execute call is the order INSERT — shipping_address should be null
    const orderInsertCall = mocks.txExecute.mock.calls[0][0]
    expect(orderInsertCall.values).toContainEqual(null)
  })

  it('throws when items array is empty', async () => {
    await expect(
      createOrder({
        userId: 'user-1',
        items: [],
      })
    ).rejects.toThrow('Warenkorb ist leer')
  })

  it('throws when inventory item is not found', async () => {
    mocks.execute.mockResolvedValueOnce({
      rows: [],
    })

    await expect(
      createOrder({
        userId: 'user-1',
        items: [{ inventoryItemId: 'non-existent', quantity: 1 }],
      })
    ).rejects.toThrow('Artikel nicht gefunden')
  })

  it('throws when insufficient inventory', async () => {
    mocks.execute.mockResolvedValueOnce({
      rows: [{
        id: 'inv-1',
        selling_price_chf: 50,
        quantity_available: 1,
        product_name: 'Test Product',
      }],
    })

    await expect(
      createOrder({
        userId: 'user-1',
        items: [{ inventoryItemId: 'inv-1', quantity: 5 }],
      })
    ).rejects.toThrow('Nicht genügend Lagerbestand')
  })

  it('throws on database error', async () => {
    mocks.execute.mockRejectedValueOnce(new Error('DB connection failed'))

    await expect(
      createOrder({
        userId: 'user-1',
        items: [{ inventoryItemId: 'inv-1', quantity: 1 }],
        paymentTransactionId: 'txn_test',
      })
    ).rejects.toThrow('DB connection failed')
  })
})
