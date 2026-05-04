/**
 * Tests for response helpers in lib/api/helpers.ts
 *
 * Every API route in the codebase (700+ usages) returns through these
 * helpers. They look like trivial wrappers around NextResponse.json,
 * but the envelope shape (success / error / data), status codes, and
 * extra headers (Cache-Control, Retry-After, X-RateLimit-*) are the
 * exact contract the apiFetch client + the rest of the system depend on.
 *
 * Tests verify each helper's call to NextResponse.json by capturing
 * the body and init args from the jest mock.
 */

// Mock next/server BEFORE importing helpers. Jest hoists `jest.mock()`
// above all imports, so we cannot reference outer variables in the
// factory — must define jest.fn() inline.
jest.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: { json: jest.fn().mockReturnValue('mocked-response') },
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}))

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import {
  apiSuccess,
  apiSuccessCached,
  apiError,
  apiNotFound,
  apiUnauthorized,
  apiForbidden,
  apiRateLimited,
  apiBadRequest,
} from '../helpers'
import { ERROR_MESSAGES } from '@/config/error-messages'

const mockJson = NextResponse.json as jest.Mock
const mockLoggerError = logger.error as jest.Mock

beforeEach(() => {
  mockJson.mockClear()
  mockLoggerError.mockClear()
})

// Utility: extract the (body, init) the helper passed to NextResponse.json
function lastCall(): { body: Record<string, unknown>; init: { status: number; headers?: Record<string, string> } } {
  const calls = mockJson.mock.calls
  expect(calls.length).toBeGreaterThan(0)
  const [body, init] = calls[calls.length - 1]
  return { body, init }
}

// ============================================================================
// apiSuccess
// ============================================================================

describe('apiSuccess', () => {
  it('wraps data in { success: true, data } at status 200', () => {
    apiSuccess({ id: 1, name: 'X' })
    const { body, init } = lastCall()
    expect(body).toEqual({ success: true, data: { id: 1, name: 'X' } })
    expect(init.status).toBe(200)
  })

  it('accepts an array directly as data (lists)', () => {
    apiSuccess([1, 2, 3])
    const { body } = lastCall()
    expect(body).toEqual({ success: true, data: [1, 2, 3] })
  })

  it('accepts a custom status (e.g. 201 Created)', () => {
    apiSuccess({ id: 'new' }, 201)
    const { init } = lastCall()
    expect(init.status).toBe(201)
  })

  it('accepts null as data', () => {
    apiSuccess(null)
    const { body } = lastCall()
    expect(body).toEqual({ success: true, data: null })
  })
})

// ============================================================================
// apiSuccessCached
// ============================================================================

describe('apiSuccessCached', () => {
  it('sets default Cache-Control with maxAge=300, swr=60', () => {
    apiSuccessCached({ id: 1 })
    const { init } = lastCall()
    expect(init.headers?.['Cache-Control']).toBe('public, s-maxage=300, stale-while-revalidate=60')
    expect(init.status).toBe(200)
  })

  it('honours custom maxAge and staleWhileRevalidate', () => {
    apiSuccessCached({ id: 1 }, 600, 120)
    const { init } = lastCall()
    expect(init.headers?.['Cache-Control']).toBe('public, s-maxage=600, stale-while-revalidate=120')
  })

  it('still produces the standard success envelope', () => {
    apiSuccessCached([1, 2])
    const { body } = lastCall()
    expect(body).toEqual({ success: true, data: [1, 2] })
  })
})

// ============================================================================
// apiError
// ============================================================================

describe('apiError', () => {
  it('returns { success: false, error } at status 500 by default', () => {
    apiError(new Error('boom'), 'Server-Fehler')
    const { body, init } = lastCall()
    expect(body).toEqual({ success: false, error: 'Server-Fehler' })
    expect(init.status).toBe(500)
  })

  it('logs the error with the user-facing message as the log message', () => {
    const err = new Error('database timeout')
    apiError(err, 'Konnte nicht gespeichert werden')
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Konnte nicht gespeichert werden',
      { error: err },
    )
  })

  it('does not surface the raw error to the response body', () => {
    apiError(new Error('SECRET internal stack trace'), 'Generic message')
    const { body } = lastCall()
    expect(body.error).toBe('Generic message')
    expect(JSON.stringify(body)).not.toContain('SECRET')
  })

  it('accepts a custom status code', () => {
    apiError(new Error('x'), 'Service down', 503)
    const { init } = lastCall()
    expect(init.status).toBe(503)
  })
})

