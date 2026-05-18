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
  passwordChangeConfirmation,
  staffVerificationCode,
  staffWelcome,
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
  workshopProposalApproved,
  workshopProposalRejected,
  workshopProposalChangesRequested,
} from './workshop';

// Admin notification templates
export {
  adminNewRepairerApplication,
  adminNewWorkshopProposal,
  adminNewBlogSubmission,
  adminNewSellerApplication,
} from './admin';

// Newsletter templates
export { newsletterConfirmation } from './newsletter';

// Blog submission templates
export {
  blogSubmissionReceived,
  blogSubmissionApproved,
  blogSubmissionRejected,
  blogSubmissionPublished,
  blogSubmissionChangesRequested,
} from './blog';

// Review templates
export { newReviewNotification } from './reviews';

// Seller templates
export { sellerApplicationSubmitted } from './sellers';

// Content moderation templates
export { contentSubmissionApproved, contentSubmissionRejected } from './content';

// Location templates
export { locationApprovalNotification, locationSubmissionConfirmation } from './locations';

// IT-Hilfe templates
export {
  itHilfeRequestConfirmation,
  adminNewITHilfeRequest,
  helperNewMatchingRequest,
  itHilfeCompleted,
  itHilfeReviewReceived,
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
  orderReceiptConfirmed,
  orderReviewPrompt,
  orderReviewReceived,
} from './marketplace';

// Decision templates
export {
  decisionVotingOpened,
  decisionDeadlineReminder,
  decisionClosed,
} from './decisions';

// Notification template (generic, used by notification service)
export { notificationEmail } from './notification';

// Inquiry (Mitmachen contact form)
export { inquiryNotification, inquiryConfirmation } from './inquiry';

// Referral / invitation templates
export { referralInvitation, referralCouponReceived } from './referral';

// Base styles (for custom templates)
export { BASE_STYLES, COPYRIGHT_TEXT, AUTO_GENERATED_TEXT, createEmailLayout, createTextFooter } from './base-styles';
