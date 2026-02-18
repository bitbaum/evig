/**
 * Tests for order-service.ts
 *
 * Tests order creation with mocked database and Medusa API calls.
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

jest.mock('@/config/medusa', () => ({
  MEDUSA_CONFIG: {
    URL: 'http://localhost:9000',
    PUBLISHABLE_KEY: 'pk_test',
  },
}))

import { createOrder } from '../order-service'
import type { CreateOrderParams, ShippingAddress } from '../order-service'
import { query } from '@/lib/auth/db'

const mockQuery = query as jest.MockedFunction<typeof query>

// Helper to build a mock Medusa cart response
function mockCartResponse(items = [{ id: 'item-1', title: 'Test Product', quantity: 1, unit_price: 5000, subtotal: 5000, variant_id: 'var-1', variant: { id: 'var-1', sku: 'SKU-1' } }]) {
  return {
    ok: true,
    json: async () => ({
      cart: {
        id: 'cart-1',
        items,
        total: items.reduce((sum, i) => sum + i.subtotal, 0),
        subtotal: items.reduce((sum, i) => sum + i.subtotal, 0),
        tax_total: 0,
      },
    }),
  }
}

describe('createOrder', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    mockQuery.mockReset()
    global.fetch = jest.fn()
  })

  afterAll(() => {
    global.fetch = originalFetch
  })

  it('creates an order with real cart data and returns id + timestamp', async () => {
    // Mock Medusa cart fetch
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockCartResponse())

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
      cartId: 'cart-1',
      paymentIntentId: 'pi_test123',
    }

    const result = await createOrder(params)
    expect(result.orderId).toBe('order-1')
    expect(result.createdAt).toBe('2024-01-15T10:00:00Z')

    // Verify Medusa was called
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:9000/store/carts/cart-1',
      expect.objectContaining({ headers: expect.any(Object) }),
    )

    // order insert + order_item insert + inventory decrement
    expect(mockQuery).toHaveBeenCalledTimes(3)
  })

  it('includes shipping address when provided', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockCartResponse())
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'order-2', created_at: '2024-01-15' }],
      rowCount: 1,
    } as never)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as never)
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

    // Verify shipping address was JSON-serialized in the order insert
    const insertCall = mockQuery.mock.calls[0]
    const params = insertCall[1] as unknown[]
    expect(params[3]).toBe(JSON.stringify(address))
  })

  it('passes null when no shipping address', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockCartResponse())
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'order-3', created_at: '2024-01-15' }],
      rowCount: 1,
    } as never)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as never)
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

  it('throws when cart is empty or not found', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    await expect(
      createOrder({
        userId: 'user-1',
        cartId: 'cart-1',
        paymentIntentId: 'pi_test',
      })
    ).rejects.toThrow('Warenkorb ist leer oder nicht gefunden')
  })

  it('throws on database error', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockCartResponse())
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
