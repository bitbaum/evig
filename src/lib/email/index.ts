/**
 * Email Module
 *
 * Main entry point for email functionality.
 * Sends through Resend (@bitbaum/mail-kit, the fleet standard), or Listmonk
 * when LISTMONK_ENABLED=true (falling back to Resend if Listmonk fails).
 *
 * Directory structure:
 * - email/
 *   - index.ts (this file) - Main entry point
 *   - types.ts - Type definitions
 *   - resend.ts - Resend adapter over @bitbaum/mail-kit
 *   - listmonk.ts - Listmonk API client
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
import { getEmailProvider } from '@/config/email';
import {
  sendViaListmonk,
  testListmonkConnection,
  isListmonkEnabled,
  subscribeToList,
} from './listmonk';
import { sendViaResend } from './resend';
import type { EmailContent, SendEmailResult, TestEmailResult } from './types';

// Re-export types
export type { EmailContent, SendEmailResult, TestEmailResult } from './types';

// Re-export Resend utilities
export { sendViaResend, testResendConnection, isResendEnabled } from './resend';

// Re-export Listmonk utilities
export {
  sendViaListmonk,
  testListmonkConnection,
  isListmonkEnabled,
  subscribeToList,
  getListmonkConfig,
} from './listmonk';

// Re-export all templates
export * from './templates';

/**
 * Email templates object for backwards compatibility
 */
import * as authTemplates from './templates/auth';
import * as workshopTemplates from './templates/workshop';
import * as adminTemplates from './templates/admin';
import * as miscTemplates from './templates/misc';
import * as itHilfeTemplates from './templates/it-hilfe';
import * as appointmentTemplates from './templates/appointments';
import * as decisionTemplates from './templates/decisions';
import * as teamTemplates from './templates/teams';

export const emailTemplates = {
  // Auth
  verificationCode: authTemplates.verificationCode,
  staffVerificationCode: authTemplates.staffVerificationCode,
  emailVerification: authTemplates.emailVerification,
  welcome: authTemplates.welcome,
  staffWelcome: authTemplates.staffWelcome,
  passwordReset: authTemplates.passwordReset,
  passwordChangeConfirmation: authTemplates.passwordChangeConfirmation,

  // Workshop
  workshopRegistrationConfirmation: workshopTemplates.workshopRegistrationConfirmation,
  workshopRegistrationStatusUpdate: workshopTemplates.workshopRegistrationStatusUpdate,
  workshopReminder: workshopTemplates.workshopReminder,
  workshopCancellation: workshopTemplates.workshopCancellation,
  workshopFeedbackRequest: workshopTemplates.workshopFeedbackRequest,
  workshopProposalSubmitted: workshopTemplates.workshopProposalSubmitted,
  workshopProposalApproved: workshopTemplates.workshopProposalApproved,
  workshopProposalRejected: workshopTemplates.workshopProposalRejected,
  workshopProposalChangesRequested: workshopTemplates.workshopProposalChangesRequested,

  // Admin
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
  locationSubmissionConfirmation: miscTemplates.locationSubmissionConfirmation,
  contentSubmissionApproved: miscTemplates.contentSubmissionApproved,
  contentSubmissionRejected: miscTemplates.contentSubmissionRejected,

  // IT-Hilfe
  itHilfeRequestConfirmation: itHilfeTemplates.itHilfeRequestConfirmation,
  adminNewITHilfeRequest: itHilfeTemplates.adminNewITHilfeRequest,
  helperNewMatchingRequest: itHilfeTemplates.helperNewMatchingRequest,

  // Decisions
  decisionVotingOpened: decisionTemplates.decisionVotingOpened,
  decisionDeadlineReminder: decisionTemplates.decisionDeadlineReminder,
  decisionClosed: decisionTemplates.decisionClosed,

  // Teams
  teamClaimInvite: teamTemplates.teamClaimInvite,
  teamMemberAdded: teamTemplates.teamMemberAdded,

  // Appointments
  appointmentNewBooking: appointmentTemplates.appointmentNewBooking,
  appointmentQuoteReceived: appointmentTemplates.appointmentQuoteReceived,
  appointmentStatusUpdate: appointmentTemplates.appointmentStatusUpdate,
  appointmentUnassignedAlert: appointmentTemplates.appointmentUnassignedAlert,
};

// Email template function type
type EmailTemplateFn = (...args: unknown[]) => EmailContent;

/**
 * Send an email using a template
 *
 * Uses Listmonk if enabled (falling back to Resend), otherwise Resend.
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
    const templateFn = emailTemplates[template] as EmailTemplateFn;
    const emailContent = templateFn(...args);
    const provider = getEmailProvider();

    // Listmonk when enabled; on failure, Resend.
    if (provider === 'listmonk') {
      try {
        return await sendViaListmonk(to, emailContent, {
          template,
          name: typeof args[0] === 'string' ? args[0] : undefined,
        });
      } catch (listmonkError) {
        logger.warn('Listmonk failed, falling back to Resend', {
          error: listmonkError instanceof Error ? listmonkError.message : 'unknown',
          to,
          template,
        });
      }
    }

    // Resend (fleet standard). A failure throws and is reported below as
    // { success: false } — there is no further fallback to pretend with.
    return await sendViaResend(to, emailContent);
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
 * Uses Listmonk if enabled (falling back to Resend), otherwise Resend.
 *
 * @param to - Recipient email address
 * @param content - Email content with subject, html, and text
 */
export async function sendCustomEmail(to: string, content: EmailContent): Promise<SendEmailResult> {
  try {
    const provider = getEmailProvider();

    // Listmonk when enabled; on failure, Resend.
    if (provider === 'listmonk') {
      try {
        return await sendViaListmonk(to, content);
      } catch (listmonkError) {
        logger.warn('Listmonk failed for custom email, falling back to Resend', {
          error: listmonkError instanceof Error ? listmonkError.message : 'unknown',
          to,
        });
      }
    }

    return await sendViaResend(to, content);
  } catch (error) {
    logger.error('Custom email send error', { error, to });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
