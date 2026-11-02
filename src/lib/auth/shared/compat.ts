/**
 * /api/auth/*: AccountKit's own endpoints (its sign-in, sign-up, recovery and
 * account screens call them), plus the next-auth/react protocol that
 * `useSession`, `signOut` and the "Connect OrangeCat" button still speak,
 * given what is evig's own (docs/ACCOUNTKIT-MIGRATION.md):
 *
 * - the session with evig's claims, re-read from `users` on every request
 *   (src/lib/auth/claims.ts, the rule the Auth.js jwt callback uses);
 * - the per-account lockout beside AccountKit's limiter on the credentials
 *   callback the E2E helpers use (AccountKit's own form gets it from
 *   evig-plugin.ts);
 * - "Connect OrangeCat" from the profile: the signed link cookie set inside
 *   the session names the account the identity joins.
 */
import { cookies } from 'next/headers';
import type { Session } from 'next-auth';
import { createNextAuthCompat } from '@bitbaum/accountkit/auth/nextauth-compat';
import { PUBLIC_SITE_URL } from '@/config/urls';
import { claimsFor } from '@/lib/auth/claims';
import { getUserByEmail, getUserById } from '@/lib/auth/db';
import { isAccountLockedDb } from '@/lib/auth/lockout';
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
        return { email };
      },
    },
  },
  codes: {
    missing: 'missing_fields',
    credentials: 'invalid_credentials',
    unavailable: 'db_unavailable',
  },
  // Failed attempts are counted, and a sign-in clears them, by evig-plugin.ts
  // on AccountKit's own endpoint, which this callback also goes through.
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
  // evig renders AccountKit's screens and has no credential writer of its own.
  screens: 'accountkit',
});
