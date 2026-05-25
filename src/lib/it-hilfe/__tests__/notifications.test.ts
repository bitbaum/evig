/**
 * Tests for it-hilfe/notifications.ts — fire-and-forget email dispatch.
 *
 * Mission-relevant: IT-Hilfe connects seniors and beginners with helpers.
 * If the requester confirmation isn't sent, they don't know their request
 * was received. If the helper query fails silently, no helpers get notified
 * and requests go unmatched.
 *
 * Behaviors locked:
 *   sendRequestCreatedNotifications
 *   - calls sendCustomEmail for requester when email is provided
 *   - calls sendCustomEmail for admin always
 *   - does NOT call sendCustomEmail for requester when email is absent
 *   - queries DB for matching helpers when skillsNeeded is non-empty
 *   - does NOT query DB when skillsNeeded is empty
 *   - sends one email per matched helper
 *   - does not throw even if email sends fail
 *
 *   sendItHilfeNotification
 *   - calls createInAppNotifications with correct parameters
 *   - does not throw if createInAppNotifications fails
 */

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeChain(result: unknown = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.select = jest.fn().mockReturnValue(chain)
  chain.from = jest.fn().mockReturnValue(chain)
  chain.innerJoin = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.groupBy = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbSelect = jest.fn(() => makeChain([]))

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect.apply(null, args),
  },
}))

jest.mock('@/db/schema/itHilfe', () => ({
  helperProfiles: { userId: 'hp_userId', isActive: 'hp_isActive' },
  userSkills: { userId: 'us_userId', skillId: 'us_skillId' },
}))

jest.mock('@/db/schema/auth', () => ({
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  ne: jest.fn().mockReturnValue({ __ne: true }),
  inArray: jest.fn().mockReturnValue({ __inArray: true }),
  sql: Object.assign(
    jest.fn().mockReturnValue({ __sql: 'mocked' }),
    { raw: jest.fn().mockReturnValue({ __raw: true }) },
  ),
}))

const mockSendCustomEmail = jest.fn()

jest.mock('@/lib/email', () => ({
  sendCustomEmail: (...args: unknown[]) => mockSendCustomEmail.apply(null, args),
}))

const mockCreateInAppNotifications = jest.fn()

jest.mock('@/lib/api/task-helpers', () => ({
  createInAppNotifications: (...args: unknown[]) => mockCreateInAppNotifications.apply(null, args),
}))

jest.mock('@/lib/email/templates/it-hilfe', () => ({
  itHilfeRequestConfirmation: jest.fn().mockReturnValue({ subject: 'Conf', html: 'H', text: 'T' }),
  adminNewITHilfeRequest: jest.fn().mockReturnValue({ subject: 'Admin', html: 'H', text: 'T' }),
  helperNewMatchingRequest: jest.fn().mockReturnValue({ subject: 'Helper', html: 'H', text: 'T' }),
}))

jest.mock('@/config/it-hilfe', () => ({
  getCategoryById: jest.fn().mockReturnValue({ name: 'Software' }),
  getUrgencyById: jest.fn().mockReturnValue({ name: 'Dringend' }),
  getServiceTypeById: jest.fn().mockReturnValue({ name: 'Fernwartung' }),
  getSkillById: jest.fn().mockReturnValue({ name: 'Windows' }),
  REVAMPIT_NOTIFICATION_EMAIL: 'notify@revamp-it.ch',
}))

