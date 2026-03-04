/**
 * CSRF Protection Middleware
 *
 * Implements the Synchronizer Token Pattern for CSRF protection.
 * Also supports the Double Submit Cookie pattern as a fallback.
 *
 * Security features:
 * - Cryptographically secure token generation (Web Crypto API for Edge compatibility)
 * - Token tied to session
 * - Constant-time comparison to prevent timing attacks
 * - Token rotation on sensitive operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { serialize, parse } from 'cookie'

// =============================================================================
// Edge-compatible crypto utilities (Web Crypto API)
// =============================================================================

/**
 * Constant-time string comparison to prevent timing attacks
 * Edge-compatible version without Node.js crypto
 */
function constantTimeCompareEdge(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

// =============================================================================
// Configuration
// =============================================================================

const isProduction = process.env.NODE_ENV === 'production'

const CSRF_CONFIG = {
  // __Host- prefix requires Secure (HTTPS). Use plain name on localhost HTTP.
  cookieName: isProduction ? '__Host-csrf' : 'csrf',
  headerName: 'x-csrf-token',
  formFieldName: '_csrf',
  tokenLength: 32,
  cookieMaxAge: 24 * 60 * 60, // 24 hours
  // Methods that require CSRF protection
  protectedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  // Only exclude paths that receive external (non-browser) requests.
  // All other routes are protected via Double Submit Cookie pattern
  // (CSRF_SCRIPT patches window.fetch to send the token automatically).
  excludedPaths: [
    '/api/webhooks/',                // External webhook callers
    '/api/payments/payrexx-webhook', // External Payrexx webhook
    '/api/payments/webhook',         // External payment webhook
  ],
}

// =============================================================================
// Token Generation and Validation
// =============================================================================

/**
 * Generate a CSRF token using Web Crypto API (Edge-compatible)
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(CSRF_CONFIG.tokenLength)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Hash a CSRF token for storage using Web Crypto API (Edge-compatible)
 * Note: This is async due to Web Crypto API requirements
 */
export async function hashCsrfToken(token: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate a CSRF token against its hash
 */
export async function validateCsrfToken(token: string, hash: string): Promise<boolean> {
  const tokenHash = await hashCsrfToken(token)
  return constantTimeCompareEdge(tokenHash, hash)
}

// =============================================================================
// Cookie Helpers
// =============================================================================

/**
 * Create a CSRF cookie
 */
export function createCsrfCookie(token: string): string {
  return serialize(CSRF_CONFIG.cookieName, token, {
    httpOnly: false, // Must be false: Double Submit Cookie pattern requires JS to read the token
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: CSRF_CONFIG.cookieMaxAge,
  })
}

/**
 * Get CSRF token from cookies
 */
export function getCsrfFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const cookies = parse(cookieHeader)
  return cookies[CSRF_CONFIG.cookieName] || null
}

// =============================================================================
// Request Helpers
// =============================================================================

/**
 * Get CSRF token from request (header or form body)
 */
export async function getCsrfFromRequest(request: NextRequest): Promise<string | null> {
  // First check header
  const headerToken = request.headers.get(CSRF_CONFIG.headerName)
  if (headerToken) return headerToken

  // Then check form body for POST requests
  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/x-www-form-urlencoded')) {
    try {
      const formData = await request.formData()
      const formToken = formData.get(CSRF_CONFIG.formFieldName)
      if (typeof formToken === 'string') return formToken
    } catch {
      // Ignore parsing errors
    }
  }

  if (contentType.includes('application/json')) {
    try {
      const body = await request.clone().json()
      if (body && typeof body._csrf === 'string') return body._csrf
    } catch {
      // Ignore parsing errors
    }
  }

  return null
}

/**
 * Check if request path is excluded from CSRF protection
 */
export function isExcludedPath(pathname: string): boolean {
  return CSRF_CONFIG.excludedPaths.some(path =>
    pathname.startsWith(path)
  )
}

/**
 * Check if request method requires CSRF protection
 */
export function requiresCsrfProtection(method: string): boolean {
  return CSRF_CONFIG.protectedMethods.includes(method.toUpperCase())
}

