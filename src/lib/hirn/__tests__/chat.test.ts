/**
 * Tests for hirn/chat.ts — HIRN AI chat engine.
 *
 * Mission-relevant: the chat module is the staff-facing AI assistant.
 * If history is corrupted, subsequent responses lose context; if action
 * parsing is bypassed, the cockpit receives no action cards.
 *
 * Behaviors locked:
 *   chat
 *   - loads session history and includes it in messages
 *   - stores user message + assistant response in history (2 inserts)
 *   - does not throw when DB history save fails (best-effort)
 *   - returns cleaned content (action block stripped)
 *   - returns parsed action cards
 *
 *   getChatHistory
 *   - returns empty array when no history
 *   - returns mapped history rows
 *
 *   getUserSessions
 *   - calls db.execute and maps result rows
 *   - uses "Neues Gespräch" as fallback when first_message is null
 *
 *   deleteSession / clearUserHistory
 *   - each calls db.delete once
 */

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeChain(result: unknown = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.select = jest.fn().mockReturnValue(chain)
  chain.from = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.limit = jest.fn().mockReturnValue(chain)
  chain.orderBy = jest.fn().mockReturnValue(chain)
  chain.values = jest.fn().mockReturnValue(chain)
  chain.returning = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbSelect = jest.fn(() => makeChain([]))
const mockDbInsert = jest.fn(() => makeChain([]))
const mockDbDelete = jest.fn(() => makeChain([]))
const mockDbExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect.apply(null, args),
    insert: (...args: unknown[]) => mockDbInsert.apply(null, args),
    delete: (...args: unknown[]) => mockDbDelete.apply(null, args),
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  hirnChatHistory: {
    id: 'hch_id',
    sessionId: 'hch_sessionId',
    userId: 'hch_userId',
    role: 'hch_role',
    content: 'hch_content',
    createdAt: 'hch_createdAt',
    provider: 'hch_provider',
    model: 'hch_model',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  sql: Object.assign(
    jest.fn().mockReturnValue({ __sql: 'mocked' }),
    { raw: jest.fn().mockReturnValue({ __raw: true }) },
  ),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
  or: jest.fn().mockReturnValue({ __or: true }),
  asc: jest.fn().mockReturnValue({ __asc: true }),
  desc: jest.fn().mockReturnValue({ __desc: true }),
  isNull: jest.fn().mockReturnValue({ __isNull: true }),
  count: jest.fn().mockReturnValue({ __count: 0 }),
}))

// mockChatFn and mockGetDefaultChatProvider are declared here but only
// initialized after imports run; the closure in jest.mock captures them
// by reference so they're available when tests execute.
const mockChatFn = jest.fn()
const mockGetDefaultChatProvider = jest.fn()

jest.mock('../providers', () => ({
  // Wrapper captures mockGetDefaultChatProvider by reference (not by value),
  // so it resolves correctly when tests run (after module-level init).
  getDefaultChatProvider: (...args: unknown[]) => mockGetDefaultChatProvider.apply(null, args),
}))

jest.mock('../system-prompt', () => ({
  SYSTEM_PROMPT: 'You are a helpful assistant.',
}))

jest.mock('../action-cockpit', () => ({
  parseActionEnvelope: jest.fn().mockReturnValue({ actions: [], parsingError: null }),
  stripActionBlock: jest.fn().mockImplementation((content: string) => content),
}))

