/**
 * What is evig's own on AccountKit's endpoints (`plugins` in runtime.ts):
 *
 * - Per-account lockout (src/lib/auth/lockout.ts) beside AccountKit's own
 *   limiter: a locked account is refused even with the right password, a
 *   refused password counts towards the lock, a sign-in clears it.
 * - A referral link (`/auth/register?ref=…`) still credits the inviter: the
 *   sign-up page keeps the code in a cookie, and a password sign-up redeems it.
 * - A reset link evig minted itself (an IT-Hilfe claim, see credentials.ts)
 *   proves the mailbox, as before: using it confirms the address and retires
 *   evig's copy of the token.
 * - Deleting an account (AccountKit's panel) removes the evig person too
 *   (migration 143). It is refused, before anything is deleted, for a super
 *   admin, and for a person named on records that must be kept; the security
 *   page offers staff deletion instead.
 */
import type { BetterAuthPlugin } from 'better-auth';
import { APIError, createAuthMiddleware, getSessionFromCtx } from 'better-auth/api';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/db';
import { users, verificationTokens } from '@/db/schema/auth';
import { getUserByEmail } from '@/lib/auth/db';
import { clearLockoutDb, isAccountLockedDb, recordFailedAttemptDb } from '@/lib/auth/lockout';
import { logger } from '@/lib/logger';
import { redeemReferralCode } from '@/lib/referral';

export const REFERRAL_COOKIE = 'evig_ref';

const DELETE_PATHS = ['/delete-user', '/delete-user/callback'];

export type DeletionRefusal = 'superAdmin' | 'records';

/** Never lets a hook's own failure fail the sign-in it watches. */
async function quietly(what: string, run: () => Promise<unknown>): Promise<void> {
  try {
    await run();
  } catch (error) {
    logger.error(`[auth] ${what} failed`, {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

const bodyEmail = (body: unknown) => {
  const email = (body as { email?: unknown } | undefined)?.email;
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
};

function cookieValue(headers: Headers | undefined, name: string): string | null {
  const match = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(headers?.get('cookie') ?? '');
  return match ? decodeURIComponent(match[1]) : null;
}

const ROLLBACK = Symbol('rollback');

/** Why this person cannot delete themselves, or null when it is clean. Changes nothing. */
export async function deletionRefusal(userId: string): Promise<DeletionRefusal | null> {
  const [row] = await db
    .select({ superAdmin: users.isSuperAdmin })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (row?.superAdmin) return 'superAdmin';
  // Records that reference the person without a cascade (orders, bookkeeping,
  // audit rows) make the deletion fail: try it, and always roll it back.
  try {
    await db.transaction(async (tx) => {
      await tx.delete(users).where(eq(users.id, userId));
      throw ROLLBACK;
    });
  } catch (error) {
    if (error === ROLLBACK) return null;
    const code =
      (error as { code?: string }).code ?? (error as { cause?: { code?: string } }).cause?.code;
    if (code === '23503') return 'records';
    throw error;
  }
  return null;
}

export function evigPlugin(): BetterAuthPlugin {
  return {
    id: 'evig',
    hooks: {
      before: [
        {
          matcher: ({ path }) => path === '/sign-in/email',
          handler: createAuthMiddleware(async (ctx) => {
            const email = bodyEmail(ctx.body);
            if (!email) return;
            const user = await getUserByEmail(email);
            if (user && (await isAccountLockedDb(user.id)).locked) {
              // Answered as "too many attempts": the sign-in form says so in
              // the person's language, and the lock lifts on its own.
              throw new APIError('TOO_MANY_REQUESTS', {
                code: 'ACCOUNT_LOCKED',
                message: 'This account is locked for a few minutes after repeated wrong passwords.',
              });
            }
          }),
        },
        {
          matcher: ({ path }) => Boolean(path && DELETE_PATHS.includes(path)),
          handler: createAuthMiddleware(async (ctx) => {
            const current = await getSessionFromCtx(ctx, { disableRefresh: true });
            if (!current) return;
            const reason = await deletionRefusal(current.user.id);
            if (reason) {
              throw new APIError('FORBIDDEN', {
                code: 'EVIG_ACCOUNT_KEPT',
                message: 'This account cannot delete itself; ask evig to delete it.',
              });
            }
          }),
        },
      ],
      after: [
        {
          matcher: ({ path }) => path === '/sign-in/email',
          handler: createAuthMiddleware(async (ctx) => {
            const signedIn = ctx.context.newSession?.user.id;
            if (signedIn) return quietly('lockout reset', () => clearLockoutDb(signedIn));
            const returned = ctx.context.returned as { statusCode?: number } | undefined;
            if (returned?.statusCode !== 401) return;
            const email = bodyEmail(ctx.body);
            await quietly('failed-attempt record', async () => {
              const user = email ? await getUserByEmail(email) : null;
              if (user) await recordFailedAttemptDb(user.id, 'login');
            });
          }),
        },
        {
          matcher: ({ path }) => path === '/sign-up/email',
          handler: createAuthMiddleware(async (ctx) => {
            const userId = ctx.context.newSession?.user.id;
            const code = cookieValue(ctx.request?.headers ?? ctx.headers, REFERRAL_COOKIE);
            if (!userId || !code) return;
            const email = bodyEmail(ctx.body);
            await quietly('referral redemption', () =>
              redeemReferralCode(code, userId, email, email),
            );
          }),
        },
        {
          matcher: ({ path }) => path === '/reset-password',
          handler: createAuthMiddleware(async (ctx) => {
            const returned = ctx.context.returned as { statusCode?: number } | undefined;
            if (returned?.statusCode) return;
            const token = (ctx.body as { token?: unknown } | undefined)?.token;
            if (typeof token !== 'string' || !token) return;
            await quietly('reset-link confirmation', async () => {
              const [mine] = await db
                .delete(verificationTokens)
                .where(eq(verificationTokens.token, token))
                .returning({ email: verificationTokens.identifier });
              if (!mine) return;
              await db
                .update(users)
                .set({ emailVerified: sql`NOW()`.mapWith(String) })
                .where(and(eq(users.email, mine.email), isNull(users.emailVerified)));
            });
          }),
        },
      ],
    },
  };
}
