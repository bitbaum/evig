/**
 * evig's own reset links on AccountKit's reset (credentials.ts).
 *
 * `createPasswordResetToken` (src/lib/auth/db-verification.ts) stores the
 * token in evig's `verification_tokens` and, from this release on, as
 * AccountKit's reset value too. A link mailed before then has only evig's
 * copy; opening it adds AccountKit's, with the same token and expiry. Opening
 * it changes nothing else, so a mail scanner that follows the link spends
 * nothing: AccountKit consumes the token only when the new password is set
 * (and evig-plugin.ts then retires evig's copy).
 */
import { and, eq, gt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { users, verificationTokens } from '@/db/schema/auth';
import { logger } from '@/lib/logger';
import { mintResetToken } from './credentials';

/** The shape `createPasswordResetToken` mints: 32 random bytes, hex. */
const RESET_TOKEN = /^[0-9a-f]{64}$/;

export async function honourEvigResetLink(token: string): Promise<void> {
  // The same table holds 6-digit confirmation codes and invitation tokens;
  // neither may ever become a reset link.
  if (!RESET_TOKEN.test(token)) return;
  try {
    const [row] = await db
      .select({ email: verificationTokens.identifier, expires: verificationTokens.expires })
      .from(verificationTokens)
      .where(and(eq(verificationTokens.token, token), gt(verificationTokens.expires, sql`NOW()`)))
      .limit(1);
    if (!row) return;
    const [person] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, row.email))
      .limit(1);
    if (person) await mintResetToken(person.id, token, new Date(row.expires));
  } catch (error) {
    logger.error('Reset link could not be handed to AccountKit', { error });
  }
}
