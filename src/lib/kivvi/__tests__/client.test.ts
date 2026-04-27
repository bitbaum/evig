/**
 * Tests for kivvi/client.ts — Kivvi ERP API client.
 *
 * Mission-relevant: Kivvi is the canonical ERP system for RevampIT's
 * inventory accounting. syncToKivvi is called after every erfassung (device
 * intake). A bug that silently swallows errors, injects wrong warehouse IDs,
 * or fails to detect misconfiguration means inventory records diverge between
 * the RevampIT platform and the ERP — causing accounting errors.
 *
 * Behaviors locked:
 *   kivviFetch (tested through exported wrappers)
 *   - throws when KIVVI_API_URL or KIVVI_API_TOKEN are not set
 *   - includes Authorization Bearer header in every request
 *   - returns response data on { success: true }
 *   - throws with status + error message when API returns { success: false }
 *   - throws with status + error message when HTTP status is not ok
 *
 *   createKivviInventoryItem
 *   - sends POST /api/v1/inventory-items with JSON body
 *   - returns mapped KivviInventoryItem
 *
 *   syncToKivvi
 *   - returns { success: false, error: 'Kivvi not configured' } when env vars absent
 *   - injects KIVVI_DEFAULT_WAREHOUSE_ID when set and input has no warehouseId
 *   - does NOT inject warehouseId when input already provides one
 *   - returns { success: true, kivviInventoryItemId, itemNumber } on success
 *   - catches API errors and returns { success: false, error } (never throws)
 */

// ---------------------------------------------------------------------------
// fetch mock
// ---------------------------------------------------------------------------

const mockFetch = jest.fn()
global.fetch = mockFetch

function mockFetchResponse(data: unknown, ok = true, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    json: jest.fn().mockResolvedValue(
      ok
        ? { success: true, data }
        : { success: false, error: `Mock error ${status}` }
    ),
  })
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeKivviItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'kv-item-1',
    itemNumber: 'KV-2026-001',
    description: 'ThinkPad T480',
    condition: 'good',
    status: 'intake',
    warehouseId: 'wh-1',
    askingPrice: '199.00',
    estimatedValue: '180.00',
    minPrice: '150.00',
    specs: null,
    serialNumber: null,
    location: null,
    createdAt: '2026-04-27T10:00:00Z',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Env setup
// ---------------------------------------------------------------------------

const ENV_URL = 'https://kivvi.example.com'
const ENV_TOKEN = 'kv_test_token_12345'

beforeEach(() => {
  jest.clearAllMocks()
  process.env.KIVVI_API_URL = ENV_URL
  process.env.KIVVI_API_TOKEN = ENV_TOKEN
  delete process.env.KIVVI_DEFAULT_WAREHOUSE_ID
})

afterEach(() => {
  delete process.env.KIVVI_API_URL
  delete process.env.KIVVI_API_TOKEN
  delete process.env.KIVVI_DEFAULT_WAREHOUSE_ID
})

// ---------------------------------------------------------------------------
// Imports (after mock and env setup — must come after global.fetch assignment)
// ---------------------------------------------------------------------------

import {
  createKivviInventoryItem,
  updateKivviInventoryItem,
  getKivviInventoryItem,
  createKivviInvoice,
  syncToKivvi,
} from '../client'

// ============================================================================
// kivviFetch — configuration
// ============================================================================

describe('kivviFetch — configuration errors', () => {
  it('throws when KIVVI_API_URL is not set', async () => {
    delete process.env.KIVVI_API_URL

    await expect(
      createKivviInventoryItem({ description: 'Laptop' }),
    ).rejects.toThrow('Kivvi integration not configured')
  })

  it('throws when KIVVI_API_TOKEN is not set', async () => {
    delete process.env.KIVVI_API_TOKEN

    await expect(
      createKivviInventoryItem({ description: 'Laptop' }),
    ).rejects.toThrow('Kivvi integration not configured')
  })
})

// ============================================================================
// kivviFetch — HTTP behavior
// ============================================================================

describe('kivviFetch — HTTP behavior', () => {
  it('includes Authorization Bearer header in every request', async () => {
    mockFetchResponse(makeKivviItem())

    await createKivviInventoryItem({ description: 'Laptop' })

    const [, options] = mockFetch.mock.calls[0]
    expect(options.headers.Authorization).toBe(`Bearer ${ENV_TOKEN}`)
  })

  it('uses the configured base URL', async () => {
    mockFetchResponse(makeKivviItem())

    await createKivviInventoryItem({ description: 'Laptop' })

    const [url] = mockFetch.mock.calls[0]
    expect(url).toMatch(`${ENV_URL}/api/v1/`)
  })

  it('throws with status + error when API returns { success: false }', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: false, error: 'Item not found' }),
    })

    await expect(createKivviInventoryItem({ description: 'x' })).rejects.toThrow(
      'Kivvi API error (200): Item not found',
    )
  })

  it('throws with status + fallback message when HTTP is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: jest.fn().mockResolvedValue({ success: false }),
    })

    await expect(createKivviInventoryItem({ description: 'x' })).rejects.toThrow('422')
  })
})

