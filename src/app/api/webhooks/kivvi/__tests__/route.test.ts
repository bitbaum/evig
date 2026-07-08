/**
 * @jest-environment node
 *
 * Tests for POST /api/webhooks/kivvi — inbound Kivvi ERP item-change receiver
 * (the REVERSE leg of the bidirectional product sync).
 *
 * Behaviors locked:
 *   - verifies X-Kivvi-Signature = hex HMAC-SHA256(rawBody, KIVVI_WEBHOOK_SECRET)
 *     → 401 on mismatch, 401 on missing signature, 401 when secret unset (fail closed)
 *   - 200 { ignored: true } when no local item matches data.id (never errors)
 *   - updated event → upserts sellingPriceChf / conditionOverride / conditionNotes
 *   - status_changed to a terminal status → sets local status + delists listing
 *   - never calls back into Kivvi (loop suppression: only direct db writes)
 */

import { createHmac } from 'crypto'

const SECRET = 'test-kivvi-secret'

// Mutable db state the chainable mock reads/records (prefixed `mock` for jest).
const mockDb = { rows: [] as Array<Record<string, unknown>>, updates: [] as Array<{ table: string; values: Record<string, unknown> }> }

jest.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => mockDb.rows,
        }),
      }),
    }),
    update: (table: { __t: string }) => ({
      set: (values: Record<string, unknown>) => ({
        where: async () => { mockDb.updates.push({ table: table.__t, values }) },
      }),
    }),
  },
}))

jest.mock('@/db/schema/inventory', () => ({
  inventoryItems: { __t: 'inventoryItems', id: 'ii_id', kivviInventoryItemId: 'ii_kivvi', status: 'ii_status' },
}))

jest.mock('@/db/schema/marketplace', () => ({
  listings: { __t: 'listings', inventoryItemId: 'l_inv', status: 'l_status' },
}))

jest.mock('@/config/marketplace', () => ({
  LISTING_STATUS: { ACTIVE: 'active', SOLD: 'sold', RESERVED: 'reserved', DRAFT: 'draft', REMOVED: 'removed' },
}))

jest.mock('drizzle-orm', () => ({
  eq: (a: unknown, b: unknown) => ({ __eq: [a, b] }),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_e: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 400 }),
    apiUnauthorized: (msg: string) => NextResponse.json({ success: false, error: msg }, { status: 401 }),
  }
})

import { NextRequest } from 'next/server'

function sign(rawBody: string, secret = SECRET): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex')
}

function makeReq(rawBody: string, signature?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (signature != null) headers['x-kivvi-signature'] = signature
  return new NextRequest('http://localhost/api/webhooks/kivvi', { method: 'POST', body: rawBody, headers })
}

// Load the route with the secret in place (captured at module eval time).
process.env.KIVVI_WEBHOOK_SECRET = SECRET
const { POST } = require('../route') as typeof import('../route')

beforeEach(() => {
  mockDb.rows = []
  mockDb.updates = []
})

describe('POST /api/webhooks/kivvi — signature verification', () => {
  it('returns 401 when the signature does not match the raw body', async () => {
    const raw = JSON.stringify({ event: 'inventory_item.updated', data: { id: 'kv-1' } })
    const res = await POST(makeReq(raw, sign(raw, 'wrong-secret')))
    expect(res.status).toBe(401)
    expect(mockDb.updates).toHaveLength(0)
  })

  it('returns 401 when the signature header is missing', async () => {
    const raw = JSON.stringify({ event: 'inventory_item.updated', data: { id: 'kv-1' } })
    const res = await POST(makeReq(raw, null))
    expect(res.status).toBe(401)
  })

  it('fails closed (401) when KIVVI_WEBHOOK_SECRET is not configured', async () => {
    const raw = JSON.stringify({ event: 'inventory_item.updated', data: { id: 'kv-1' } })
    let promise: Promise<Response> | undefined
    jest.isolateModules(() => {
      delete process.env.KIVVI_WEBHOOK_SECRET
      const mod = require('../route') as typeof import('../route')
      promise = mod.POST(makeReq(raw, sign(raw))) as unknown as Promise<Response>
    })
    process.env.KIVVI_WEBHOOK_SECRET = SECRET
    const res = await promise!
    expect(res.status).toBe(401)
  })
})

describe('POST /api/webhooks/kivvi — unknown item', () => {
  it('returns 200 { ignored: true } and writes nothing when no local item matches', async () => {
    mockDb.rows = [] // no match
    const raw = JSON.stringify({ event: 'inventory_item.updated', data: { id: 'kv-unknown', askingPrice: '10.00' } })
    const res = await POST(makeReq(raw, sign(raw)))
    expect(res.status).toBe(200)
    expect((await res.json()).data).toEqual({ ignored: true })
    expect(mockDb.updates).toHaveLength(0)
  })
})

describe('POST /api/webhooks/kivvi — field upsert (updated event)', () => {
  it('mirrors askingPrice → sellingPriceChf, condition → conditionOverride, description → conditionNotes', async () => {
    mockDb.rows = [{ id: 'inv-1', status: 'available' }]
    const raw = JSON.stringify({
      event: 'inventory_item.updated',
      data: { id: 'kv-1', description: 'Dell Latitude 7490', condition: 'like_new', status: 'ready_for_sale', askingPrice: '199.00' },
    })
    const res = await POST(makeReq(raw, sign(raw)))
    expect(res.status).toBe(200)

    const invUpdate = mockDb.updates.find(u => u.table === 'inventoryItems')
    expect(invUpdate?.values.sellingPriceChf).toBe('199.00')
    expect(invUpdate?.values.conditionOverride).toBe('like_new')
    expect(invUpdate?.values.conditionNotes).toBe('Dell Latitude 7490')
    // Non-terminal status → listing must NOT be delisted.
    expect(mockDb.updates.find(u => u.table === 'listings')).toBeUndefined()
  })
})

describe('POST /api/webhooks/kivvi — terminal status change', () => {
  it('sets local inventory status and delists the linked listing when sold', async () => {
    mockDb.rows = [{ id: 'inv-1', status: 'available' }]
    const raw = JSON.stringify({
      event: 'inventory_item.status_changed',
      data: { id: 'kv-1', itemNumber: 'KV-2026-001', status: 'sold' },
    })
    const res = await POST(makeReq(raw, sign(raw)))
    expect(res.status).toBe(200)

    const invUpdate = mockDb.updates.find(u => u.table === 'inventoryItems')
    const listingUpdate = mockDb.updates.find(u => u.table === 'listings')
    expect(invUpdate?.values.status).toBe('sold')
    expect(listingUpdate?.values.status).toBe('sold')
  })

  it('maps a recycled status to a local "missing" inventory status and delists', async () => {
    mockDb.rows = [{ id: 'inv-2', status: 'available' }]
    const raw = JSON.stringify({
      event: 'inventory_item.status_changed',
      data: { id: 'kv-2', itemNumber: 'KV-2026-002', status: 'recycled' },
    })
    const res = await POST(makeReq(raw, sign(raw)))
    expect(res.status).toBe(200)
    expect(mockDb.updates.find(u => u.table === 'inventoryItems')?.values.status).toBe('missing')
    expect(mockDb.updates.find(u => u.table === 'listings')?.values.status).toBe('sold')
  })
})
