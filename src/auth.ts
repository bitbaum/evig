/**
 * evig's accounts: AccountKit's shared runtime (src/lib/auth/shared/,
 * docs/ACCOUNTKIT-MIGRATION.md). `auth()` reads who is signed in, in evig's
 * session shape, re-read from `users` on every request.
 */
import type { Session } from 'next-auth';
import { compat } from '@/lib/auth/shared/compat';

declare module 'next-auth' {
  interface User {
    id: string;
    // Optional: the OrangeCat provider's user deliberately carries no email
    // (an unverified address must never be an identity). Every evig row has one.
    email?: string | null;
    name?: string | null;
    image?: string | null;
    role?: string; // Legacy - kept for backward compatibility
    emailVerified?: Date | null;
    // New simplified auth fields
    is_staff?: boolean;
    staff_permissions?: string[];
    is_super_admin?: boolean;
    dashboard_mode?: 'coordinator' | 'lead' | 'volunteer';
    // JWT staleness counter — see jwt callback for usage
    token_version?: number;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role?: string; // Legacy - kept for backward compatibility
      emailVerified?: boolean;
      // New simplified auth fields
      isStaff: boolean;
      staffPermissions: string[];
      isSuperAdmin: boolean;
      dashboardMode: 'coordinator' | 'lead' | 'volunteer';
    };
  }
}

/** Who is signed in, or null. */
export function auth(): Promise<Session | null> {
  return compat.currentSession();
}

/** /api/auth/*: AccountKit's endpoints and the next-auth/react protocol. */
export const handlers = compat.route;
