/**
 * Resend transport — thin adapter over @bitbaum/mail-kit.
 *
 * The fleet's one email layer (shared RESEND_API_KEY across bitbaum apps).
 * mail-kit owns the HTTP call, timeout, and the "configured-looking but dead"
 * guards (placeholder key, sandbox sender); this file only adapts its
 * SendResult to evig's SendEmailResult and preserves the throw-on-failure
 * contract that sendEmail() uses to fall back to SMTP.
 *
 * Sender: only `fleetcrown.orangecat.ch` is verified in the Resend account, so
 * like surf-your-life and vitareba we send as <app>@fleetcrown.orangecat.ch
 * until evig gets its own verified domain (RESEND_CONFIG.FROM reads
 * RESEND_FROM with that convention as the default).
 */

import { sendMail, mailHealth, isMailConfigured } from '@bitbaum/mail-kit';
import { RESEND_CONFIG } from '@/config/email';
import { logger } from '@/lib/logger';
import type { EmailContent, SendEmailResult, TestEmailResult } from './types';

export function isResendEnabled(): boolean {
  return isMailConfigured();
}

export async function sendViaResend(to: string, content: EmailContent): Promise<SendEmailResult> {
  const result = await sendMail({
    to,
    from: RESEND_CONFIG.FROM,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  if (!result.sent) {
    // Throw instead of returning failure: sendEmail() treats a thrown resend
    // error as "fall back to SMTP", mirroring the existing Listmonk pattern.
    throw new Error(`Resend send failed: ${result.error}`);
  }

  logger.info('Email sent via Resend', { messageId: result.id, to });
  return { success: true, messageId: result.id };
}

/**
 * Connection test for the diagnostics endpoint: mail-kit's health probe does
 * an authenticated read against /domains — proves key validity without
 * sending anything.
 */
export async function testResendConnection(): Promise<TestEmailResult> {
  const health = await mailHealth();
  return health.ok ? { success: true } : { success: false, error: health.error };
}
