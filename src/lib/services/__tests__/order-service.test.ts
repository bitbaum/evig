/**
 * Tests for order-service.ts
 *
 * Tests order creation with mocked database queries.
 */

// Mock next/server
jest.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      json: () => data,
      status: init?.status || 200,
    }),
  },
}))

jest.mock('@/lib/auth/db', () => ({
  query: jest.fn(),
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
import { query } from '@/lib/auth/db'

const mockQuery = query as jest.MockedFunction<typeof query>

describe('createOrder', () => {
  beforeEach(() => {
    mockQuery.mockReset()
  })

  it('creates an order with inventory items and returns id + timestamp', async () => {
    // Mock: SELECT inventory_items JOIN ai_extracted_products
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'inv-1',
        selling_price_chf: 50,
        quantity_available: 10,
        product_name: 'Test Product',
      }],
      rowCount: 1,
    } as never)

    // Mock: INSERT INTO orders
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'order-1', created_at: '2024-01-15T10:00:00Z' }],
      rowCount: 1,
    } as never)

    // Mock: INSERT INTO order_items
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as never)

    // Mock: UPDATE inventory_items (decrement)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as never)

    const params: CreateOrderParams = {
      userId: 'user-1',
      items: [{ inventoryItemId: 'inv-1', quantity: 1 }],
      paymentTransactionId: 'txn_test123',
    }

    const result = await createOrder(params)
    expect(result.orderId).toBe('order-1')
    expect(result.createdAt).toBe('2024-01-15T10:00:00Z')

    // inventory lookup + order insert + order_item insert + inventory decrement
    expect(mockQuery).toHaveBeenCalledTimes(4)
  })

  it('includes shipping address when provided', async () => {
    // Mock: inventory lookup
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'inv-1',
        selling_price_chf: 50,
        quantity_available: 10,
        product_name: 'Test Product',
      }],
      rowCount: 1,
    } as never)

    // Mock: INSERT INTO orders
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'order-2', created_at: '2024-01-15' }],
      rowCount: 1,
    } as never)

    // Mock: INSERT INTO order_items
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as never)

    // Mock: UPDATE inventory_items (decrement)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as never)

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

    // Verify shipping address was JSON-serialized in the order insert (2nd query call)
    const insertCall = mockQuery.mock.calls[1]
    const params = insertCall[1] as unknown[]
    expect(params[3]).toBe(JSON.stringify(address))
  })

  it('passes null when no shipping address', async () => {
    // Mock: inventory lookup
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'inv-1',
        selling_price_chf: 50,
        quantity_available: 10,
        product_name: 'Test Product',
      }],
      rowCount: 1,
    } as never)

    // Mock: INSERT INTO orders
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'order-3', created_at: '2024-01-15' }],
      rowCount: 1,
    } as never)

    // Mock: INSERT INTO order_items
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as never)

    // Mock: UPDATE inventory_items (decrement)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as never)

    await createOrder({
      userId: 'user-1',
      items: [{ inventoryItemId: 'inv-1', quantity: 1 }],
      paymentTransactionId: 'txn_test',
    })

    // Order insert is the 2nd query call
    const insertCall = mockQuery.mock.calls[1]
    const params = insertCall[1] as unknown[]
    expect(params[3]).toBeNull()
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
    // Mock: inventory lookup returns empty
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as never)

    await expect(
      createOrder({
        userId: 'user-1',
        items: [{ inventoryItemId: 'non-existent', quantity: 1 }],
      })
    ).rejects.toThrow('Artikel nicht gefunden')
  })

  it('throws when insufficient inventory', async () => {
    // Mock: inventory lookup with low quantity
    mockQuery.mockResolvedValueOnce({
      rows: [{
        id: 'inv-1',
        selling_price_chf: 50,
        quantity_available: 1,
        product_name: 'Test Product',
      }],
      rowCount: 1,
    } as never)

    await expect(
      createOrder({
        userId: 'user-1',
        items: [{ inventoryItemId: 'inv-1', quantity: 5 }],
      })
    ).rejects.toThrow('Nicht genügend Lagerbestand')
  })

  it('throws on database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection failed'))

    await expect(
      createOrder({
        userId: 'user-1',
        items: [{ inventoryItemId: 'inv-1', quantity: 1 }],
        paymentTransactionId: 'txn_test',
      })
    ).rejects.toThrow('DB connection failed')
  })
})
