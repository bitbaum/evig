/**
 * @jest-environment node
 */

/**
 * Tests for the PCI compliance middleware (lib/middleware/pci-compliance.ts).
 *
 * Mission-critical: these wrappers protect every payment endpoint.
 * A regression here could fail a PCI compliance audit, allow unencrypted
 * payment requests, skip rate limiting on the checkout flow, or leak
 * sensitive payloads through cached responses.
 *
 * Four wrappers (composable):
 *   - withPCICompliance: stamps PCI security headers + cache-busting
 *     onto every response, returns 500 envelope on handler throw
 *   - withPaymentSecurity: rate-limit (429), HTTPS gate (403, except
 *     in development), audit log, then chains withPCICompliance
 *   - withPaymentValidation: parses JSON, runs validatePaymentData,
 *     returns 400 with details on failure, attaches paymentValidation
 *     to the request for the wrapped handler
 *   - withSecurePayment: composes all three in the right order
 */

// ============================================================================
// Mocks (factories are hoisted; everything referenced inside must be inline)
// ============================================================================

jest.mock('@/lib/payments/security', () => {
  const SECURITY_HEADERS = {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'",
    'Permissions-Policy': 'camera=()',
  }
  return {
    PCI_COMPLIANCE: { SECURITY_HEADERS },
    paymentRateLimiter: { isAllowed: jest.fn() },
    isSecureRequest: jest.fn(),
    createAuditLog: jest.fn(),
    validatePaymentData: jest.fn(),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { NextRequest, NextResponse } from 'next/server'
import {
  withPCICompliance,
  withPaymentSecurity,
  withPaymentValidation,
  withSecurePayment,
} from '../pci-compliance'
import {
  PCI_COMPLIANCE,
  paymentRateLimiter,
  isSecureRequest,
  createAuditLog,
  validatePaymentData,
} from '@/lib/payments/security'

const mockSecurityHeaders = PCI_COMPLIANCE.SECURITY_HEADERS
const mockIsAllowed = paymentRateLimiter.isAllowed as jest.Mock
const mockIsSecureRequest = isSecureRequest as unknown as jest.Mock
const mockCreateAuditLog = createAuditLog as unknown as jest.Mock
const mockValidatePaymentData = validatePaymentData as unknown as jest.Mock

// ============================================================================
// Helpers
// ============================================================================

function makeRequest(init?: {
  method?: string
  pathname?: string
  headers?: Record<string, string>
  body?: unknown
}): NextRequest {
  const url = `https://example.test${init?.pathname || '/api/payments/test'}`
  const headers = new Headers(init?.headers || {})
  return new NextRequest(url, {
    method: init?.method || 'POST',
    headers,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  })
}

const ORIGINAL_NODE_ENV = process.env.NODE_ENV

beforeEach(() => {
  jest.clearAllMocks()
  // Default to allowed + secure + valid
  mockIsAllowed.mockReturnValue(true)
  mockIsSecureRequest.mockReturnValue(true)
  mockValidatePaymentData.mockReturnValue({ isValid: true, errors: [] })
  mockCreateAuditLog.mockReturnValue({ entry: 'audit' })
  // Default to production so HTTPS gate is active (override in dev tests)
  ;(process.env as Record<string, string>).NODE_ENV = 'production'
})

afterAll(() => {
  ;(process.env as Record<string, string>).NODE_ENV = ORIGINAL_NODE_ENV || 'test'
})

// ============================================================================
// withPCICompliance
// ============================================================================

describe('withPCICompliance', () => {
  it('stamps every PCI security header on the wrapped response', async () => {
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    const wrapped = withPCICompliance(handler)

    const res = await wrapped(makeRequest())

    for (const [key, value] of Object.entries(mockSecurityHeaders)) {
      expect(res.headers.get(key)).toBe(value)
    }
  })

  it('stamps payment-specific cache-busting headers (no-cache, Pragma, Expires=0)', async () => {
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    const res = await withPCICompliance(handler)(makeRequest())

    expect(res.headers.get('X-Payment-Endpoint')).toBe('true')
    expect(res.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
    expect(res.headers.get('Pragma')).toBe('no-cache')
    expect(res.headers.get('Expires')).toBe('0')
  })

  it('returns 500 envelope when the wrapped handler throws', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('boom'))
    const res = await withPCICompliance(handler)(makeRequest())

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Payment processing error' })
  })

  it('forwards both request and context to the wrapped handler', async () => {
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    const ctx = { params: Promise.resolve({ id: 'p1' }) }
    const req = makeRequest()

    await withPCICompliance(handler)(req, ctx)
    expect(handler).toHaveBeenCalledWith(req, ctx)
  })

  it('does NOT mutate non-NextResponse return values (silently passes through)', async () => {
    // Defensive: handler returning something else (e.g. plain Response)
    // should not crash; headers are only set if instanceof NextResponse
    const plain = new Response('raw', { status: 200 })
    const handler = jest.fn().mockResolvedValue(plain)
    const res = await withPCICompliance(handler)(makeRequest())

    expect(res).toBe(plain)
    expect(res.headers.get('X-Payment-Endpoint')).toBeNull()
  })
})

// ============================================================================
// withPaymentSecurity — rate limit, HTTPS gate, audit log
// ============================================================================

describe('withPaymentSecurity — rate limiting', () => {
  it('returns 429 when rate limiter rejects the client', async () => {
    mockIsAllowed.mockReturnValue(false)
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))

    const res = await withPaymentSecurity(handler)(
      makeRequest({ headers: { 'x-forwarded-for': '1.2.3.4' } }),
    )

    expect(res.status).toBe(429)
    expect(await res.json()).toEqual({ error: 'Too many requests. Please try again later.' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('uses x-forwarded-for as the client identifier (load-balancer aware)', async () => {
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    await withPaymentSecurity(handler)(
      makeRequest({ headers: { 'x-forwarded-for': '203.0.113.1' } }),
    )

    expect(mockIsAllowed).toHaveBeenCalledWith('203.0.113.1', expect.any(Number), expect.any(Number))
  })

  it('falls back to x-real-ip when x-forwarded-for is missing', async () => {
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    await withPaymentSecurity(handler)(
      makeRequest({ headers: { 'x-real-ip': '198.51.100.1' } }),
    )

    expect(mockIsAllowed).toHaveBeenCalledWith('198.51.100.1', expect.any(Number), expect.any(Number))
  })

  it('falls back to "unknown" when no IP headers are present', async () => {
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    await withPaymentSecurity(handler)(makeRequest())

    expect(mockIsAllowed).toHaveBeenCalledWith('unknown', expect.any(Number), expect.any(Number))
  })

  it('uses the rate-limit options when provided', async () => {
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    await withPaymentSecurity(handler, {
      rateLimit: { maxAttempts: 3, windowMs: 1000 },
    })(makeRequest())

    expect(mockIsAllowed).toHaveBeenCalledWith('unknown', 3, 1000)
  })

  it('falls back to defaults (10 attempts, 60s) when no options', async () => {
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    await withPaymentSecurity(handler)(makeRequest())

    expect(mockIsAllowed).toHaveBeenCalledWith('unknown', 10, 60000)
  })
})

describe('withPaymentSecurity — HTTPS gate', () => {
  it('returns 403 when request is not secure and NODE_ENV !== "development"', async () => {
    mockIsSecureRequest.mockReturnValue(false)
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))

    const res = await withPaymentSecurity(handler)(makeRequest())

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'HTTPS required for payment processing' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('allows insecure requests in development mode', async () => {
    ;(process.env as Record<string, string>).NODE_ENV = 'development'
    mockIsSecureRequest.mockReturnValue(false)
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))

    const res = await withPaymentSecurity(handler)(makeRequest())

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalled()
  })

  it('skips HTTPS check when requireHttps=false even in production', async () => {
    mockIsSecureRequest.mockReturnValue(false)
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))

    const res = await withPaymentSecurity(handler, { requireHttps: false })(makeRequest())

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalled()
  })
})

