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

const fleetMailer = createAuthMailer({ site });

/**
 * Account mail through the fleet transport (RESEND_*). An address is
 * confirmed by evig's own 6-digit code, as before: AccountKit's confirmation
 * mail is replaced by the code mail, and its link mail is the fallback when
 * the code cannot be sent.
 */
export const sharedAuthMailer: typeof fleetMailer = {
  get configured() {
    return fleetMailer.configured;
  },
  async send(kind, to, url) {
    if (kind === 'verify' && (await sendConfirmationCode(to))) return;
    await fleetMailer.send(kind, to, url);
  },
};

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
