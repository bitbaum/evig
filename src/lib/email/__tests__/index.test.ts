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
 *   - uses SMTP when provider is 'smtp'
 *   - uses Listmonk when provider is 'listmonk'
 *   - falls back to SMTP when Listmonk throws
 *   - returns { success: true, messageId } on SMTP success
 *   - returns { success: false, error } on total failure (never throws)
 *
 *   sendCustomEmail
 *   - sends content directly via SMTP when provider is 'smtp'
 *   - uses Listmonk when provider is 'listmonk'
 *   - falls back to SMTP when Listmonk throws
 *   - returns { success: false, error } on failure
 */

// ---------------------------------------------------------------------------
// Template mocks (inline arrow fns — no external var references allowed in
// jest.mock factories due to hoisting before variable declarations)
// ---------------------------------------------------------------------------

const DEFAULT_EMAIL = () => ({ subject: 'Test Email', html: '<p>Test</p>', text: 'Test' })

jest.mock('../templates/auth', () => ({
  verificationCode: jest.fn(() => ({ subject: 'Test Email', html: '<p>Test</p>', text: 'Test' })),
  staffVerificationCode: jest.fn(() => ({ subject: 'Test Email', html: '<p>Test</p>', text: 'Test' })),
  emailVerification: jest.fn(() => ({ subject: 'Test Email', html: '<p>Test</p>', text: 'Test' })),
  welcome: jest.fn(() => ({ subject: 'Test Email', html: '<p>Test</p>', text: 'Test' })),
  staffWelcome: jest.fn(() => ({ subject: 'Test Email', html: '<p>Test</p>', text: 'Test' })),
  passwordReset: jest.fn(() => ({ subject: 'Test Email', html: '<p>Test</p>', text: 'Test' })),
  passwordChangeConfirmation: jest.fn(() => ({ subject: 'Test Email', html: '<p>Test</p>', text: 'Test' })),
}))

jest.mock('../templates/workshop', () => ({
  workshopRegistrationConfirmation: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  workshopRegistrationStatusUpdate: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  workshopReminder: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  workshopCancellation: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  workshopFeedbackRequest: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  workshopProposalSubmitted: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  workshopProposalApproved: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  workshopProposalRejected: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  workshopProposalChangesRequested: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
}))

jest.mock('../templates/admin', () => ({
  adminNewWorkshopProposal: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  adminNewBlogSubmission: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  adminNewSellerApplication: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
}))

jest.mock('../templates/misc', () => ({
  newsletterConfirmation: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  blogSubmissionReceived: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  blogSubmissionApproved: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  blogSubmissionRejected: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  blogSubmissionPublished: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  blogSubmissionChangesRequested: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  newReviewNotification: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  sellerApplicationSubmitted: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  locationApprovalNotification: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  locationSubmissionConfirmation: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  contentSubmissionApproved: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  contentSubmissionRejected: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
}))

jest.mock('../templates/it-hilfe', () => ({
  itHilfeRequestConfirmation: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  adminNewITHilfeRequest: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  helperNewMatchingRequest: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
}))

jest.mock('../templates/appointments', () => ({
  appointmentNewBooking: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  appointmentQuoteReceived: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  appointmentStatusUpdate: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  appointmentUnassignedAlert: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
}))

jest.mock('../templates/decisions', () => ({
  decisionVotingOpened: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  decisionDeadlineReminder: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
  decisionClosed: jest.fn(() => ({ subject: 'T', html: 'H', text: 'T' })),
}))

jest.mock('../templates', () => ({}))

// ---------------------------------------------------------------------------
// Transport and provider mocks
// ---------------------------------------------------------------------------

const mockSendMail = jest.fn()
const mockGetTransporter = jest.fn()
const mockGetFromEmail = jest.fn()

jest.mock('../transporter', () => ({
  getTransporter: (...args: unknown[]) => mockGetTransporter.apply(null, args),
  getFromEmail: (...args: unknown[]) => mockGetFromEmail.apply(null, args),
  testEmailConfig: jest.fn(),
}))

const mockSendViaListmonk = jest.fn()
const mockIsListmonkEnabled = jest.fn()

