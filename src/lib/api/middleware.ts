/**
 * API route middleware helpers
 *
 * Provides reusable middleware for common API route patterns.
 * SSOT for auth checks — all admin routes should use withAdmin(),
 * all authenticated routes should use withAuth().
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiUnauthorized, apiForbidden } from './helpers';

export type AuthSession = Awaited<ReturnType<typeof auth>>;

// Explicit ValidSession type with guaranteed user property
export interface ValidSession {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role?: string
    isStaff: boolean
    staffPermissions: string[]
    isSuperAdmin: boolean
  }
  expires: string
}

/**
 * Middleware wrapper for authenticated routes
 * Automatically checks authentication and passes session to handler
 *
 * Supports routes with params (Next.js 15+ async params):
 * - withAuth((req, session) => handler(req, session))
 * - withAuth((req, session, { params }) => handler(req, session, params))
 */
type RouteHandler<TParams> = (
  request: NextRequest,
  context?: { params?: Promise<TParams> }
) => Promise<NextResponse>;

export function withAuth<TParams = Record<string, never>>(
  handler: (
    request: NextRequest,
    session: ValidSession,
    context?: { params?: TParams }
  ) => Promise<NextResponse>
): RouteHandler<TParams> {
  return async (
    request: NextRequest,
    context?: { params?: Promise<TParams> }
  ): Promise<NextResponse> => {
    const session = await auth();

    if (!session?.user?.id) {
      return apiUnauthorized('Nicht authentifiziert');
    }

    // Session is guaranteed non-null after the check above
    const validSession = session as unknown as ValidSession;

    // Await params if they exist (Next.js 15+ async params)
    const resolvedContext = context?.params
      ? { params: await context.params }
      : undefined;

    return handler(request, validSession, resolvedContext);
  };
}

/**
 * Middleware wrapper for admin-only routes
 * Checks authentication and admin role
 *
 * Supports routes with params (Next.js 15+ async params):
 * - withAdmin((req, session) => handler(req, session))
 * - withAdmin((req, session, { params }) => handler(req, session, params))
 */
export function withAdmin<TParams = Record<string, never>>(
  handler: (
    request: NextRequest,
    session: ValidSession,
    context?: { params?: TParams }
  ) => Promise<NextResponse>
): RouteHandler<TParams> {
  return async (
    request: NextRequest,
    context?: { params?: Promise<TParams> }
  ): Promise<NextResponse> => {
    const session = await auth();

    if (!session?.user?.id) {
      return apiUnauthorized('Nicht authentifiziert');
    }

    // Session is guaranteed non-null after the check above
    const validSession = session as unknown as ValidSession;

    // Check staff access from session (set in JWT callback in src/auth.ts)
    if (!validSession.user.isStaff) {
      return apiForbidden('Nur Administratoren haben Zugriff');
    }

    // Await params if they exist (Next.js 15+ async params)
    const resolvedContext = context?.params
      ? { params: await context.params }
      : undefined;

    return handler(request, validSession, resolvedContext);
  };
}
