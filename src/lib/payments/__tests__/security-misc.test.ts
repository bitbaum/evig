/**
 * Additional tests for payments/security.ts:
 *   - PCI_COMPLIANCE constant (security headers + retention policy)
 *   - generatePaymentReference (uniqueness + format)
 *   - createAuditLog (structured entry with mandatory fields, masking)
 *   - isSecureRequest (HTTPS enforcement, dev bypass)
 *
 * (maskSensitiveData / validatePaymentData / PaymentRateLimiter are
 * covered by security.test.ts in this same dir.)
 */

// Prevent the module-level setInterval from keeping Jest alive
jest.useFakeTimers()

import {
  PCI_COMPLIANCE,
  generatePaymentReference,
  createAuditLog,
  isSecureRequest,
} from '../security'

// ============================================================================
// PCI_COMPLIANCE constant — security headers
// ============================================================================

describe('PCI_COMPLIANCE.SECURITY_HEADERS', () => {
  it('includes HSTS with 1-year max-age + includeSubDomains', () => {
    expect(PCI_COMPLIANCE.SECURITY_HEADERS['Strict-Transport-Security']).toContain('max-age=31536000')
    expect(PCI_COMPLIANCE.SECURITY_HEADERS['Strict-Transport-Security']).toContain('includeSubDomains')
  })

  it('blocks MIME-type sniffing', () => {
    expect(PCI_COMPLIANCE.SECURITY_HEADERS['X-Content-Type-Options']).toBe('nosniff')
  })

  it('disallows iframe embedding (X-Frame-Options DENY)', () => {
    expect(PCI_COMPLIANCE.SECURITY_HEADERS['X-Frame-Options']).toBe('DENY')
  })

  it('enables legacy XSS-Protection in block mode', () => {
    expect(PCI_COMPLIANCE.SECURITY_HEADERS['X-XSS-Protection']).toBe('1; mode=block')
  })

  it('uses strict-origin-when-cross-origin referrer policy (privacy-preserving)', () => {
    expect(PCI_COMPLIANCE.SECURITY_HEADERS['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
  })

  it('CSP defaults to self for default-src + connect-src + frame-src', () => {
    const csp = PCI_COMPLIANCE.SECURITY_HEADERS['Content-Security-Policy']
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("connect-src 'self'")
    expect(csp).toContain("frame-src 'self'")
  })

  it('Permissions-Policy disables camera/microphone/geolocation', () => {
    const policy = PCI_COMPLIANCE.SECURITY_HEADERS['Permissions-Policy']
    expect(policy).toContain('camera=()')
    expect(policy).toContain('microphone=()')
    expect(policy).toContain('geolocation=()')
  })
})

describe('PCI_COMPLIANCE.DATA_RETENTION', () => {
  it('caps card data at 1 year (PCI DSS dispute-resolution window)', () => {
    expect(PCI_COMPLIANCE.DATA_RETENTION.CARD_DATA_MAX_DAYS).toBe(365)
  })

  it('caps in-memory sensitive data at 30 minutes', () => {
    expect(PCI_COMPLIANCE.DATA_RETENTION.SENSITIVE_DATA_MAX_MINUTES).toBe(30)
  })

  it('caps log retention at 1 year', () => {
    expect(PCI_COMPLIANCE.DATA_RETENTION.LOG_RETENTION_DAYS).toBe(365)
  })
})

// ============================================================================
// generatePaymentReference
// ============================================================================

describe('generatePaymentReference', () => {
  it('starts with the pmt_ prefix (so log greps work consistently)', () => {
    expect(generatePaymentReference()).toMatch(/^pmt_/)
  })

  it('has the expected length: pmt_ (4) + 32 hex chars (16 random bytes)', () => {
    const ref = generatePaymentReference()
    expect(ref).toHaveLength(4 + 32)
  })

  it('uses lowercase hex after the prefix', () => {
    const ref = generatePaymentReference()
    const body = ref.slice(4)
    expect(body).toMatch(/^[0-9a-f]+$/)
  })

  it('produces unique references on consecutive calls (collision check)', () => {
    const set = new Set<string>()
    for (let i = 0; i < 100; i++) set.add(generatePaymentReference())
    expect(set.size).toBe(100)
  })
})

// ============================================================================
// createAuditLog
// ============================================================================

describe('createAuditLog', () => {
  it('returns an entry with all mandatory fields', () => {
    const entry = createAuditLog('charge_attempt', 'user-1', 'payment', 'pay-42')
    expect(entry).toHaveProperty('timestamp')
    expect(entry).toHaveProperty('action', 'charge_attempt')
    expect(entry).toHaveProperty('userId', 'user-1')
    expect(entry).toHaveProperty('resourceType', 'payment')
    expect(entry).toHaveProperty('resourceId', 'pay-42')
    expect(entry).toHaveProperty('details')
    expect(entry).toHaveProperty('ipAddress')
    expect(entry).toHaveProperty('sessionId')
  })

  it('uses ISO 8601 timestamp', () => {
    const entry = createAuditLog('x', 'u', 'r', 'id')
    expect(() => new Date(entry.timestamp).toISOString()).not.toThrow()
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('defaults ipAddress to "unknown" when not provided', () => {
    const entry = createAuditLog('x', 'u', 'r', 'id')
    expect(entry.ipAddress).toBe('unknown')
  })

  it('uses provided ipAddress when given', () => {
    const entry = createAuditLog('x', 'u', 'r', 'id', {}, '203.0.113.7')
    expect(entry.ipAddress).toBe('203.0.113.7')
  })

  it('attaches a fresh sessionId per call (uses generatePaymentReference)', () => {
    const a = createAuditLog('x', 'u', 'r', 'id')
    const b = createAuditLog('x', 'u', 'r', 'id')
    expect(a.sessionId).not.toBe(b.sessionId)
    expect(a.sessionId).toMatch(/^pmt_/)
  })

  it('serializes details to JSON via maskSensitiveData (sensitive data masked in log)', () => {
    const entry = createAuditLog('x', 'u', 'r', 'id', {
      cardNumber: '4111111111111111',
      note: 'safe value',
    })
    // Card number must be masked — original 16-digit run absent
    expect(entry.details).not.toContain('4111111111111111')
    // Plain text survives
    expect(entry.details).toContain('safe value')
  })

  it('details defaults to {} when not passed (no JSON parse error)', () => {
    const entry = createAuditLog('x', 'u', 'r', 'id')
    expect(typeof entry.details).toBe('string')
    expect(() => JSON.parse(entry.details)).not.toThrow()
  })
})

// ============================================================================
// isSecureRequest
// ============================================================================

describe('isSecureRequest', () => {
  function reqUrl(url: string): Request {
    // jsdom doesn't ship Request — minimal stub satisfying the structural use
    return { url } as unknown as Request
  }

  const ORIGINAL_NODE_ENV = process.env.NODE_ENV

  afterEach(() => {
    ;(process.env as Record<string, string>).NODE_ENV = ORIGINAL_NODE_ENV ?? 'test'
  })

  it('accepts an HTTPS request', () => {
    expect(isSecureRequest(reqUrl('https://x.test/api'))).toBe(true)
  })

  it('rejects an HTTP request in non-development environment', () => {
    ;(process.env as Record<string, string>).NODE_ENV = 'production'
    expect(isSecureRequest(reqUrl('http://x.test/api'))).toBe(false)
  })

  it('rejects an HTTP request in test environment', () => {
    ;(process.env as Record<string, string>).NODE_ENV = 'test'
    expect(isSecureRequest(reqUrl('http://x.test/api'))).toBe(false)
  })

  it('accepts an HTTP request only when NODE_ENV=development (dev bypass)', () => {
    ;(process.env as Record<string, string>).NODE_ENV = 'development'
    expect(isSecureRequest(reqUrl('http://x.test/api'))).toBe(true)
  })

  it('still accepts HTTPS in development', () => {
    ;(process.env as Record<string, string>).NODE_ENV = 'development'
    expect(isSecureRequest(reqUrl('https://x.test/api'))).toBe(true)
  })
})
