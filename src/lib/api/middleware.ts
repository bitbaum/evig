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
import { canAccessSection, toStaffUser, ADMIN_SECTIONS } from '@/lib/permissions';
import { ERROR_MESSAGES } from '@/config/error-messages';

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
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED);
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
 * Checks authentication and staff role, with optional section-level permission check.
 *
 * Usage:
 * - withAdmin(handler)              — staff-only (any staff member)
 * - withAdmin('products', handler)  — staff + must have 'products' section permission
 *
 * Supports routes with params (Next.js 15+ async params):
 * - withAdmin((req, session) => handler(req, session))
 * - withAdmin('products', (req, session, { params }) => handler(req, session, params))
 */
type AdminHandler<TParams> = (
  request: NextRequest,
  session: ValidSession,
  context?: { params?: TParams }
) => Promise<NextResponse>;

// Overload: withAdmin(handler)
export function withAdmin<TParams = Record<string, never>>(
  handler: AdminHandler<TParams>
): RouteHandler<TParams>;

// Overload: withAdmin(section, handler)
export function withAdmin<TParams = Record<string, never>>(
  section: string,
  handler: AdminHandler<TParams>
): RouteHandler<TParams>;

// Implementation
export function withAdmin<TParams = Record<string, never>>(
  sectionOrHandler: string | AdminHandler<TParams>,
  maybeHandler?: AdminHandler<TParams>
): RouteHandler<TParams> {
  const section = typeof sectionOrHandler === 'string' ? sectionOrHandler : undefined;
  const handler = typeof sectionOrHandler === 'function' ? sectionOrHandler : maybeHandler!;

  return async (
    request: NextRequest,
    context?: { params?: Promise<TParams> }
  ): Promise<NextResponse> => {
    const session = await auth();

    if (!session?.user?.id) {
      return apiUnauthorized(ERROR_MESSAGES.UNAUTHORIZED);
    }

    // Session is guaranteed non-null after the check above
    const validSession = session as unknown as ValidSession;

    // Check staff access from session (set in JWT callback in src/auth.ts)
    if (!validSession.user.isStaff) {
      return apiForbidden(ERROR_MESSAGES.ADMIN_REQUIRED);
    }

    // Section-level permission check (when section is specified)
    if (section) {
      const staffUser = toStaffUser(validSession.user);
      if (!canAccessSection(staffUser, section)) {
        const sectionLabel = ADMIN_SECTIONS[section]?.label ?? section;
        return apiForbidden(`Kein Zugriff auf den Bereich «${sectionLabel}»`);
      }
    }

    // Await params if they exist (Next.js 15+ async params)
    const resolvedContext = context?.params
      ? { params: await context.params }
      : undefined;

    return handler(request, validSession, resolvedContext);
  };
}
