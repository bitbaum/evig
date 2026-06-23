/**
 * Tests for it-hilfe/notifications.ts after SS.1 central-pipeline migration.
 *
 * Mission-relevant: IT-Hilfe connects seniors and beginners with helpers.
 * If the requester confirmation isn't sent, they don't know their request
 * was received. If the helper query fails silently, no helpers get notified
 * and requests go unmatched.
 *
 * Behaviors locked:
 *   sendRequestCreatedNotifications
 *   - calls notifyUsers([requesterId]) for the confirmation
 *   - calls sendCustomEmail to the admin shared inbox (unchanged — not a
 *     per-user notification)
 *   - SUPPRESSES requester confirmation when includeRequesterConfirmation=false
 *   - queries DB for matching helpers when skillsNeeded is non-empty
 *   - calls notifyUsers(helperIds) for the matched helper fan-out
 *   - skips helper DB query + fan-out when skillsNeeded is empty
 *   - never throws even if downstream sends reject
 *
 *   sendItHilfeNotification
 *   - calls notifyUsers with the recipient IDs + IT_HILFE relation
 *   - never throws if notifyUsers rejects
 */

// ---------------------------------------------------------------------------
// Mock factory — chainable Drizzle query builder
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

const mockDbSelect = jest.fn(() => makeChain([]))

jest.mock('@/db', () => ({
  db: { select: (...args: unknown[]) => mockDbSelect.apply(null, args) },
}))

jest.mock('@/db/schema/itHilfe', () => ({
  userSkills: { userId: 'us_userId', skillId: 'us_skillId' },
}))

jest.mock('@/db/schema/auth', () => ({
  users: { id: 'u_id', name: 'u_name', email: 'u_email' },
}))

