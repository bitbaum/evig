/**
 * evig's accounts, on AccountKit's shared runtime: email and password, an
 * email sign-in link, passkeys, two-factor codes, password recovery, Sign in
 * with OrangeCat and the shared bitbaum sign-in, each shown when its env is set
 * (signInMethods in src/lib/auth/shared/methods.ts). AccountKit is the only
 * writer of credentials (docs/ACCOUNTKIT-MIGRATION.md).
 */
import bcrypt from 'bcryptjs';
import { createAuthRuntime } from '@bitbaum/accountkit/auth/next';
import { createAuthMailer } from '@bitbaum/accountkit/auth/mail';
import { PUBLIC_SITE_URL } from '@/config/urls';
import { db } from '@/db';
import { authTables } from '@/db/schema/accountkit';
import { ensureEvigUser } from './accounts';
import { evigPlugin } from './evig-plugin';
import { sendConfirmationCode } from './confirmation-code';

// The secret is BETTER_AUTH_SECRET, or the AUTH_SECRET the box already holds.
const site = { url: PUBLIC_SITE_URL, title: 'evig', slug: 'evig' };

/**
 * Account mail through the fleet transport (RESEND_*), by AccountKit's shared
 * mailer. An address is confirmed by evig's own 6-digit code, as before: it is
 * the mailer's own mail for `verify`, and AccountKit's confirmation link is
 * the fallback when the code cannot be sent. The sign-in link's email also
 * carries AccountKit's sign-in code.
 */
export const sharedAuthMailer = createAuthMailer({
  site,
  own: { verify: (to) => sendConfirmationCode(to) },
});

export const sharedAuth = createAuthRuntime({
  site,
  mail: sharedAuthMailer,
  isDatabaseConfigured: (env) => Boolean(env.DATABASE_URL || env.DB_HOST),
  getDatabase: () => db,
  schema: authTables,
  // Hashes imported from Auth.js (users.password_hash) are bcrypt; every
  // password set through AccountKit is its native scrypt.
  legacyBcrypt: bcrypt,
  // users.id is a uuid that every evig table references.
  ids: 'uuid',
  onAccountCreated: ensureEvigUser,
  plugins: [evigPlugin()],
});
