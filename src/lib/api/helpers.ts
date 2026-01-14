/**
 * Standardized API response helpers
 * 
 * Provides consistent response formats across all API routes
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

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
    { success: false, error: `${resource} not found` },
    { status: 404 }
  );
}

/**
 * Unauthorized response helper
 */
export function apiUnauthorized(message = 'Unauthorized'): NextResponse {
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
