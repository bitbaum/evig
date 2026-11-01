/**
 * evig's screens on the shared runtime, unchanged: AccountKit's
 * next-auth/react compat layer, given what is evig's own
 * (docs/ACCOUNTKIT-MIGRATION.md):
 *
 * - the session with evig's claims, re-read from `users` on every request
 *   (src/lib/auth/claims.ts, the rule the Auth.js jwt callback uses);
 * - the per-account lockout beside AccountKit's limiter, and the login codes
 *   LoginForm reads;
 * - "Connect OrangeCat" from the profile: the signed link cookie set inside
 *   the session names the account the identity joins.
 */
import { cookies } from 'next/headers';
import type { Session } from 'next-auth';
import { createNextAuthCompat } from '@bitbaum/accountkit/auth/nextauth-compat';
import { PUBLIC_SITE_URL } from '@/config/urls';
import { claimsFor } from '@/lib/auth/claims';
import { getUserByEmail, getUserById } from '@/lib/auth/db';
import { clearLockoutDb, isAccountLockedDb, recordFailedAttemptDb } from '@/lib/auth/lockout';
import { ORANGECAT_LINK_COOKIE, readLinkToken } from '@/lib/auth/orangecat';
import { sharedAuth } from './runtime';

async function evigSession(userId: string, expiresAt: Date | string): Promise<Session | null> {
  const row = await getUserById(userId);
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
    expires: new Date(expiresAt).toISOString(),
  };
}

export const compat = createNextAuthCompat<Session>({
  runtime: sharedAuth,
  siteUrl: () => PUBLIC_SITE_URL,
  signInPath: '/auth/login',
  landing: '/dashboard',
  toSession: (shared) => evigSession(shared.user.id, shared.session.expiresAt),
  credentials: {
    credentials: {
      name: 'Email & Passwort',
      resolve: async (form) => {
        const email = String(form.get('email') ?? '')
          .trim()
          .toLowerCase();
        if (!email) return null;
        const user = await getUserByEmail(email);
        // Locked: refused even with the right password, without asking AccountKit.
        if (user && (await isAccountLockedDb(user.id)).locked) return { refuse: 'account_locked' };
        if (user && !user.password_hash) return { refuse: 'no_password' };
        return { email };
      },
    },
  },
  codes: {
    missing: 'missing_fields',
    credentials: 'invalid_credentials',
    unavailable: 'db_unavailable',
  },
  onSignedIn: ({ user }) => clearLockoutDb(user.id),
  onRefused: async ({ email, reason }) => {
    if (reason !== 'credentials' && reason !== 'rate_limited') return;
    const user = await getUserByEmail(email);
    if (user) await recordFailedAttemptDb(user.id, 'login');
  },
  // Link only when the signed cookie /api/user/orangecat set names this person.
  linkWhenSignedIn: async (_request, session) => {
    const jar = await cookies();
    const linkFor = readLinkToken(
      jar.get(ORANGECAT_LINK_COOKIE)?.value,
      process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '',
    );
    if (linkFor) jar.delete(ORANGECAT_LINK_COOKIE);
    return Boolean(linkFor && session.user.id === linkFor);
  },
  linkErrorPath: '/dashboard/profile?orangecat=failed',
});
