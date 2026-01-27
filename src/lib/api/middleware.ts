/**
 * API route middleware helpers
 *
 * Provides reusable middleware for common API route patterns
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiUnauthorized } from './helpers';
import { isAdminRole } from '@/lib/constants';
import { hasAdminAccessUnified, type UnifiedUser } from '@/lib/auth/unified-permissions';

export type AuthSession = Awaited<ReturnType<typeof auth>>;

// Explicit ValidSession type with guaranteed user property
export interface ValidSession {
  user: {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role?: string
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

    // Check admin access using unified permissions (checks both old role AND new is_staff)
    const user: UnifiedUser = {
      email: validSession.user.email || '',
      role: validSession.user.role,
      isStaff: (session.user as { isStaff?: boolean }).isStaff,
      staffPermissions: (session.user as { staffPermissions?: string[] }).staffPermissions,
      isSuperAdmin: (session.user as { isSuperAdmin?: boolean }).isSuperAdmin,
    }
    if (!hasAdminAccessUnified(user)) {
      return NextResponse.json(
        { success: false, error: 'Nur Administratoren können diese Funktion verwenden' },
        { status: 403 }
      );
    }

    // Await params if they exist (Next.js 15+ async params)
    const resolvedContext = context?.params
      ? { params: await context.params }
      : undefined;

    return handler(request, validSession, resolvedContext);
  };
}
