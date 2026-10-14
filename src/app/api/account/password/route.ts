/**
 * POST /api/account/password
 * Change the password of the signed-in account. The session stays.
 */

import { withAuth } from '@/lib/api/middleware';
import { apiBadRequest, apiError, apiSuccess } from '@/lib/api/helpers';
import { getUserById, updateUser } from '@/lib/auth/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { rateLimiters } from '@/lib/security/rate-limit';

export const POST = withAuth(async (request, session) => {
  try {
    if (!rateLimiters.emailChange(`password:${session.user.id}`)) {
      return apiBadRequest('Zu viele Versuche. Bitte warte eine Stunde.'); // i18n-ok
    }

    const body = (await request.json()) as { currentPassword?: string; newPassword?: string };
    const currentPassword = body.currentPassword ?? '';
    const newPassword = body.newPassword ?? '';

    if (newPassword.length < 8 || newPassword.length > 128) {
      return apiBadRequest('Das neue Passwort braucht mindestens 8 Zeichen'); // i18n-ok
    }

    const user = await getUserById(session.user.id);
    if (!user?.password_hash) {
      return apiBadRequest(
        'Dieses Konto hat kein Passwort. Lege zuerst eines über «Passwort vergessen» an.', // i18n-ok
      );
    }
    if (!(await verifyPassword(currentPassword, user.password_hash))) {
      return apiBadRequest('Das aktuelle Passwort stimmt nicht'); // i18n-ok
    }
    if (await verifyPassword(newPassword, user.password_hash)) {
      return apiBadRequest('Das neue Passwort ist das gleiche wie das alte'); // i18n-ok
    }

    await updateUser(session.user.id, { password_hash: await hashPassword(newPassword) });

    try {
      await sendEmail(session.user.email, 'passwordChangeConfirmation', user.name || '');
    } catch (error) {
      logger.warn('Password changed but the notice email failed', {
        error,
        userId: session.user.id,
      });
    }

    return apiSuccess({ changed: true });
  } catch (error) {
    return apiError(error, 'Passwort konnte nicht geändert werden'); // i18n-ok
  }
});
