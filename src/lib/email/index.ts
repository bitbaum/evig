/**
 * Email Module
 *
 * Main entry point for email functionality.
 * Provides sendEmail function and re-exports all templates.
 *
 * Directory structure:
 * - email/
 *   - index.ts (this file) - Main entry point
 *   - types.ts - Type definitions
 *   - transporter.ts - Nodemailer setup
 *   - templates/
 *     - index.ts - Template exports
 *     - base-styles.ts - Shared CSS/HTML
 *     - auth.ts - Authentication templates
 *     - repairer.ts - Repairer application templates
 *     - workshop.ts - Workshop templates
 *     - admin.ts - Admin notification templates
 *     - misc.ts - Newsletter, blog, reviews, location templates
 */

import { logger } from '@/lib/logger';
import { getTransporter, getFromEmail, testEmailConfig } from './transporter';
import type { EmailContent, SendEmailResult, TestEmailResult } from './types';

// Re-export types
export type { EmailContent, SendEmailResult, TestEmailResult } from './types';

// Re-export transporter utilities
export { getTransporter, testEmailConfig } from './transporter';

// Re-export all templates
export * from './templates';

/**
 * Email templates object for backwards compatibility
 */
import * as authTemplates from './templates/auth';
import * as repairerTemplates from './templates/repairer';
import * as workshopTemplates from './templates/workshop';
import * as adminTemplates from './templates/admin';
import * as miscTemplates from './templates/misc';

export const emailTemplates = {
  // Auth
  verificationCode: authTemplates.verificationCode,
  emailVerification: authTemplates.emailVerification,
  welcome: authTemplates.welcome,
  passwordReset: authTemplates.passwordReset,

  // Repairer
  repairerApplicationSubmitted: repairerTemplates.repairerApplicationSubmitted,
  repairerApplicationApproved: repairerTemplates.repairerApplicationApproved,
  repairerApplicationRejected: repairerTemplates.repairerApplicationRejected,
  repairerApplicationChangesRequested: repairerTemplates.repairerApplicationChangesRequested,

  // Workshop
  workshopRegistrationConfirmation: workshopTemplates.workshopRegistrationConfirmation,
  workshopRegistrationStatusUpdate: workshopTemplates.workshopRegistrationStatusUpdate,
  workshopReminder: workshopTemplates.workshopReminder,
  workshopCancellation: workshopTemplates.workshopCancellation,
  workshopFeedbackRequest: workshopTemplates.workshopFeedbackRequest,
  workshopProposalSubmitted: workshopTemplates.workshopProposalSubmitted,

  // Admin
  adminNewRepairerApplication: adminTemplates.adminNewRepairerApplication,
  adminNewWorkshopProposal: adminTemplates.adminNewWorkshopProposal,
  adminNewBlogSubmission: adminTemplates.adminNewBlogSubmission,
  adminNewSellerApplication: adminTemplates.adminNewSellerApplication,

  // Misc
  newsletterConfirmation: miscTemplates.newsletterConfirmation,
  blogSubmissionReceived: miscTemplates.blogSubmissionReceived,
  blogSubmissionApproved: miscTemplates.blogSubmissionApproved,
  blogSubmissionRejected: miscTemplates.blogSubmissionRejected,
  blogSubmissionPublished: miscTemplates.blogSubmissionPublished,
  blogSubmissionChangesRequested: miscTemplates.blogSubmissionChangesRequested,
  newReviewNotification: miscTemplates.newReviewNotification,
  sellerApplicationSubmitted: miscTemplates.sellerApplicationSubmitted,
  locationApprovalNotification: miscTemplates.locationApprovalNotification,
};

// Email template function type
type EmailTemplateFn = (...args: unknown[]) => EmailContent;

/**
 * Send an email using a template
 *
 * @param to - Recipient email address
 * @param template - Template name from emailTemplates
 * @param args - Arguments to pass to the template function
 */
export async function sendEmail(
  to: string,
  template: keyof typeof emailTemplates,
  ...args: unknown[]
): Promise<SendEmailResult> {
  try {
    const transporter = await getTransporter();
    const templateFn = emailTemplates[template] as EmailTemplateFn;
    const emailContent = templateFn(...args);

    const mailOptions = {
      from: getFromEmail(),
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent', { messageId: info.messageId, to, template });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email send error', { error, to, template });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send a custom email (not using a predefined template)
 *
 * @param to - Recipient email address
 * @param content - Email content with subject, html, and text
 */
export async function sendCustomEmail(
  to: string,
  content: EmailContent
): Promise<SendEmailResult> {
  try {
    const transporter = await getTransporter();

    const mailOptions = {
      from: getFromEmail(),
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Custom email sent', { messageId: info.messageId, to });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Custom email send error', { error, to });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
