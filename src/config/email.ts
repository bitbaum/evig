/**
 * Email configuration
 * 
 * Single Source of Truth for email service configuration
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

export const EMAIL_CONFIG = {
  HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  PORT: parseInt(process.env.EMAIL_PORT || '587'),
  SECURE: process.env.EMAIL_SECURE === 'true',
  USER: process.env.EMAIL_USER || '',
  PASS: process.env.EMAIL_PASS || '',
  FROM: process.env.EMAIL_FROM || process.env.EMAIL_USER || '',
} as const;

/**
 * Validates that required email configuration is present
 * Throws error if critical config is missing
 */
export function validateEmailConfig(): void {
  if (!EMAIL_CONFIG.USER) {
    throw new Error('EMAIL_USER is required for email functionality');
  }
  if (!EMAIL_CONFIG.PASS) {
    throw new Error('EMAIL_PASS is required for email functionality');
  }
}
