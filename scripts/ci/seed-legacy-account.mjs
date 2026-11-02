#!/usr/bin/env node
/**
 * CI only: one account as Auth.js left it — a `users` row with a bcrypt hash,
 * a confirmed address and no shared rows — for the account journey
 * (tests/e2e/account-journey.spec.ts) to prove an imported account signs in
 * on AccountKit's form with its old password, and resets it through the
 * mailed link. Prints SQL for psql, run before scripts/db/accountkit-import.sql.
 * Synthetic address and password, from env.
 *
 *   LEGACY_EMAIL=… LEGACY_PASSWORD=… node scripts/ci/seed-legacy-account.mjs | psql
 */
import bcrypt from 'bcryptjs';

const { LEGACY_EMAIL, LEGACY_PASSWORD } = process.env;
if (!LEGACY_EMAIL || !LEGACY_PASSWORD) {
  console.error('set LEGACY_EMAIL and LEGACY_PASSWORD');
  process.exit(2);
}
const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
// Auth.js-era evig hashed at cost 12 (src/lib/auth/password.ts).
const hash = await bcrypt.hash(LEGACY_PASSWORD, 12);
process.stdout.write(
  `INSERT INTO users (email, name, password_hash, "emailVerified") VALUES (${quote(LEGACY_EMAIL)}, 'Legacy Person', ${quote(hash)}, now());\n`,
);
console.error('seeded 1 legacy account (bcrypt, address confirmed)');