jest.mock('../listmonk', () => ({
  sendViaListmonk: (...args: unknown[]) => mockSendViaListmonk.apply(null, args),
  testListmonkConnection: jest.fn(),
  isListmonkEnabled: (...args: unknown[]) => mockIsListmonkEnabled.apply(null, args),
  subscribeToList: jest.fn(),
  getListmonkConfig: jest.fn(),
}))

const mockGetEmailProvider = jest.fn()

jest.mock('@/config/email', () => ({
  getEmailProvider: (...args: unknown[]) => mockGetEmailProvider.apply(null, args),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { sendEmail, sendCustomEmail } from '../index'
import type { EmailContent } from '../types'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const RECIPIENT = 'hans@revamp-it.ch'

const CUSTOM_CONTENT: EmailContent = {
  subject: 'Benutzerdefinierte E-Mail',
  html: '<p>Hallo</p>',
  text: 'Hallo',
}

beforeEach(() => {
  jest.clearAllMocks()

  // Default: SMTP provider
  mockGetEmailProvider.mockReturnValue('smtp')
  mockGetFromEmail.mockReturnValue('noreply@revamp-it.ch')
  mockSendMail.mockResolvedValue({ messageId: 'smtp-msg-1' })
  mockGetTransporter.mockResolvedValue({ sendMail: mockSendMail })
  mockSendViaListmonk.mockResolvedValue({ success: true, messageId: 'listmonk-msg-1' })
})

// ============================================================================
// sendEmail
// ============================================================================

describe('sendEmail', () => {
  it('sends via SMTP when provider is smtp and returns success', async () => {
    const result = await sendEmail(RECIPIENT, 'verificationCode', 'Hans')

    expect(mockSendMail).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.messageId).toBe('smtp-msg-1')
    }
    expect(mockSendViaListmonk).not.toHaveBeenCalled()
  })

  it('sends via Listmonk when provider is listmonk', async () => {
    mockGetEmailProvider.mockReturnValue('listmonk')

    const result = await sendEmail(RECIPIENT, 'verificationCode', 'Hans')

    expect(mockSendViaListmonk).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(true)
    expect(mockSendMail).not.toHaveBeenCalled()
  })

  it('falls back to SMTP when Listmonk throws', async () => {
    mockGetEmailProvider.mockReturnValue('listmonk')
    mockSendViaListmonk.mockRejectedValueOnce(new Error('Listmonk unavailable'))

    const result = await sendEmail(RECIPIENT, 'verificationCode', 'Hans')

    expect(mockSendViaListmonk).toHaveBeenCalledTimes(1)
    expect(mockSendMail).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(true)
  })

  it('returns { success: false, error } on total failure (never throws)', async () => {
    mockGetTransporter.mockRejectedValueOnce(new Error('No SMTP config'))

    const result = await sendEmail(RECIPIENT, 'verificationCode')

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBeTruthy()
    }
  })
})

// ============================================================================
// sendCustomEmail
// ============================================================================

describe('sendCustomEmail', () => {
  it('sends content via SMTP when provider is smtp', async () => {
    const result = await sendCustomEmail(RECIPIENT, CUSTOM_CONTENT)

    expect(mockSendMail).toHaveBeenCalledTimes(1)
    const callArgs = mockSendMail.mock.calls[0][0]
    expect(callArgs.subject).toBe(CUSTOM_CONTENT.subject)
    expect(result.success).toBe(true)
  })

  it('sends via Listmonk when provider is listmonk', async () => {
    mockGetEmailProvider.mockReturnValue('listmonk')

    const result = await sendCustomEmail(RECIPIENT, CUSTOM_CONTENT)

    expect(mockSendViaListmonk).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(true)
    expect(mockSendMail).not.toHaveBeenCalled()
  })

  it('falls back to SMTP when Listmonk throws', async () => {
    mockGetEmailProvider.mockReturnValue('listmonk')
    mockSendViaListmonk.mockRejectedValueOnce(new Error('timeout'))

    const result = await sendCustomEmail(RECIPIENT, CUSTOM_CONTENT)

    expect(mockSendMail).toHaveBeenCalledTimes(1)
    expect(result.success).toBe(true)
  })

  it('returns { success: false, error } on failure', async () => {
    mockGetTransporter.mockRejectedValueOnce(new Error('connection refused'))

    const result = await sendCustomEmail(RECIPIENT, CUSTOM_CONTENT)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('connection refused')
    }
  })
})
