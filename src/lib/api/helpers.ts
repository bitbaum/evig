/**
 * Standardized API response helpers
 *
 * Provides consistent response formats across all API routes
 * Following dev guide: docs/development/DEV_GUIDE.md
 *
 * API RESPONSE PATTERN (SSOT):
 * ============================
 * All responses use: { success: boolean, data?: T, error?: string }
 *
 * For LIST endpoints (GET /api/resources):
 *   apiSuccess(items)          → { success: true, data: [...] }
 *
 * For SINGLE resource (GET /api/resources/:id):
 *   apiSuccess(item)           → { success: true, data: {...} }
 *
 * For PAGINATED lists:
 *   apiSuccess({ items, pagination }) → { success: true, data: { items: [...], pagination: {...} } }
 *
 * Client-side usage:
 *   const result = await fetch('/api/resources').then(r => r.json())
 *   if (result.success) {
 *     const items = result.data  // Array for lists, Object for single
 *   }
 *
 * DO NOT wrap arrays in named objects like { workshops: [...] }
 * The endpoint path already tells you what the data is.
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ERROR_MESSAGES } from '@/config/error-messages';

/**
 * Success response helper
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 */
export function apiSuccess<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Cacheable success response helper
 * Adds Cache-Control headers for semi-static public data
 * @param data - Response data
 * @param maxAge - Cache duration in seconds (default: 300 = 5 minutes)
 * @param staleWhileRevalidate - Stale content duration (default: 60)
 */
export function apiSuccessCached<T>(
  data: T,
  maxAge = 300,
  staleWhileRevalidate = 60
): NextResponse {
  return NextResponse.json(
    { success: true, data },
    {
      status: 200,
      headers: {
        'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
      },
    }
  );
}

/**
 * Error response helper
 * Logs error and returns standardized error response
 * @param error - Error object or message
 * @param message - User-friendly error message
 * @param status - HTTP status code (default: 500)
 */
export function apiError(
  error: unknown,
  message: string,
  status = 500
): NextResponse {
  logger.error(message, { error });
  return NextResponse.json(
    { success: false, error: message },
    { status }
  );
}

/**
 * Not found response helper
 * @param resource - Resource name (e.g., "Product", "User")
 */
export function apiNotFound(resource: string): NextResponse {
  return NextResponse.json(
    { success: false, error: `${resource} ${ERROR_MESSAGES.NOT_FOUND}` },
    { status: 404 }
  );
}

/**
 * Unauthorized response helper
 */
export function apiUnauthorized(message: string = ERROR_MESSAGES.UNAUTHORIZED): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 401 }
  );
}

/**
 * Forbidden response helper
 */
export function apiForbidden(message = 'Forbidden'): NextResponse {
  return NextResponse.json(
    { success: false, error: message },
    { status: 403 }
  );
}

/**
 * Rate limited response helper (429)
 * @param message - User-friendly error message
 * @param options - Rate limit details (retryAfter, remaining, resetAt)
 */
export function apiRateLimited(
  message = 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
  options?: { retryAfter?: number; remaining?: number; resetAt?: number }
): NextResponse {
  const retryAfter = options?.retryAfter || 60
  const headers: Record<string, string> = {
    'Retry-After': String(retryAfter),
  }
  if (options?.remaining !== undefined) {
    headers['X-RateLimit-Remaining'] = String(options.remaining)
  }
  if (options?.resetAt !== undefined) {
    headers['X-RateLimit-Reset'] = String(options.resetAt)
  }

  return NextResponse.json(
    { success: false, error: message, retryAfter },
    { status: 429, headers }
  )
}

/**
 * Bad request response helper
 * @param message - Error message
 * @param errors - Optional validation errors
 */
export function apiBadRequest(
  message: string,
  errors?: Record<string, string[]>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(errors && { errors }),
    },
    { status: 400 }
  );
}
