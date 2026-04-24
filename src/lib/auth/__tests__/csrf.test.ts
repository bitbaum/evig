/**
 * Tests for CSRF protection pure utility functions.
 *
 * Covers the synchronous helpers that determine which paths and methods
 * are CSRF-protected. Bugs here = security vulnerabilities.
 */

// csrf.ts imports NextRequest/NextResponse from next/server which needs Request global.
// Mock the entire module import — we only test the pure utility exports.
jest.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: jest.fn(),
  },
}))

import { isExcludedPath, requiresCsrfProtection, getCsrfFromCookies, generateCsrfToken } from '../csrf'

// ============================================================================
// isExcludedPath
// ============================================================================

describe('isExcludedPath', () => {
  it('excludes webhook paths', () => {
    expect(isExcludedPath('/api/webhooks/stripe')).toBe(true)
    expect(isExcludedPath('/api/webhooks/payrexx')).toBe(true)
  })

  it('excludes exact Payrexx webhook path', () => {
    expect(isExcludedPath('/api/payments/payrexx-webhook')).toBe(true)
  })

  it('excludes generic payment webhook path', () => {
    expect(isExcludedPath('/api/payments/webhook')).toBe(true)
  })

  it('protects normal API routes', () => {
    expect(isExcludedPath('/api/marketplace/orders')).toBe(false)
    expect(isExcludedPath('/api/listings')).toBe(false)
    expect(isExcludedPath('/api/users')).toBe(false)
  })

  it('protects non-API routes', () => {
    expect(isExcludedPath('/dashboard')).toBe(false)
    expect(isExcludedPath('/')).toBe(false)
  })

  it('does not exclude partial matches (e.g., /api/payment is not /api/payments/webhook)', () => {
    expect(isExcludedPath('/api/payment')).toBe(false)
    expect(isExcludedPath('/api/payments/create')).toBe(false)
  })
})

// ============================================================================
// requiresCsrfProtection
// ============================================================================

describe('requiresCsrfProtection', () => {
  it('requires protection for POST', () => {
    expect(requiresCsrfProtection('POST')).toBe(true)
    expect(requiresCsrfProtection('post')).toBe(true) // case-insensitive
  })

  it('requires protection for PUT', () => {
    expect(requiresCsrfProtection('PUT')).toBe(true)
    expect(requiresCsrfProtection('put')).toBe(true)
  })

  it('requires protection for PATCH', () => {
    expect(requiresCsrfProtection('PATCH')).toBe(true)
  })

  it('requires protection for DELETE', () => {
    expect(requiresCsrfProtection('DELETE')).toBe(true)
  })

  it('does NOT require protection for GET', () => {
    expect(requiresCsrfProtection('GET')).toBe(false)
  })

  it('does NOT require protection for HEAD', () => {
    expect(requiresCsrfProtection('HEAD')).toBe(false)
  })

  it('does NOT require protection for OPTIONS', () => {
    expect(requiresCsrfProtection('OPTIONS')).toBe(false)
  })
})

// ============================================================================
// getCsrfFromCookies
// ============================================================================

describe('getCsrfFromCookies', () => {
  it('returns null for null input', () => {
    expect(getCsrfFromCookies(null)).toBeNull()
  })

  it('returns null for empty cookie string', () => {
    expect(getCsrfFromCookies('')).toBeNull()
  })

  it('extracts CSRF token from cookie header (dev name)', () => {
    // In non-production (test env), cookie name is 'csrf'
    const result = getCsrfFromCookies('csrf=abc123; session=xyz')
    expect(result).toBe('abc123')
  })

  it('returns null when CSRF cookie is absent', () => {
    const result = getCsrfFromCookies('session=xyz; other=value')
    expect(result).toBeNull()
  })

  it('handles single cookie correctly', () => {
    const result = getCsrfFromCookies('csrf=token999')
    expect(result).toBe('token999')
  })
})

// ============================================================================
// generateCsrfToken
// ============================================================================

describe('generateCsrfToken', () => {
  it('returns a 64-character hex string (32 bytes × 2 hex chars)', () => {
    const token = generateCsrfToken()
    expect(token).toMatch(/^[0-9a-f]{64}$/)
  })

  it('generates unique tokens each call', () => {
    const tokens = new Set(Array.from({ length: 10 }, () => generateCsrfToken()))
    expect(tokens.size).toBe(10)
  })
})
