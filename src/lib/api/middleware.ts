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

type Session = Awaited<ReturnType<typeof auth>>;

/**
 * Middleware wrapper for authenticated routes
 * Automatically checks authentication and passes session to handler
 *
 * Supports routes with params (Next.js 15+ async params):
 * - withAuth((req, session) => handler(req, session))
 * - withAuth((req, session, { params }) => handler(req, session, params))
 */
export function withAuth<TParams = Record<string, never>>(
  handler: (
    request: NextRequest,
    session: NonNullable<Session>,
    context?: { params?: TParams }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<TParams> }
  ): Promise<NextResponse> => {
    const session = await auth();

    if (!session?.user?.id) {
      return apiUnauthorized('Nicht authentifiziert');
    }

    // Await params if they exist (Next.js 15+ async params)
    const resolvedContext = context?.params
      ? { params: await context.params }
      : undefined;

    return handler(request, session, resolvedContext);
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
    session: NonNullable<Session>,
    context?: { params?: TParams }
  ) => Promise<NextResponse>
) {
  return async (
    request: NextRequest,
    context?: { params?: Promise<TParams> }
  ): Promise<NextResponse> => {
    const session = await auth();

    if (!session?.user?.id) {
      return apiUnauthorized('Nicht authentifiziert');
    }

    // Check admin role using SSOT helper from constants
    if (!isAdminRole(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Nur Administratoren können diese Funktion verwenden' },
        { status: 403 }
      );
    }

    // Await params if they exist (Next.js 15+ async params)
    const resolvedContext = context?.params
      ? { params: await context.params }
      : undefined;

    return handler(request, session, resolvedContext);
  };
}