// ============================================================================
// createKivviInventoryItem
// ============================================================================

describe('createKivviInventoryItem', () => {
  it('sends POST to /api/v1/inventory-items', async () => {
    mockFetchResponse(makeKivviItem())

    await createKivviInventoryItem({ description: 'ThinkPad T480', condition: 'good' })

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/v1/inventory-items')
    expect(options.method).toBe('POST')
  })

  it('returns the KivviInventoryItem from response data', async () => {
    mockFetchResponse(makeKivviItem())

    const result = await createKivviInventoryItem({ description: 'ThinkPad T480' })

    expect(result.id).toBe('kv-item-1')
    expect(result.itemNumber).toBe('KV-2026-001')
  })
})

// ============================================================================
// updateKivviInventoryItem
// ============================================================================

describe('updateKivviInventoryItem', () => {
  it('sends PATCH to /api/v1/inventory-items/:id', async () => {
    mockFetchResponse(makeKivviItem({ status: 'ready_for_sale' }))

    await updateKivviInventoryItem('kv-item-1', { status: 'ready_for_sale' })

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/inventory-items/kv-item-1')
    expect(options.method).toBe('PATCH')
  })
})

// ============================================================================
// getKivviInventoryItem
// ============================================================================

describe('getKivviInventoryItem', () => {
  it('sends GET to /api/v1/inventory-items/:id', async () => {
    mockFetchResponse(makeKivviItem())

    await getKivviInventoryItem('kv-item-1')

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/inventory-items/kv-item-1')
    expect(options.method).toBeUndefined() // GET is the default
  })
})

// ============================================================================
// createKivviInvoice
// ============================================================================

describe('createKivviInvoice', () => {
  it('sends POST to /api/v1/documents with type: invoice injected', async () => {
    const doc = { id: 'doc-1', number: 'RE-001', type: 'invoice', status: 'draft', total: '199.00', currency: 'CHF' }
    mockFetchResponse(doc)

    await createKivviInvoice({
      contactName: 'Alice Müller',
      items: [{ description: 'ThinkPad', quantity: '1', unitPrice: '199.00' }],
    })

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toContain('/api/v1/documents')
    expect(options.method).toBe('POST')
    const body = JSON.parse(options.body)
    expect(body.type).toBe('invoice')
    expect(body.contactName).toBe('Alice Müller')
  })
})

// ============================================================================
// syncToKivvi
// ============================================================================

describe('syncToKivvi', () => {
  it('returns { success: false } when KIVVI_API_URL is not configured', async () => {
    delete process.env.KIVVI_API_URL

    const result = await syncToKivvi({ description: 'Laptop' })

    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toBe('Kivvi not configured')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns { success: false } when KIVVI_API_TOKEN is not configured', async () => {
    delete process.env.KIVVI_API_TOKEN

    const result = await syncToKivvi({ description: 'Laptop' })

    expect(result.success).toBe(false)
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('injects KIVVI_DEFAULT_WAREHOUSE_ID when set and input has no warehouseId', async () => {
    process.env.KIVVI_DEFAULT_WAREHOUSE_ID = 'wh-default'
    mockFetchResponse(makeKivviItem({ warehouseId: 'wh-default' }))

    await syncToKivvi({ description: 'Laptop' })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.warehouseId).toBe('wh-default')
  })

  it('does NOT inject default warehouseId when input already provides one', async () => {
    process.env.KIVVI_DEFAULT_WAREHOUSE_ID = 'wh-default'
    mockFetchResponse(makeKivviItem({ warehouseId: 'wh-custom' }))

    await syncToKivvi({ description: 'Laptop', warehouseId: 'wh-custom' })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.warehouseId).toBe('wh-custom')
  })

  it('returns { success: true, kivviInventoryItemId, itemNumber } on success', async () => {
    mockFetchResponse(makeKivviItem())

    const result = await syncToKivvi({ description: 'ThinkPad T480' })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.kivviInventoryItemId).toBe('kv-item-1')
      expect(result.itemNumber).toBe('KV-2026-001')
    }
  })

  it('catches API error and returns { success: false, error } without throwing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ success: false, error: 'Internal server error' }),
    })

    const result = await syncToKivvi({ description: 'Laptop' })

    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toContain('500')
  })

  it('catches network error and returns { success: false, error } without throwing', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network timeout'))

    const result = await syncToKivvi({ description: 'Laptop' })

    expect(result.success).toBe(false)
    expect((result as { error: string }).error).toBe('network timeout')
  })
})