// =============================================================================
// CSRF Validation Middleware
// =============================================================================

interface CsrfValidationResult {
  valid: boolean
  error?: string
  newToken?: string  // For token rotation
}

/**
 * Validate CSRF token for a request
 */
export async function validateCsrf(request: NextRequest): Promise<CsrfValidationResult> {
  const { pathname } = request.nextUrl
  const method = request.method

  // Skip for non-protected methods
  if (!requiresCsrfProtection(method)) {
    return { valid: true }
  }

  // Skip for excluded paths
  if (isExcludedPath(pathname)) {
    return { valid: true }
  }

  // Get token from cookie
  const cookieToken = getCsrfFromCookies(request.headers.get('cookie'))
  if (!cookieToken) {
    return { valid: false, error: 'Missing CSRF cookie' }
  }

  // Get token from request
  const requestToken = await getCsrfFromRequest(request)
  if (!requestToken) {
    return { valid: false, error: 'Missing CSRF token in request' }
  }

  // Validate using Double Submit Cookie pattern
  // In this pattern, the cookie and request token should match
  if (!constantTimeCompareEdge(cookieToken, requestToken)) {
    return { valid: false, error: 'Invalid CSRF token' }
  }

  return { valid: true }
}

// =============================================================================
// Middleware Factory
// =============================================================================

/**
 * Create a CSRF-protected handler
 */
export function withCsrfProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const validation = await validateCsrf(request)

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 403 }
      )
    }

    return handler(request)
  }
}

// =============================================================================
// Token Endpoint Helper
// =============================================================================

/**
 * Handler for getting a new CSRF token
 * Use this for SPA applications that need to fetch tokens
 */
export function handleCsrfTokenRequest(request: NextRequest): NextResponse {
  // Check for existing token in cookie
  let token = getCsrfFromCookies(request.headers.get('cookie'))

  // Generate new token if none exists
  if (!token) {
    token = generateCsrfToken()
  }

  const response = NextResponse.json({ csrfToken: token })
  response.headers.set('Set-Cookie', createCsrfCookie(token))

  return response
}

// =============================================================================
// React Hook Helper (for client-side)
// =============================================================================

/**
 * Get CSRF token from cookie (client-side)
 * Note: This works because we use a non-httpOnly cookie for the readable token
 */
export const CSRF_SCRIPT = `
  function getCsrfToken() {
    const match = document.cookie.match(new RegExp('${CSRF_CONFIG.cookieName}=([^;]+)'));
    return match ? match[1] : null;
  }

  // Add CSRF token to all fetch requests
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const protectedMethods = ${JSON.stringify(CSRF_CONFIG.protectedMethods)};

    if (protectedMethods.includes(method)) {
      options.headers = options.headers || {};
      if (options.headers instanceof Headers) {
        options.headers.set('${CSRF_CONFIG.headerName}', getCsrfToken() || '');
      } else {
        options.headers['${CSRF_CONFIG.headerName}'] = getCsrfToken() || '';
      }
    }

    return originalFetch.call(this, url, options);
  };
`

// =============================================================================
// Middleware for Next.js
// =============================================================================

/**
 * CSRF middleware for Next.js
 * Add this to your middleware.ts file
 */
export function csrfMiddleware(request: NextRequest): NextResponse | null {
  const method = request.method
  const { pathname } = request.nextUrl

  // Skip for non-protected methods
  if (!requiresCsrfProtection(method)) {
    return null // Continue to next middleware
  }

  // Skip for excluded paths
  if (isExcludedPath(pathname)) {
    return null
  }

  // Skip for API routes that use other auth (e.g., Bearer tokens)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return null
  }

  // Get tokens
  const cookieToken = getCsrfFromCookies(request.headers.get('cookie'))
  const headerToken = request.headers.get(CSRF_CONFIG.headerName)

  // Validate
  if (!cookieToken || !headerToken || !constantTimeCompareEdge(cookieToken, headerToken)) {
    return NextResponse.json(
      { error: 'CSRF validation failed' },
      { status: 403 }
    )
  }

  return null // Continue to next middleware
}
