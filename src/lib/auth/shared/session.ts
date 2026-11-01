/**
 * evig's session shape, answered from a shared AccountKit session. Every request
 * rereads the `users` row, so a deleted account, a demotion or a newly verified
 * address takes effect at once — no token_version round-trip needed.
 */
import { cache } from 'react';
import type { Session } from 'next-auth';
import { getUserById } from '@/lib/auth/db';
import { claimsFor } from '@/lib/auth/claims';
import { sharedAuth } from './runtime';

type SharedSession = { user: { id: string }; session: { expiresAt: Date | string } };

export async function evigSession(shared: SharedSession | null): Promise<Session | null> {
  if (!shared) return null;
  const row = await getUserById(shared.user.id);
  if (!row) return null;
  const claims = claimsFor(row);
  return {
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      image: row.image,
      role: claims.role,
      emailVerified: claims.emailVerified,
      isStaff: claims.isStaff,
      staffPermissions: claims.staffPermissions,
      isSuperAdmin: claims.isSuperAdmin,
      dashboardMode: claims.dashboardMode,
    },
    expires: new Date(shared.session.expiresAt).toISOString(),
  };
}

/** The session of this request (server components, route handlers). */
export const sharedSession = cache(async () => evigSession(await sharedAuth.getSession()));

/** The session behind request headers (the proxy, the /session endpoint). */
export async function sharedSessionFor(headers: Headers): Promise<Session | null> {
  return evigSession(await sharedAuth.sessionFor(headers).catch(() => null));
}
