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

// IT-Hilfe templates
export {
  itHilfeRequestConfirmation,
  adminNewITHilfeRequest,
  helperNewMatchingRequest,
} from './it-hilfe';

// Appointment templates
export {
  appointmentNewBooking,
  appointmentQuoteReceived,
  appointmentStatusUpdate,
  appointmentUnassignedAlert,
} from './appointments';

// Marketplace templates
export {
  listingPublishedConfirmation,
  newMarketplaceMessage,
  listingReviewNotification,
  orderConfirmationBuyer,
  newOrderNotificationSeller,
  orderStatusUpdate,
} from './marketplace';

// Base styles (for custom templates)
export { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createEmailLayout, createTextFooter } from './base-styles';
