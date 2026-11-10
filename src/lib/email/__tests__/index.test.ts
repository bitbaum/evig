/**
 * Tests for email/index.ts — email dispatch with provider routing.
 *
 * Mission-relevant: email is the primary communication channel for
 * verification codes, workshop confirmations, and repair appointments.
 * A broken provider fallback silently drops emails; a swallowed error
 * leaves callers with a success result for a failed send.
 *
 * Behaviors locked:
 *   sendEmail
 *   - uses Resend when provider is 'resend'
 *   - uses Listmonk when provider is 'listmonk'
 *   - falls back to Resend when Listmonk throws
 *   - returns { success: true, messageId } on Resend success
 *   - returns { success: false, error } on total failure (never throws)
 *
 *   sendCustomEmail
 *   - sends content via Resend when provider is 'resend'
 *   - uses Listmonk when provider is 'listmonk'
 *   - falls back to Resend when Listmonk throws
 *   - returns { success: false, error } on failure
 */

// ---------------------------------------------------------------------------
// Template mocks (inline arrow fns — no external var references allowed in
// vi.mock factories due to hoisting before variable declarations)
// ---------------------------------------------------------------------------

const DEFAULT_EMAIL = () => ({ subject: 'Test Email', html: '<p>Test</p>', text: 'Test' });

vi.mock('../templates/auth', () => ({
  verificationCode: vi.fn((..._args: unknown[]) => ({
    subject: 'Test Email',
    html: '<p>Test</p>',
    text: 'Test',
  })),
  staffVerificationCode: vi.fn((..._args: unknown[]) => ({
    subject: 'Test Email',
    html: '<p>Test</p>',
    text: 'Test',
  })),
  emailVerification: vi.fn((..._args: unknown[]) => ({
    subject: 'Test Email',
    html: '<p>Test</p>',
    text: 'Test',
  })),
  welcome: vi.fn((..._args: unknown[]) => ({
    subject: 'Test Email',
    html: '<p>Test</p>',
    text: 'Test',
  })),
  staffWelcome: vi.fn((..._args: unknown[]) => ({
    subject: 'Test Email',
    html: '<p>Test</p>',
    text: 'Test',
  })),
  passwordReset: vi.fn((..._args: unknown[]) => ({
    subject: 'Test Email',
    html: '<p>Test</p>',
    text: 'Test',
  })),
  passwordChangeConfirmation: vi.fn((..._args: unknown[]) => ({
    subject: 'Test Email',
    html: '<p>Test</p>',
    text: 'Test',
  })),
}));

vi.mock('../templates/workshop', () => ({
  workshopRegistrationConfirmation: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
  workshopRegistrationStatusUpdate: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
  workshopReminder: vi.fn((..._args: unknown[]) => ({ subject: 'T', html: 'H', text: 'T' })),
  workshopCancellation: vi.fn((..._args: unknown[]) => ({ subject: 'T', html: 'H', text: 'T' })),
  workshopFeedbackRequest: vi.fn((..._args: unknown[]) => ({ subject: 'T', html: 'H', text: 'T' })),
  workshopProposalSubmitted: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
  workshopProposalApproved: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
  workshopProposalRejected: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
  workshopProposalChangesRequested: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
}));

vi.mock('../templates/admin', () => ({
  adminNewWorkshopProposal: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
  adminNewBlogSubmission: vi.fn((..._args: unknown[]) => ({ subject: 'T', html: 'H', text: 'T' })),
  adminNewSellerApplication: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
}));

vi.mock('../templates/misc', () => ({
  newsletterConfirmation: vi.fn((..._args: unknown[]) => ({ subject: 'T', html: 'H', text: 'T' })),
  blogSubmissionReceived: vi.fn((..._args: unknown[]) => ({ subject: 'T', html: 'H', text: 'T' })),
  blogSubmissionApproved: vi.fn((..._args: unknown[]) => ({ subject: 'T', html: 'H', text: 'T' })),
  blogSubmissionRejected: vi.fn((..._args: unknown[]) => ({ subject: 'T', html: 'H', text: 'T' })),
  blogSubmissionPublished: vi.fn((..._args: unknown[]) => ({ subject: 'T', html: 'H', text: 'T' })),
  blogSubmissionChangesRequested: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
  newReviewNotification: vi.fn((..._args: unknown[]) => ({ subject: 'T', html: 'H', text: 'T' })),
  sellerApplicationSubmitted: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
  locationApprovalNotification: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
  locationSubmissionConfirmation: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
  contentSubmissionApproved: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
  contentSubmissionRejected: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
}));

vi.mock('../templates/it-hilfe', () => ({
  itHilfeRequestConfirmation: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
  adminNewITHilfeRequest: vi.fn((..._args: unknown[]) => ({ subject: 'T', html: 'H', text: 'T' })),
  helperNewMatchingRequest: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
}));

vi.mock('../templates/appointments', () => ({
  appointmentNewBooking: vi.fn((..._args: unknown[]) => ({ subject: 'T', html: 'H', text: 'T' })),
  appointmentQuoteReceived: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
  appointmentStatusUpdate: vi.fn((..._args: unknown[]) => ({ subject: 'T', html: 'H', text: 'T' })),
  appointmentUnassignedAlert: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
}));

