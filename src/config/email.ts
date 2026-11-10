/**
 * Email configuration
 *
 * Single Source of Truth for email service configuration
 * Supports Resend (fleet standard, via @bitbaum/mail-kit) and Listmonk.
 *
 * The direct-SMTP fallback (Brevo via nodemailer) was removed on 2026-11-10:
 * its production credential was dead (verified 2026-09-05, the relay answered
 * "Login denied"), so every "fallback" send delivered nothing. If evig ever
 * needs its own mail server again, mail-kit sends over SMTP itself
 * (MAIL_TRANSPORT=smtp) — no second implementation here.
 */

import { ORG } from './org';

/**
 * Email provider type
 * - 'resend': Fleet-standard transactional email via the Resend API (preferred)
 * - 'listmonk': Listmonk for transactional and newsletter emails
 */
export type EmailProvider = 'resend' | 'listmonk';

/**
 * Get the configured email provider. Listmonk is an explicit opt-in;
 * otherwise Resend (which reports "not configured" honestly when its key is
 * missing, instead of a fallback that pretends).
 */
export function getEmailProvider(): EmailProvider {
  if (process.env.LISTMONK_ENABLED === 'true') {
    return 'listmonk';
  }
  return 'resend';
}

/**
 * Resend configuration (fleet standard).
 * Only loki.orangecat.ch is verified in the shared Resend account, so
 * the default sender follows the surf-your-life/vitareba convention.
 */
export const RESEND_CONFIG = {
  API_KEY: process.env.RESEND_API_KEY || '',
  FROM: process.env.RESEND_FROM || `${ORG.name} <evig@fleetcrown.orangecat.ch>`,
} as const;

/**
 * Listmonk configuration
 */
export const LISTMONK_CONFIG = {
  URL: process.env.LISTMONK_URL || 'http://localhost:9090',
  USERNAME: process.env.LISTMONK_USERNAME || 'admin',
  PASSWORD: process.env.LISTMONK_PASSWORD || 'revampit2024',
  FROM_EMAIL: process.env.LISTMONK_FROM_EMAIL || `noreply@${ORG.emailDomain}`,
  FROM_NAME: process.env.LISTMONK_FROM_NAME || ORG.name,
  ENABLED: process.env.LISTMONK_ENABLED === 'true',
} as const;

/**
 * Validates that required email configuration is present
 * Throws error if critical config is missing
 */
export function validateEmailConfig(): void {
  const provider = getEmailProvider();

  if (provider === 'listmonk') {
    if (!LISTMONK_CONFIG.ENABLED) {
      throw new Error('LISTMONK_ENABLED must be true to use Listmonk');
    }
    // Listmonk config is mostly optional with defaults
    return;
  }

  // Resend: the key is the only requirement; FROM has a safe default.
  if (!RESEND_CONFIG.API_KEY) {
    throw new Error('RESEND_API_KEY is required for email functionality');
  }
}

/**
 * Check if any email provider is configured
 */
export function isEmailConfigured(): boolean {
  if (RESEND_CONFIG.API_KEY) {
    return true;
  }
  return LISTMONK_CONFIG.ENABLED;
}
