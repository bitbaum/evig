/**
 * Tests for order-service.ts
 *
 * Tests order creation with mocked database calls.
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

  it('creates an order and returns id + timestamp', async () => {
    // Mock: INSERT INTO orders
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'order-1', created_at: '2024-01-15T10:00:00Z' }],
      rowCount: 1,
    } as never)
    // Mock: INSERT INTO order_items
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as never)

    const params: CreateOrderParams = {
      userId: 'user-1',
      cartId: 'cart-1',
      paymentIntentId: 'pi_test123',
    }

    const result = await createOrder(params)
    expect(result.orderId).toBe('order-1')
    expect(result.createdAt).toBe('2024-01-15T10:00:00Z')
    expect(mockQuery).toHaveBeenCalledTimes(2)
  })

  it('includes shipping address when provided', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'order-2', created_at: '2024-01-15' }],
      rowCount: 1,
    } as never)
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
      cartId: 'cart-1',
      paymentIntentId: 'pi_test',
      shippingAddress: address,
    })

    // Verify shipping address was JSON-serialized
    const insertCall = mockQuery.mock.calls[0]
    const params = insertCall[1] as unknown[]
    expect(params[3]).toBe(JSON.stringify(address))
  })

  it('passes null when no shipping address', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'order-3', created_at: '2024-01-15' }],
      rowCount: 1,
    } as never)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as never)

    await createOrder({
      userId: 'user-1',
      cartId: 'cart-1',
      paymentIntentId: 'pi_test',
    })

    const insertCall = mockQuery.mock.calls[0]
    const params = insertCall[1] as unknown[]
    expect(params[3]).toBeNull()
  })

  it('throws on database error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB connection failed'))

    await expect(
      createOrder({
        userId: 'user-1',
        cartId: 'cart-1',
        paymentIntentId: 'pi_test',
      })
    ).rejects.toThrow('DB connection failed')
  })
})