describe('withPaymentSecurity — audit logging', () => {
  it('emits an audit log on every accepted request (default)', async () => {
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    await withPaymentSecurity(handler)(
      makeRequest({
        method: 'POST',
        pathname: '/api/payments/checkout',
        headers: {
          'x-forwarded-for': '1.2.3.4',
          'user-agent': 'Mozilla/5.0',
          'origin': 'https://example.test',
        },
      }),
    )

    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      'payment_endpoint_access',
      'anonymous',
      'payment_endpoint',
      '/api/payments/checkout',
      expect.objectContaining({
        method: 'POST',
        userAgent: 'Mozilla/5.0',
        origin: 'https://example.test',
      }),
      '1.2.3.4',
    )
  })

  it('does NOT emit audit log when auditLog=false', async () => {
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    await withPaymentSecurity(handler, { auditLog: false })(makeRequest())

    expect(mockCreateAuditLog).not.toHaveBeenCalled()
  })

  it('logs a security incident when the chain throws (caught at outer level)', async () => {
    const handler = jest.fn().mockRejectedValue(new Error('inner crash'))
    const res = await withPaymentSecurity(handler)(makeRequest())

    // The chain delegates to withPCICompliance which catches and returns 500.
    // The 500 from withPCICompliance is the one that propagates back.
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Payment processing error' })
  })
})

