/**
 * Email configuration
 *
 * Single Source of Truth for email service configuration
 * Supports Resend (fleet standard), Listmonk, and direct SMTP (nodemailer).
 */

import { ORG } from './org';

/**
 * Email provider type
 * - 'resend': Fleet-standard transactional email via the Resend API (preferred)
 * - 'listmonk': Listmonk for transactional and newsletter emails
 * - 'smtp': Direct SMTP via nodemailer (legacy fallback)
 */
export type EmailProvider = 'resend' | 'listmonk' | 'smtp';

/**
 * Get the configured email provider.
 * Listmonk stays an explicit opt-in; otherwise Resend wins whenever its key
 * is present, because the prod SMTP credential (Brevo) is dead — verified
 * 2026-09-05: the relay answers "Login denied", so SMTP sends deliver nothing.
 */
export function getEmailProvider(): EmailProvider {
  if (process.env.LISTMONK_ENABLED === 'true') {
    return 'listmonk';
  }
  if (process.env.RESEND_API_KEY) {
    return 'resend';
  }
  return 'smtp';
}

/**
 * Resend configuration (fleet standard).
 * Only fleetcrown.orangecat.ch is verified in the shared Resend account, so
 * the default sender follows the surf-your-life/vitareba convention.
 */
export const RESEND_CONFIG = {
  API_KEY: process.env.RESEND_API_KEY || '',
  FROM: process.env.RESEND_FROM || `${ORG.name} <evig@fleetcrown.orangecat.ch>`,
} as const;

/**
 * SMTP configuration (for direct nodemailer or as Listmonk's SMTP backend)
 */
export const EMAIL_CONFIG = {
  HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  PORT: parseInt(process.env.EMAIL_PORT || '587'),
  SECURE: process.env.EMAIL_SECURE === 'true',
  USER: process.env.EMAIL_USER || '',
  PASS: process.env.EMAIL_PASS || '',
  FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER || `noreply@${ORG.emailDomain}`,
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

  if (provider === 'resend') {
    // Presence of the key is the only requirement; FROM has a safe default.
    return;
  }

  if (provider === 'listmonk') {
    if (!LISTMONK_CONFIG.ENABLED) {
      throw new Error('LISTMONK_ENABLED must be true to use Listmonk');
    }
    // Listmonk config is mostly optional with defaults
    return;
  }

  // SMTP validation
  if (!EMAIL_CONFIG.USER) {
    throw new Error('EMAIL_USER is required for SMTP email functionality');
  }
  if (!EMAIL_CONFIG.PASS) {
    throw new Error('EMAIL_PASS is required for SMTP email functionality');
  }
}

/**
 * Check if any email provider is configured
 */
export function isEmailConfigured(): boolean {
  if (RESEND_CONFIG.API_KEY) {
    return true;
  }
  if (LISTMONK_CONFIG.ENABLED) {
    return true;
  }
  return !!(EMAIL_CONFIG.USER && EMAIL_CONFIG.PASS);
}
