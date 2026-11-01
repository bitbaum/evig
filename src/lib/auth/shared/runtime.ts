/**
 * evig on AccountKit's shared account runtime. Off until AUTH_RUNTIME=accountkit;
 * Auth.js stays authoritative until the import and the switch
 * (docs/ACCOUNTKIT-MIGRATION.md).
 */
import bcrypt from 'bcryptjs';
import { sharedRuntimeEnabled } from '@bitbaum/accountkit/auth/switch';
import { createAuthRuntime } from '@bitbaum/accountkit/auth/next';
import { createAuthMailer } from '@bitbaum/accountkit/auth/mail';
import { PUBLIC_SITE_URL } from '@/config/urls';
import { db } from '@/db';
import { authTables } from '@/db/schema/accountkit';
import { ensureEvigUser } from './accounts';

// The secret is BETTER_AUTH_SECRET, or the AUTH_SECRET the box already holds.
const site = { url: PUBLIC_SITE_URL, title: 'evig', slug: 'evig' };

/** Account mail through the fleet transport (RESEND_*). */
export const sharedAuthMailer = createAuthMailer({ site });

export const sharedAuth = createAuthRuntime({
  site,
  mail: sharedAuthMailer,
  isDatabaseConfigured: (env) =>
    sharedRuntimeEnabled(env) && Boolean(env.DATABASE_URL || env.DB_HOST),
  getDatabase: () => db,
  schema: authTables,
  // Imported bcrypt hashes (users.password_hash) keep working.
  legacyBcrypt: bcrypt,
  // users.id is a uuid that every evig table references.
  ids: 'uuid',
  onAccountCreated: ensureEvigUser,
});