jest.mock('@/config/urls', () => ({
  APP_URL: 'http://localhost:3000',
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { sendRequestCreatedNotifications, sendItHilfeNotification } from '../notifications'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_PARAMS = {
  requestId: 'req-1',
  requesterId: 'user-1',
  requesterName: 'Hans Müller',
  requesterEmail: 'hans@example.com',
  title: 'Laptop startet nicht',
  categoryId: 'hardware',
  urgency: 'high',
  canton: 'ZH',
  serviceType: 'remote',
  skillsNeeded: ['windows', 'hardware'],
  aiDiagnosis: null,
}

function flushAsync() {
  return new Promise<void>(resolve => setTimeout(resolve, 0))
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbSelect.mockImplementation(() => makeChain([]))
  mockSendCustomEmail.mockResolvedValue({ success: true, messageId: 'msg-1' })
  mockCreateInAppNotifications.mockResolvedValue({ success: true })
})

// ============================================================================
// sendRequestCreatedNotifications
// ============================================================================

describe('sendRequestCreatedNotifications', () => {
  it('sends confirmation email to requester when email is provided', async () => {
    sendRequestCreatedNotifications(BASE_PARAMS)
    await flushAsync()

    const calls = (mockSendCustomEmail.mock.calls as [string, unknown][]).map(([to]) => to)
    expect(calls).toContain('hans@example.com')
  })

  it('always sends admin notification email', async () => {
    sendRequestCreatedNotifications(BASE_PARAMS)
    await flushAsync()

    const calls = (mockSendCustomEmail.mock.calls as [string, unknown][]).map(([to]) => to)
    expect(calls).toContain('notify@revamp-it.ch')
  })

  it('does NOT send requester email when email is absent', async () => {
    sendRequestCreatedNotifications({ ...BASE_PARAMS, requesterEmail: '' })
    await flushAsync()

    const calls = (mockSendCustomEmail.mock.calls as [string, unknown][]).map(([to]) => to)
    expect(calls).not.toContain('')
    // Admin email still sent
    expect(calls).toContain('notify@revamp-it.ch')
  })

  it('SUPPRESSES requester confirmation when includeRequesterConfirmation is false', async () => {
    // The IT-Hilfe anonymous-post flow uses this: the dedicated claim
    // email replaces the standard confirmation (which would link to a
    // request the new user can't yet view).
    sendRequestCreatedNotifications({ ...BASE_PARAMS, includeRequesterConfirmation: false })
    await flushAsync()

    const calls = (mockSendCustomEmail.mock.calls as [string, unknown][]).map(([to]) => to)
    expect(calls).not.toContain('hans@example.com')
    // Admin notification still goes through
    expect(calls).toContain('notify@revamp-it.ch')
  })

  it('sends requester confirmation when includeRequesterConfirmation is true (explicit)', async () => {
    sendRequestCreatedNotifications({ ...BASE_PARAMS, includeRequesterConfirmation: true })
    await flushAsync()

    const calls = (mockSendCustomEmail.mock.calls as [string, unknown][]).map(([to]) => to)
    expect(calls).toContain('hans@example.com')
  })

  it('queries DB for matching helpers when skillsNeeded is non-empty', async () => {
    sendRequestCreatedNotifications(BASE_PARAMS)
    await flushAsync()

    expect(mockDbSelect).toHaveBeenCalledTimes(1)
  })

  it('does NOT query DB when skillsNeeded is empty', async () => {
    sendRequestCreatedNotifications({ ...BASE_PARAMS, skillsNeeded: [] })
    await flushAsync()

    expect(mockDbSelect).not.toHaveBeenCalled()
  })

  it('sends one email per matched helper', async () => {
    mockDbSelect.mockReturnValueOnce(
      makeChain([
        { userId: 'helper-1', name: 'Anna', email: 'anna@example.com', matchingSkills: ['windows'] },
        { userId: 'helper-2', name: 'Beat', email: 'beat@example.com', matchingSkills: ['hardware'] },
      ])
    )

    sendRequestCreatedNotifications(BASE_PARAMS)
    await flushAsync()

    const calls = (mockSendCustomEmail.mock.calls as [string, unknown][]).map(([to]) => to)
    expect(calls).toContain('anna@example.com')
    expect(calls).toContain('beat@example.com')
  })

  it('does not throw when sendCustomEmail fails', async () => {
    mockSendCustomEmail.mockRejectedValue(new Error('SMTP down'))

    // Should not throw
    expect(() => sendRequestCreatedNotifications(BASE_PARAMS)).not.toThrow()
    await flushAsync()
  })

  it('does not throw when DB query for helpers fails', async () => {
    mockDbSelect.mockImplementationOnce(() => {
      const chain = makeChain([])
      chain.then = (_res: unknown, rej: unknown) => Promise.reject(new Error('DB error')).then(_res as never, rej as never)
      return chain
    })

    expect(() => sendRequestCreatedNotifications(BASE_PARAMS)).not.toThrow()
    await flushAsync()
  })
})

// ============================================================================
// sendItHilfeNotification
// ============================================================================

describe('sendItHilfeNotification', () => {
  it('calls createInAppNotifications with correct parameters', async () => {
    sendItHilfeNotification({
      recipientIds: ['user-1', 'user-2'],
      title: 'Neue Anfrage',
      content: 'Jemand braucht Hilfe',
      requestId: 'req-1',
    })
    await flushAsync()

    expect(mockCreateInAppNotifications).toHaveBeenCalledWith({
      recipientIds: ['user-1', 'user-2'],
      title: 'Neue Anfrage',
      content: 'Jemand braucht Hilfe',
      relatedType: 'it_hilfe',
      relatedId: 'req-1',
    })
  })

  it('does not throw if createInAppNotifications fails', async () => {
    mockCreateInAppNotifications.mockRejectedValue(new Error('service down'))

    expect(() => sendItHilfeNotification({
      recipientIds: ['user-1'],
      title: 'Test',
      content: 'Content',
      requestId: 'req-1',
    })).not.toThrow()

    await flushAsync()
  })
})
