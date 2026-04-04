/**
 * Email utilities for RevampIT
 *
 * This file re-exports from the modular email directory.
 * The module has been split into smaller, focused files:
 *
 * - email/index.ts - Main entry point
 * - email/types.ts - Type definitions
 * - email/transporter.ts - Nodemailer setup
 * - email/templates/ - Email templates
 *   - auth.ts - Authentication templates
 *   - repairer.ts - Repairer application templates
 *   - workshop.ts - Workshop templates
 *   - admin.ts - Admin notification templates
 *   - misc.ts - Newsletter, blog, reviews, location templates
 */

// Re-export everything from the email module
export {
  // Types
  type EmailContent,
  type SendEmailResult,
  type TestEmailResult,

  // Main functions
  sendEmail,
  sendCustomEmail,
  testEmailConfig,
  getTransporter,

  // Templates object (for backwards compatibility)
  emailTemplates,

  // Individual templates
  verificationCode,
  emailVerification,
  welcome,
  passwordReset,
  passwordChangeConfirmation,
  staffVerificationCode,
  staffWelcome,
  repairerApplicationSubmitted,
  repairerApplicationApproved,
  repairerApplicationRejected,
  repairerApplicationChangesRequested,
  workshopRegistrationConfirmation,
  workshopRegistrationStatusUpdate,
  workshopReminder,
  workshopCancellation,
  workshopFeedbackRequest,
  workshopProposalSubmitted,
  workshopProposalApproved,
  workshopProposalRejected,
  workshopProposalChangesRequested,
  adminNewRepairerApplication,
  adminNewWorkshopProposal,
  adminNewBlogSubmission,
  adminNewSellerApplication,
  newsletterConfirmation,
  blogSubmissionReceived,
  newReviewNotification,
  sellerApplicationSubmitted,
  locationApprovalNotification,
  locationSubmissionConfirmation,
  contentSubmissionApproved,
  contentSubmissionRejected,

  // IT-Hilfe templates
  itHilfeRequestConfirmation,
  adminNewITHilfeRequest,
  helperNewMatchingRequest,

  // Appointment templates
  appointmentNewBooking,
  appointmentQuoteReceived,
  appointmentStatusUpdate,
  appointmentUnassignedAlert,

  // Marketplace templates
  listingPublishedConfirmation,
  newMarketplaceMessage,
  listingReviewNotification,
  orderConfirmationBuyer,
  newOrderNotificationSeller,
  orderStatusUpdate,

  // Decision templates
  decisionVotingOpened,
  decisionDeadlineReminder,

  // Notification template
  notificationEmail,

  // Base styles (for custom templates)
  BASE_STYLES,
  COPYRIGHT_TEXT,
  AUTO_GENERATED_TEXT,
  createEmailLayout,
  createTextFooter,
} from './email/index';
