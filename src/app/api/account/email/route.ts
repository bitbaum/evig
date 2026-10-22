/**
 * POST /api/account/email
 * Start a login-address change. The code goes to the NEW address.
 * Nothing changes until /api/account/email/confirm.
 */

import { randomInt } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, verificationTokens } from '@/db/schema';
import { withAuth } from '@/lib/api/middleware';
import { apiBadRequest, apiError, apiSuccess } from '@/lib/api/helpers';
import {
  emailChangeIdentifier,
  isPlausibleEmail,
  packEmailChangeToken,
} from '@/lib/account/email-change';
import { getUserById } from '@/lib/auth/db';
import { verifyPassword } from '@/lib/auth/password';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/security/rate-limit';

export const POST = withAuth(async (request, session) => {
  try {
    if (!rateLimiters.emailChange(session.user.id)) {
      return apiBadRequest('Zu viele Versuche. Bitte warte eine Stunde.'); // i18n-ok
    }

    const body = (await request.json()) as { newEmail?: string; currentPassword?: string };
    const newEmail = (body.newEmail ?? '').trim().toLowerCase();
    const currentPassword = body.currentPassword ?? '';

    if (!isPlausibleEmail(newEmail)) {
      return apiBadRequest('Das ist keine gültige E-Mail-Adresse'); // i18n-ok
    }
    if (newEmail === session.user.email.toLowerCase()) {
      return apiBadRequest('Das ist bereits deine E-Mail-Adresse'); // i18n-ok
    }
    if (!currentPassword) {
      return apiBadRequest('Bitte gib dein aktuelles Passwort ein'); // i18n-ok
    }

    const user = await getUserById(session.user.id);
    if (!user?.password_hash) {
      return apiBadRequest(
        'Dieses Konto hat kein Passwort. Lege zuerst eines über «Passwort vergessen» an.', // i18n-ok
      );
    }
    if (!(await verifyPassword(currentPassword, user.password_hash))) {
      return apiBadRequest('Das Passwort stimmt nicht'); // i18n-ok
    }

    const [taken] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, newEmail))
      .limit(1);
    if (taken) {
      return apiBadRequest('Diese E-Mail-Adresse wird bereits verwendet'); // i18n-ok
    }

    const code = String(randomInt(100000, 999999));
    const identifier = emailChangeIdentifier(session.user.id);
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await db.delete(verificationTokens).where(eq(verificationTokens.identifier, identifier));
    await db.insert(verificationTokens).values({
      identifier,
      token: packEmailChangeToken(code, newEmail),
      expires,
    });

    const sent = await sendEmail(newEmail, 'emailAddressChange', user.name || '', code);
    if (!sent.success) {
      logger.error('Email change code failed to send', { userId: session.user.id });
      return apiError(
        new Error(sent.error || 'send failed'),
        'Der Code konnte nicht gesendet werden. Bitte später noch einmal versuchen.', // i18n-ok
      );
    }

    return apiSuccess({ sent: true, email: newEmail });
  } catch (error) {
    return apiError(error, 'E-Mail konnte nicht geändert werden'); // i18n-ok
  }
});
