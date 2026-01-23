/**
 * Email Templates Index
 *
 * Re-exports all email templates for centralized access.
 */

// Auth templates
export {
  verificationCode,
  emailVerification,
  welcome,
  passwordReset,
} from './auth';

// Repairer application templates
export {
  repairerApplicationSubmitted,
  repairerApplicationApproved,
  repairerApplicationRejected,
  repairerApplicationChangesRequested,
} from './repairer';

// Workshop templates
export {
  workshopRegistrationConfirmation,
  workshopRegistrationStatusUpdate,
  workshopReminder,
  workshopCancellation,
  workshopFeedbackRequest,
  workshopProposalSubmitted,
} from './workshop';

// Admin notification templates
export {
  adminNewRepairerApplication,
  adminNewWorkshopProposal,
  adminNewBlogSubmission,
  adminNewSellerApplication,
} from './admin';

// Misc templates
export {
  newsletterConfirmation,
  blogSubmissionReceived,
  newReviewNotification,
  sellerApplicationSubmitted,
  locationApprovalNotification,
} from './misc';

// Base styles (for custom templates)
export { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createEmailLayout, createTextFooter } from './base-styles';
