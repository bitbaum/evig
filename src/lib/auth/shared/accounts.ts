/**
 * A person AccountKit created itself (a first OrangeCat or bitbaum sign-in) gets
 * evig's `users` row under the same id, so every evig table can reference them.
 * Linking a method to an existing person only records the OrangeCat actor id.
 * Idempotent: AccountKit may call this more than once for one person.
 */
import { eq, isNull, and } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema/auth';
import { authUsers } from '@/db/schema/accountkit';
import { getOrCreateProfile } from '@/lib/auth/db';
import { ORANGECAT_PROVIDER_ID } from '@/lib/auth/orangecat-provider-id';

export async function ensureEvigUser(account: {
  userId: string;
  providerId: string;
  accountId: string;
}): Promise<void> {
  const actorId = account.providerId === ORANGECAT_PROVIDER_ID ? account.accountId : null;
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, account.userId))
    .limit(1);
  if (existing) {
    if (actorId) {
      await db
        .update(users)
        .set({ orangecatActorId: actorId })
        .where(and(eq(users.id, account.userId), isNull(users.orangecatActorId)));
    }
    return;
  }
  const [shared] = await db
    .select({ email: authUsers.email, name: authUsers.name, verified: authUsers.emailVerified })
    .from(authUsers)
    .where(eq(authUsers.id, account.userId))
    .limit(1);
  if (!shared) return;
  // An address from a provider is never trusted as proof (AccountKit gives OIDC
  // people a `.invalid` placeholder), so a new person starts unverified and
  // without staff powers, like a fresh password registration.
  await db
    .insert(users)
    .values({
      id: account.userId,
      email: shared.email,
      name: shared.name || null,
      emailVerified: shared.verified ? new Date().toISOString() : null,
      orangecatActorId: actorId,
    })
    .onConflictDoNothing();
  await getOrCreateProfile(account.userId);
}