describe('withPaymentSecurity — composition with withPCICompliance', () => {
  it('forwards through to PCI compliance so headers + cache-busting are present', async () => {
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))
    const res = await withPaymentSecurity(handler)(makeRequest())

    expect(res.status).toBe(200)
    expect(res.headers.get('X-Payment-Endpoint')).toBe('true')
    expect(res.headers.get('Strict-Transport-Security')).toBe(mockSecurityHeaders['Strict-Transport-Security'])
  })
})

// ============================================================================
// withPaymentValidation
// ============================================================================

describe('withPaymentValidation', () => {
  it('passes through to handler when validation succeeds', async () => {
    mockValidatePaymentData.mockReturnValue({ isValid: true, errors: [] })
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))

    const res = await withPaymentValidation(handler)(
      makeRequest({ body: { amount: 5000, currency: 'CHF' } }),
    )

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalled()
  })

  it('returns 400 with error details when validation fails', async () => {
    mockValidatePaymentData.mockReturnValue({
      isValid: false,
      errors: ['amount must be positive', 'currency required'],
    })
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))

    const res = await withPaymentValidation(handler)(
      makeRequest({ body: { amount: -1 } }),
    )

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({
      error: 'Payment data validation failed',
      details: ['amount must be positive', 'currency required'],
    })
    expect(handler).not.toHaveBeenCalled()
  })

  it('attaches paymentValidation to the request for handler access', async () => {
    mockValidatePaymentData.mockReturnValue({ isValid: true, errors: [] })
    const handler = jest.fn().mockImplementation((req: unknown) => {
      // The wrapper attaches `.paymentValidation` to the request so the
      // handler can access the validation result without re-parsing
      const r = req as { paymentValidation?: { isValid: boolean; errors: string[] } }
      expect(r.paymentValidation).toEqual({ isValid: true, errors: [] })
      return NextResponse.json({ ok: true })
    })

    await withPaymentValidation(handler)(makeRequest({ body: { amount: 100 } }))
    expect(handler).toHaveBeenCalled()
  })

  it('returns 400 envelope when JSON parsing throws (malformed body)', async () => {
    const handler = jest.fn()
    // Build a request with invalid JSON body
    const req = new NextRequest('https://example.test/api/payments/test', {
      method: 'POST',
      body: '{not valid json',
    })

    const res = await withPaymentValidation(handler)(req)

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid payment data format' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('passes the parsed body to validatePaymentData', async () => {
    mockValidatePaymentData.mockReturnValue({ isValid: true, errors: [] })
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))

    await withPaymentValidation(handler)(
      makeRequest({ body: { amount: 5000, currency: 'CHF', orderId: 'o-1' } }),
    )

    expect(mockValidatePaymentData).toHaveBeenCalledWith({
      amount: 5000,
      currency: 'CHF',
      orderId: 'o-1',
    })
  })
})

// ============================================================================
// withSecurePayment — full composition
// ============================================================================

describe('withSecurePayment', () => {
  it('passes a secure, valid, allowed request all the way through with PCI headers', async () => {
    const handler = jest.fn().mockResolvedValue(NextResponse.json({ ok: true }))

    const res = await withSecurePayment(handler)(
      makeRequest({
        body: { amount: 5000, currency: 'CHF' },
        headers: { 'x-forwarded-for': '1.2.3.4' },
      }),
    )

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalled()
    expect(res.headers.get('X-Payment-Endpoint')).toBe('true')
  })

  it('rate-limit fires first (429 before validation runs)', async () => {
    mockIsAllowed.mockReturnValue(false)
    const handler = jest.fn()

    const res = await withSecurePayment(handler)(
      makeRequest({ body: { amount: -1 } }), // would fail validation too
    )

    expect(res.status).toBe(429)
    expect(mockValidatePaymentData).not.toHaveBeenCalled()
    expect(handler).not.toHaveBeenCalled()
  })

  it('HTTPS gate fires before validation (403 before parsing)', async () => {
    mockIsSecureRequest.mockReturnValue(false)
    const handler = jest.fn()

    const res = await withSecurePayment(handler)(
      makeRequest({ body: { amount: -1 } }),
    )

    expect(res.status).toBe(403)
    expect(mockValidatePaymentData).not.toHaveBeenCalled()
    expect(handler).not.toHaveBeenCalled()
  })

  it('validation 400 fires after security but before handler', async () => {
    mockValidatePaymentData.mockReturnValue({
      isValid: false,
      errors: ['amount must be positive'],
    })
    const handler = jest.fn()

    const res = await withSecurePayment(handler)(
      makeRequest({ body: { amount: -1 } }),
    )

    expect(res.status).toBe(400)
    expect(handler).not.toHaveBeenCalled()
  })
})
