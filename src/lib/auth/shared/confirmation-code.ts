/**
 * evig's 6-digit address confirmation (POST /api/auth/verify-code, resent by
 * /api/auth/resend-code and the dashboard banner): the code mail, sent for a
 * new sign-up in place of AccountKit's confirmation link.
 */
import { DEFAULT_USER_NAME_FALLBACK } from '@/config/auth-ui';
import { createVerificationCode, getUserByEmail } from '@/lib/auth/db';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { isStaffEmail } from '@/lib/permissions';

/** Sends the code; false when it could not be sent. Never throws. */
export async function sendConfirmationCode(email: string): Promise<boolean> {
  try {
    const user = await getUserByEmail(email);
    if (!user || user.emailVerified) return false;
    const code = await createVerificationCode(email);
    const sent = await sendEmail(
      email,
      isStaffEmail(email) ? 'staffVerificationCode' : 'verificationCode',
      user.name || DEFAULT_USER_NAME_FALLBACK,
      code,
    );
    if (!sent.success) logger.error('Confirmation code mail failed', { error: sent.error });
    return sent.success;
  } catch (error) {
    logger.error('Confirmation code mail failed', { error });
    return false;
  }
}