jest.mock('@/config/api-defaults', () => ({
  API_DEFAULTS: { CHAT_HISTORY_LIMIT: 50 },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import {
  chat,
  getChatHistory,
  getUserSessions,
  deleteSession,
  clearUserHistory,
} from '../chat'
import { parseActionEnvelope, stripActionBlock } from '../action-cockpit'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SESSION_ID = 'session-abc'
const USER_ID = 'user-1'

function makeHistoryRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'msg-1',
    role: 'user',
    content: 'Wie repariere ich einen ThinkPad-Akku?',
    createdAt: '2026-04-01T10:00:00Z',
    provider: null,
    model: null,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbSelect.mockImplementation(() => makeChain([]))
  mockDbInsert.mockImplementation(() => makeChain([]))
  mockDbDelete.mockImplementation(() => makeChain([]))
  mockDbExecute.mockResolvedValue({ rows: [] })
  mockChatFn.mockResolvedValue({
    content: 'Hier ist meine Antwort.',
    provider: 'groq',
    model: 'groq:llama-3.3-70b',
    usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
  })
  mockGetDefaultChatProvider.mockResolvedValue({ chat: mockChatFn })
  ;(parseActionEnvelope as jest.Mock).mockReturnValue({ actions: [], parsingError: null })
  ;(stripActionBlock as jest.Mock).mockImplementation((c: string) => c)
})

// ============================================================================
// chat — history and response
// ============================================================================

describe('chat', () => {
  it('loads session history and inserts 2 history records', async () => {
    mockDbSelect.mockImplementationOnce(() =>
      makeChain([makeHistoryRow({ role: 'user' }), makeHistoryRow({ role: 'assistant' })]),
    )

    await chat('Neue Frage', { sessionId: SESSION_ID, userId: USER_ID })

    expect(mockDbSelect).toHaveBeenCalledTimes(1)
    expect(mockDbInsert).toHaveBeenCalledTimes(2) // user msg + assistant response
  })

  it('does not throw when DB history save fails (best-effort)', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))
    mockDbInsert.mockImplementation(() => {
      throw new Error('DB connection lost')
    })

    // Should not throw despite DB error
    await expect(
      chat('Test', { sessionId: SESSION_ID })
    ).resolves.toBeDefined()
  })

  it('returns cleaned content with stripped action block', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))
    ;(stripActionBlock as jest.Mock).mockReturnValueOnce('Bereinigte Antwort')

    const result = await chat('Frage', { sessionId: SESSION_ID })

    expect(result.content).toBe('Bereinigte Antwort')
  })

  it('returns parsed action cards from response', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))
    ;(parseActionEnvelope as jest.Mock).mockReturnValueOnce({
      actions: [{ type: 'create_task', title: 'Akku prüfen' }],
      parsingError: null,
    })

    const result = await chat('Frage', { sessionId: SESSION_ID })

    expect(result.actions).toHaveLength(1)
  })

  it('returns provider and model from AI response', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await chat('Frage', { sessionId: SESSION_ID })

    expect(result.provider).toBe('groq')
    expect(result.model).toBe('groq:llama-3.3-70b')
  })
})

// ============================================================================
// getChatHistory
// ============================================================================

describe('getChatHistory', () => {
  it('returns empty array when no history', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]))

    const result = await getChatHistory(SESSION_ID, USER_ID)

    expect(result).toEqual([])
  })

  it('returns mapped history rows', async () => {
    mockDbSelect.mockImplementationOnce(() =>
      makeChain([makeHistoryRow({ role: 'assistant', provider: 'groq', model: 'groq:llama' })]),
    )

    const result = await getChatHistory(SESSION_ID, USER_ID)

    expect(result).toHaveLength(1)
    expect(result[0].role).toBe('assistant')
    expect(result[0].provider).toBe('groq')
    expect(result[0].model).toBe('groq:llama')
  })

  it('returns undefined for provider/model when null in DB', async () => {
    mockDbSelect.mockImplementationOnce(() =>
      makeChain([makeHistoryRow({ provider: null, model: null })]),
    )

    const result = await getChatHistory(SESSION_ID, USER_ID)

    expect(result[0].provider).toBeUndefined()
    expect(result[0].model).toBeUndefined()
  })
})

// ============================================================================
// getUserSessions
// ============================================================================

describe('getUserSessions', () => {
  it('calls db.execute and maps result rows', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [
        {
          session_id: 'session-1',
          first_message: 'Wie repariere ich?',
          last_activity: '2026-04-27T12:00:00Z',
          message_count: '4',
        },
      ],
    })

    const result = await getUserSessions(USER_ID)

    expect(result).toHaveLength(1)
    expect(result[0].sessionId).toBe('session-1')
    expect(result[0].firstMessage).toBe('Wie repariere ich?')
    expect(result[0].messageCount).toBe(4)
  })

  it('uses "Neues Gespräch" as fallback when first_message is null', async () => {
    mockDbExecute.mockResolvedValueOnce({
      rows: [
        {
          session_id: 'session-1',
          first_message: null,
          last_activity: '2026-04-27T12:00:00Z',
          message_count: '1',
        },
      ],
    })

    const result = await getUserSessions(USER_ID)

    expect(result[0].firstMessage).toBe('Neues Gespräch')
  })
})

// ============================================================================
// deleteSession / clearUserHistory
// ============================================================================

describe('deleteSession', () => {
  it('calls db.delete once', async () => {
    await deleteSession(SESSION_ID, USER_ID)
    expect(mockDbDelete).toHaveBeenCalledTimes(1)
  })
})

describe('clearUserHistory', () => {
  it('calls db.delete once', async () => {
    await clearUserHistory(USER_ID)
    expect(mockDbDelete).toHaveBeenCalledTimes(1)
  })
})
