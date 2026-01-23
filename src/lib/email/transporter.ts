/**
 * Email Transporter
 *
 * Handles nodemailer transporter setup and configuration.
 */

import { EMAIL_CONFIG } from '@/config/email';
import type { Transporter } from 'nodemailer';

// Email configuration
const emailConfig = {
  host: EMAIL_CONFIG.HOST,
  port: EMAIL_CONFIG.PORT,
  secure: EMAIL_CONFIG.SECURE,
  auth: {
    user: EMAIL_CONFIG.USER,
    pass: EMAIL_CONFIG.PASS,
  },
};

// Singleton transporter instance
let transporter: Transporter | null = null;

/**
 * Get or create the nodemailer transporter
 */
export async function getTransporter(): Promise<Transporter> {
  if (!transporter) {
    const nodemailer = await import('nodemailer');
    transporter = nodemailer.createTransport(emailConfig);
  }
  return transporter;
}

/**
 * Test email configuration
 */
export async function testEmailConfig(): Promise<{ success: boolean; error?: string }> {
  try {
    const transport = await getTransporter();
    await transport.verify();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get the sender email address
 */
export function getFromEmail(): string {
  return EMAIL_CONFIG.FROM || emailConfig.auth.user;
}
