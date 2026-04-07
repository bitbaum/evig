/**
 * Email configuration
 *
 * Single Source of Truth for email service configuration
 * Supports both direct SMTP (nodemailer) and Listmonk
 *
 * Listmonk is the recommended FOSS solution for production.
 */

import { ORG } from './org'

/**
 * Email provider type
 * - 'listmonk': Use Listmonk for transactional and newsletter emails (recommended)
 * - 'smtp': Use direct SMTP via nodemailer (fallback)
 */
export type EmailProvider = 'listmonk' | 'smtp';

/**
 * Get the configured email provider
 */
export function getEmailProvider(): EmailProvider {
  if (process.env.LISTMONK_ENABLED === 'true') {
    return 'listmonk';
  }
  return 'smtp';
}

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
  FROM_NAME: process.env.LISTMONK_FROM_NAME || 'Revamp-IT',
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
  if (LISTMONK_CONFIG.ENABLED) {
    return true;
  }
  return !!(EMAIL_CONFIG.USER && EMAIL_CONFIG.PASS);
}
