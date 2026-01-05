/**
 * API route middleware helpers
 * 
 * Provides reusable middleware for common API route patterns
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { apiUnauthorized } from './helpers';

type Session = Awaited<ReturnType<typeof auth>>;

/**
 * Middleware wrapper for authenticated routes
 * Automatically checks authentication and passes session to handler
 * 
 * Supports routes with params:
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
    context?: { params?: TParams }
  ): Promise<NextResponse> => {
    const session = await auth();
    
    if (!session?.user?.id) {
      return apiUnauthorized('Nicht authentifiziert');
    }
    
    return handler(request, session, context);
  };
}

/**
 * Middleware wrapper for admin-only routes
 * Checks authentication and admin role
 * 
 * Supports routes with params:
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
    context?: { params?: TParams }
  ): Promise<NextResponse> => {
    const session = await auth();
    
    if (!session?.user?.id) {
      return apiUnauthorized('Nicht authentifiziert');
    }
    
    // Check admin role (adjust based on your role system)
    if (session.user.role !== 'admin' && session.user.role !== 'REVAMPIT_ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return handler(request, session, context);
  };
}