// ============================================================================
// apiNotFound
// ============================================================================

describe('apiNotFound', () => {
  it('produces a 404 with "<resource> nicht gefunden"', () => {
    apiNotFound('Produkt')
    const { body, init } = lastCall()
    expect(init.status).toBe(404)
    // ERROR_MESSAGES.NOT_FOUND is German per the i18n setup
    expect(body.error).toContain('Produkt')
    expect(body.success).toBe(false)
  })
})

// ============================================================================
// apiUnauthorized
// ============================================================================

describe('apiUnauthorized', () => {
  it('returns 401 with default unauthorized message', () => {
    apiUnauthorized()
    const { body, init } = lastCall()
    expect(init.status).toBe(401)
    expect(body.success).toBe(false)
    expect(body.error).toBeTruthy()
  })

  it('honours a custom message', () => {
    apiUnauthorized('Anmeldung erforderlich')
    const { body } = lastCall()
    expect(body.error).toBe('Anmeldung erforderlich')
  })
})

// ============================================================================
// apiForbidden
// ============================================================================

describe('apiForbidden', () => {
  it('returns 403 with default "Forbidden"', () => {
    apiForbidden()
    const { body, init } = lastCall()
    expect(init.status).toBe(403)
    expect(body).toEqual({ success: false, error: 'Forbidden' })
  })

  it('accepts a custom message', () => {
    apiForbidden('Nur für Staff verfügbar')
    const { body } = lastCall()
    expect(body.error).toBe('Nur für Staff verfügbar')
  })
})

// ============================================================================
// apiRateLimited
// ============================================================================

describe('apiRateLimited', () => {
  it('returns 429 with default message and Retry-After: 60', () => {
    apiRateLimited()
    const { body, init } = lastCall()
    expect(init.status).toBe(429)
    expect(init.headers?.['Retry-After']).toBe('60')
    expect(body.success).toBe(false)
    expect(body.retryAfter).toBe(60)
  })

  it('honours custom retryAfter (header + body)', () => {
    apiRateLimited(ERROR_MESSAGES.RATE_LIMITED,{ retryAfter: 120 })
    const { body, init } = lastCall()
    expect(init.headers?.['Retry-After']).toBe('120')
    expect(body.retryAfter).toBe(120)
  })

  it('adds X-RateLimit-Remaining when provided', () => {
    apiRateLimited(ERROR_MESSAGES.RATE_LIMITED,{ remaining: 5 })
    const { init } = lastCall()
    expect(init.headers?.['X-RateLimit-Remaining']).toBe('5')
  })

  it('adds X-RateLimit-Reset when provided', () => {
    apiRateLimited(ERROR_MESSAGES.RATE_LIMITED,{ resetAt: 1700000000 })
    const { init } = lastCall()
    expect(init.headers?.['X-RateLimit-Reset']).toBe('1700000000')
  })

  it('uses German default message', () => {
    apiRateLimited()
    const { body } = lastCall()
    expect(body.error).toContain('Zu viele Anfragen')
  })
})

// ============================================================================
// apiBadRequest
// ============================================================================

describe('apiBadRequest', () => {
  it('returns 400 with the supplied message', () => {
    apiBadRequest('Ungültige Eingabe')
    const { body, init } = lastCall()
    expect(init.status).toBe(400)
    expect(body).toEqual({ success: false, error: 'Ungültige Eingabe' })
  })

  it('attaches per-field errors when provided', () => {
    apiBadRequest('Validierung fehlgeschlagen', { email: ['Ungültige E-Mail'] })
    const { body } = lastCall()
    expect(body).toEqual({
      success: false,
      error: 'Validierung fehlgeschlagen',
      errors: { email: ['Ungültige E-Mail'] },
    })
  })

  it('omits the errors field when not provided (no empty key)', () => {
    apiBadRequest('Bad')
    const { body } = lastCall()
    expect(Object.keys(body)).not.toContain('errors')
  })
})