jest.mock('@/db/schema/services', () => ({
  repairerProfiles: {
    userId: 'rp_userId',
    isActive: 'rp_isActive',
    profileTier: 'rp_profileTier',
  },
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

const mockNotifyUsers = jest.fn()
jest.mock('@/lib/services/notifications', () => ({
  notifyUsers: (...args: unknown[]) => mockNotifyUsers.apply(null, args),
}))

jest.mock('@/lib/email/templates/it-hilfe', () => ({
  adminNewITHilfeRequest: jest.fn().mockReturnValue({ subject: 'Admin', html: 'H', text: 'T' }),
}))

jest.mock('@/config/it-hilfe', () => ({
  getCategoryById: jest.fn().mockReturnValue({ name: 'Software' }),
  getUrgencyById: jest.fn().mockReturnValue({ name: 'Dringend' }),
  getServiceTypeById: jest.fn().mockReturnValue({ name: 'Fernwartung' }),
  getSkillById: jest.fn().mockReturnValue({ name: 'Windows' }),
  REVAMPIT_NOTIFICATION_EMAIL: 'notify@revamp-it.ch',
}))

jest.mock('@/config/urls', () => ({ APP_URL: 'http://localhost:3000' }))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { sendRequestCreatedNotifications, sendItHilfeNotification } from '../notifications'
import { NOTIFICATION_TYPES, RELATED_TYPES } from '@/config/notifications'

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
  mockNotifyUsers.mockResolvedValue(undefined)
})

// ============================================================================
// sendRequestCreatedNotifications
// ============================================================================

describe('sendRequestCreatedNotifications', () => {
  it('notifies the requester via notifyUsers with the IT_HILFE_REQUEST_CONFIRMATION type', async () => {
    sendRequestCreatedNotifications(BASE_PARAMS)
    await flushAsync()

    expect(mockNotifyUsers).toHaveBeenCalledWith(
      ['user-1'],
      expect.objectContaining({
        type: NOTIFICATION_TYPES.IT_HILFE_REQUEST_CONFIRMATION,
        related_type: RELATED_TYPES.IT_HILFE,
        related_id: 'req-1',
        metadata: expect.objectContaining({ requestUrl: 'http://localhost:3000/it-hilfe/req-1' }),
      }),
    )
  })

  it('always sends admin alert via sendCustomEmail (shared inbox path unchanged)', async () => {
    sendRequestCreatedNotifications(BASE_PARAMS)
    await flushAsync()

    const calls = (mockSendCustomEmail.mock.calls as [string, unknown][]).map(([to]) => to)
    expect(calls).toContain('notify@revamp-it.ch')
  })

  it('SUPPRESSES requester confirmation when includeRequesterConfirmation=false', async () => {
    sendRequestCreatedNotifications({ ...BASE_PARAMS, includeRequesterConfirmation: false })
    await flushAsync()

    // No requester notifyUsers call — only helper fan-out (if any helpers matched).
    const requesterCall = mockNotifyUsers.mock.calls.find(
      (call) => Array.isArray(call[0]) && call[0].includes('user-1'),
    )
    expect(requesterCall).toBeUndefined()

    // Admin email still goes through.
    const adminCalls = (mockSendCustomEmail.mock.calls as [string, unknown][]).map(([to]) => to)
    expect(adminCalls).toContain('notify@revamp-it.ch')
  })

  it('sends requester confirmation when includeRequesterConfirmation=true (explicit)', async () => {
    sendRequestCreatedNotifications({ ...BASE_PARAMS, includeRequesterConfirmation: true })
    await flushAsync()

    expect(mockNotifyUsers).toHaveBeenCalledWith(
      ['user-1'],
      expect.objectContaining({ type: NOTIFICATION_TYPES.IT_HILFE_REQUEST_CONFIRMATION }),
    )
  })

  it('queries DB for matching helpers when skillsNeeded is non-empty', async () => {
    sendRequestCreatedNotifications(BASE_PARAMS)
    await flushAsync()

    expect(mockDbSelect).toHaveBeenCalled()
  })

  it('skips helper DB query when skillsNeeded is empty', async () => {
    sendRequestCreatedNotifications({ ...BASE_PARAMS, skillsNeeded: [] })
    await flushAsync()

    expect(mockDbSelect).not.toHaveBeenCalled()
  })

  it('notifies an explicitly selected technician even without matching skills', async () => {
    sendRequestCreatedNotifications({
      ...BASE_PARAMS,
      skillsNeeded: [],
      preferredTechnicianUserId: 'george-user',
    })
    await flushAsync()

    expect(mockNotifyUsers).toHaveBeenCalledWith(
      ['george-user'],
      expect.objectContaining({
        type: NOTIFICATION_TYPES.IT_HILFE_MATCHING_REQUEST,
        title: expect.stringContaining('Direkte Anfrage'),
      }),
    )
    expect(mockDbSelect).not.toHaveBeenCalled()
  })

  it('fans out to matched helpers via single notifyUsers call', async () => {
    mockDbSelect.mockImplementation(() =>
      makeChain([
        { userId: 'helper-1', name: 'Anna', matchingSkills: ['windows'] },
        { userId: 'helper-2', name: 'Bob', matchingSkills: ['hardware'] },
      ]),
    )

    sendRequestCreatedNotifications(BASE_PARAMS)
    await flushAsync()
    await flushAsync()

    const helperCall = mockNotifyUsers.mock.calls.find(
      (call) =>
        Array.isArray(call[0]) &&
        (call[1] as { type?: string })?.type === NOTIFICATION_TYPES.IT_HILFE_MATCHING_REQUEST,
    )
    expect(helperCall).toBeDefined()
    expect(helperCall![0]).toEqual(expect.arrayContaining(['helper-1', 'helper-2']))
  })

  it('does NOT fan out when no helpers match', async () => {
    mockDbSelect.mockImplementation(() => makeChain([]))

    sendRequestCreatedNotifications(BASE_PARAMS)
    await flushAsync()

    const helperCall = mockNotifyUsers.mock.calls.find(
      (call) =>
        (call[1] as { type?: string })?.type === NOTIFICATION_TYPES.IT_HILFE_MATCHING_REQUEST,
    )
    expect(helperCall).toBeUndefined()
  })

  it('does not throw when notifyUsers rejects', async () => {
    mockNotifyUsers.mockRejectedValue(new Error('central pipeline down'))

    expect(() => sendRequestCreatedNotifications(BASE_PARAMS)).not.toThrow()
    await flushAsync()
  })

  it('does not throw when sendCustomEmail rejects (admin alert)', async () => {
    mockSendCustomEmail.mockRejectedValue(new Error('SMTP down'))

    expect(() => sendRequestCreatedNotifications(BASE_PARAMS)).not.toThrow()
    await flushAsync()
  })
})

// ============================================================================
// sendItHilfeNotification
// ============================================================================

describe('sendItHilfeNotification', () => {
  it('routes through notifyUsers with the recipient IDs + IT_HILFE relation', async () => {
    sendItHilfeNotification({
      recipientIds: ['user-1', 'user-2'],
      title: 'Neue Anfrage',
      content: 'Jemand braucht Hilfe',
      requestId: 'req-1',
    })
    await flushAsync()

    expect(mockNotifyUsers).toHaveBeenCalledWith(
      ['user-1', 'user-2'],
      expect.objectContaining({
        title: 'Neue Anfrage',
        content: 'Jemand braucht Hilfe',
        related_type: RELATED_TYPES.IT_HILFE,
        related_id: 'req-1',
      }),
    )
  })

  it('does not throw when notifyUsers rejects', async () => {
    mockNotifyUsers.mockRejectedValue(new Error('central pipeline down'))

    expect(() =>
      sendItHilfeNotification({
        recipientIds: ['user-1'],
        title: 't',
        content: 'c',
        requestId: 'req-1',
      }),
    ).not.toThrow()
    await flushAsync()
  })
})
