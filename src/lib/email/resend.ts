/**
 * Resend API client
 *
 * The fleet's standard transactional-email provider (see RESEND_API_KEY shared
 * across bitbaum apps). Deliberately a plain fetch to Resend's HTTP API rather
 * than the `resend` SDK: we need exactly one endpoint (POST /emails) and no
 * attachments, so a dependency buys nothing here.
 *
 * Sender: only `fleetcrown.orangecat.ch` is verified in the Resend account, so
 * like surf-your-life and vitareba we send as <app>@fleetcrown.orangecat.ch
 * until evig gets its own verified domain.
 */

import { RESEND_CONFIG } from '@/config/email';
import { logger } from '@/lib/logger';
import type { EmailContent, SendEmailResult, TestEmailResult } from './types';

const RESEND_API_URL = 'https://api.resend.com';

export function isResendEnabled(): boolean {
  return Boolean(RESEND_CONFIG.API_KEY);
}

export async function sendViaResend(to: string, content: EmailContent): Promise<SendEmailResult> {
  const res = await fetch(`${RESEND_API_URL}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_CONFIG.API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_CONFIG.FROM,
      to: [to],
      subject: content.subject,
      html: content.html,
      text: content.text,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    // Throw instead of returning failure: sendEmail() treats a thrown resend
    // error as "fall back to SMTP", mirroring the existing Listmonk pattern.
    throw new Error(`Resend send failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const body = (await res.json()) as { id?: string };
  logger.info('Email sent via Resend', { messageId: body.id, to });
  return { success: true, messageId: body.id };
}

/**
 * Connection test for the diagnostics endpoint: an authenticated read against
 * /domains proves key validity without sending anything.
 */
export async function testResendConnection(): Promise<TestEmailResult> {
  try {
    const res = await fetch(`${RESEND_API_URL}/domains`, {
      headers: { Authorization: `Bearer ${RESEND_CONFIG.API_KEY}` },
    });
    if (!res.ok) {
      return { success: false, error: `Resend API returned ${res.status}` };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
