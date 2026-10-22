/**
 * POST /api/account/email/confirm
 * Apply a login-address change after the code from the new inbox.
 * A bootstrap owner keeps admin on the new address (the floor moves with them).
 */

import { and, eq, gt, sql } from 'drizzle-orm';
import { db } from '@/db';
import { users, verificationTokens } from '@/db/schema';
import { withAuth } from '@/lib/api/middleware';
import { apiBadRequest, apiError, apiSuccess } from '@/lib/api/helpers';
import { emailChangeIdentifier, unpackEmailChangeToken } from '@/lib/account/email-change';
import { getUserById } from '@/lib/auth/db';
import { sendEmail } from '@/lib/email';
import { isSuperAdmin } from '@/lib/permissions';
import { logger } from '@/lib/logger';

export const POST = withAuth(async (request, session) => {
  try {
    const body = (await request.json()) as { code?: string };
    const code = (body.code ?? '').trim();
    if (!/^\d{6}$/.test(code)) {
      return apiBadRequest('Der Code hat 6 Ziffern'); // i18n-ok
    }

    const identifier = emailChangeIdentifier(session.user.id);
    const [row] = await db
      .select()
      .from(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          gt(verificationTokens.expires, sql`NOW()`),
        ),
      )
      .limit(1);

    const packed = row ? unpackEmailChangeToken(row.token) : null;
    if (!row || !packed || packed.code !== code) {
      return apiBadRequest('Der Code ist ungültig oder abgelaufen'); // i18n-ok
    }

    const newEmail = packed.newEmail;
    const oldEmail = session.user.email;
    const keepAdmin = isSuperAdmin(oldEmail);

    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, newEmail))
      .limit(1);
    if (taken && taken.id !== session.user.id) {
      return apiBadRequest('Diese E-Mail-Adresse wird bereits verwendet'); // i18n-ok
    }

    await db
      .update(users)
      .set({
        email: newEmail,
        emailVerified: new Date().toISOString(),
        tokenVersion: sql`${users.tokenVersion} + 1`,
        updatedAt: new Date().toISOString(),
        ...(keepAdmin ? { isStaff: true, isSuperAdmin: true, staffPermissions: ['*'] } : {}),
      })
      .where(eq(users.id, session.user.id));

    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier));

    const user = await getUserById(session.user.id);
    try {
      await sendEmail(oldEmail, 'emailAddressChanged', user?.name || '', newEmail);
    } catch (error) {
      logger.warn('Could not notify the old address about the email change', {
        error,
        userId: session.user.id,
      });
    }

    return apiSuccess({ email: newEmail });
  } catch (error) {
    return apiError(error, 'E-Mail konnte nicht geändert werden'); // i18n-ok
  }
});
