/**
 * evig's own account flows (an IT-Hilfe claim, a team invitation) on
 * AccountKit's credentials: AccountKit is the only place a password lives.
 *
 * - `mintResetToken` makes an evig-issued reset link (IT-Hilfe's 7-day claim
 *   link, `createPasswordResetToken`) one that AccountKit's own reset accepts:
 *   the same token, stored as AccountKit's `reset-password:<token>` value.
 *   `/auth/reset-password` hands it to the sign-in page, which sets the
 *   password through AccountKit.
 * - `setPassword` sets a password for a person who just proved who they are
 *   by another route (the team invitation's claim token), hashed by AccountKit.
 */
import { sharedAuth } from './runtime';

async function context() {
  return sharedAuth.getAuth().$context;
}

export async function mintResetToken(userId: string, token: string, expiresAt: Date) {
  const ctx = await context();
  const identifier = `reset-password:${token}`;
  if (await ctx.internalAdapter.findVerificationValue(identifier)) return;
  await ctx.internalAdapter.createVerificationValue({ identifier, value: userId, expiresAt });
}

export async function setPassword(userId: string, password: string): Promise<void> {
  const ctx = await context();
  const hash = await ctx.password.hash(password);
  const accounts = await ctx.internalAdapter.findAccounts(userId);
  if (accounts.some((account) => account.providerId === 'credential')) {
    await ctx.internalAdapter.updatePassword(userId, hash);
  } else {
    await ctx.internalAdapter.linkAccount({
      userId,
      providerId: 'credential',
      accountId: userId,
      password: hash,
    });
  }
  // Every other session ends, as a password change does.
  await ctx.internalAdapter.deleteUserSessions(userId);
}