vi.mock('../templates/decisions', () => ({
  decisionVotingOpened: vi.fn((..._args: unknown[]) => ({ subject: 'T', html: 'H', text: 'T' })),
  decisionDeadlineReminder: vi.fn((..._args: unknown[]) => ({
    subject: 'T',
    html: 'H',
    text: 'T',
  })),
  decisionClosed: vi.fn((..._args: unknown[]) => ({ subject: 'T', html: 'H', text: 'T' })),
}));

vi.mock('../templates', () => ({}));

// ---------------------------------------------------------------------------
// Transport and provider mocks
// ---------------------------------------------------------------------------

const mockSendViaResend = vi.fn();

vi.mock('../resend', () => ({
  sendViaResend: (...args: unknown[]) => mockSendViaResend(...args),
  testResendConnection: vi.fn(),
  isResendEnabled: vi.fn(),
}));

const mockSendViaListmonk = vi.fn();
const mockIsListmonkEnabled = vi.fn();

vi.mock('../listmonk', () => ({
  sendViaListmonk: (...args: unknown[]) => mockSendViaListmonk(...args),
  testListmonkConnection: vi.fn(),
  isListmonkEnabled: (...args: unknown[]) => mockIsListmonkEnabled(...args),
  subscribeToList: vi.fn(),
  getListmonkConfig: vi.fn(),
}));

const mockGetEmailProvider = vi.fn();

vi.mock('@/config/email', () => ({
  getEmailProvider: (...args: unknown[]) => mockGetEmailProvider(...args),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { sendEmail, sendCustomEmail } from '../index';
import type { EmailContent } from '../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RECIPIENT = 'hans@revamp-it.ch';

const CUSTOM_CONTENT: EmailContent = {
  subject: 'Benutzerdefinierte E-Mail',
  html: '<p>Hallo</p>',
  text: 'Hallo',
};

beforeEach(() => {
  vi.clearAllMocks();

  // Default: Resend provider
  mockGetEmailProvider.mockReturnValue('resend');
  mockSendViaResend.mockResolvedValue({ success: true, messageId: 'resend-msg-1' });
  mockSendViaListmonk.mockResolvedValue({ success: true, messageId: 'listmonk-msg-1' });
});

// ============================================================================
// sendEmail
// ============================================================================

describe('sendEmail', () => {
  it('sends via Resend when provider is resend and returns success', async () => {
    const result = await sendEmail(RECIPIENT, 'verificationCode', 'Hans');

    expect(mockSendViaResend).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.messageId).toBe('resend-msg-1');
    }
    expect(mockSendViaListmonk).not.toHaveBeenCalled();
  });

  it('sends via Listmonk when provider is listmonk', async () => {
    mockGetEmailProvider.mockReturnValue('listmonk');

    const result = await sendEmail(RECIPIENT, 'verificationCode', 'Hans');

    expect(mockSendViaListmonk).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(mockSendViaResend).not.toHaveBeenCalled();
  });

  it('falls back to Resend when Listmonk throws', async () => {
    mockGetEmailProvider.mockReturnValue('listmonk');
    mockSendViaListmonk.mockRejectedValueOnce(new Error('Listmonk unavailable'));

    const result = await sendEmail(RECIPIENT, 'verificationCode', 'Hans');

    expect(mockSendViaListmonk).toHaveBeenCalledTimes(1);
    expect(mockSendViaResend).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  it('returns { success: false, error } on total failure (never throws)', async () => {
    mockSendViaResend.mockRejectedValueOnce(
      new Error('Resend send failed: RESEND_API_KEY is not set'),
    );

    const result = await sendEmail(RECIPIENT, 'verificationCode');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });
});

// ============================================================================
// sendCustomEmail
// ============================================================================

describe('sendCustomEmail', () => {
  it('sends content via Resend when provider is resend', async () => {
    const result = await sendCustomEmail(RECIPIENT, CUSTOM_CONTENT);

    expect(mockSendViaResend).toHaveBeenCalledTimes(1);
    const callArgs = mockSendViaResend.mock.calls[0][1];
    expect(callArgs.subject).toBe(CUSTOM_CONTENT.subject);
    expect(result.success).toBe(true);
  });

  it('sends via Listmonk when provider is listmonk', async () => {
    mockGetEmailProvider.mockReturnValue('listmonk');

    const result = await sendCustomEmail(RECIPIENT, CUSTOM_CONTENT);

    expect(mockSendViaListmonk).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(mockSendViaResend).not.toHaveBeenCalled();
  });

  it('falls back to Resend when Listmonk throws', async () => {
    mockGetEmailProvider.mockReturnValue('listmonk');
    mockSendViaListmonk.mockRejectedValueOnce(new Error('timeout'));

    const result = await sendCustomEmail(RECIPIENT, CUSTOM_CONTENT);

    expect(mockSendViaResend).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  it('returns { success: false, error } on failure', async () => {
    mockSendViaResend.mockRejectedValueOnce(new Error('connection refused'));

    const result = await sendCustomEmail(RECIPIENT, CUSTOM_CONTENT);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('connection refused');
    }
  });
});
