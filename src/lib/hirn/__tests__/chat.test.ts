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
  const resolved = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockReturnValue(chain);
  chain.orderBy = vi.fn().mockReturnValue(chain);
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockReturnValue(chain);
  chain.then = (resolved as Promise<unknown>).then.bind(resolved);
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved);
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved);
  return chain;
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbSelect = vi.fn((..._args: unknown[]) => makeChain([]));
const mockDbInsert = vi.fn((..._args: unknown[]) => makeChain([]));
const mockDbDelete = vi.fn((..._args: unknown[]) => makeChain([]));
const mockDbExecute = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect(...args),
    insert: (...args: unknown[]) => mockDbInsert(...args),
    delete: (...args: unknown[]) => mockDbDelete(...args),
    execute: (...args: unknown[]) => mockDbExecute(...args),
  },
}));

vi.mock('@/db/schema', () => ({
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
}));

vi.mock('drizzle-orm', async () => ({
  ...(await vi.importActual('drizzle-orm')),
  sql: Object.assign(vi.fn().mockReturnValue({ __sql: 'mocked' }), {
    raw: vi.fn().mockReturnValue({ __raw: true }),
  }),
  eq: vi.fn().mockReturnValue({ __eq: true }),
  and: vi.fn().mockReturnValue({ __and: true }),
  or: vi.fn().mockReturnValue({ __or: true }),
  asc: vi.fn().mockReturnValue({ __asc: true }),
  desc: vi.fn().mockReturnValue({ __desc: true }),
  isNull: vi.fn().mockReturnValue({ __isNull: true }),
  count: vi.fn().mockReturnValue({ __count: 0 }),
}));

// mockGetChatResponse is declared here but only initialized after imports
// run; the closure in vi.mock captures it by reference so it's available
// when tests execute.
const mockGetChatResponse = vi.fn();

vi.mock('../providers', () => ({
  // Wrapper captures mockGetChatResponse by reference (not by value), so it
  // resolves correctly when tests run (after module-level init). chat.ts
  // calls getChatResponse (provider selection + generation + health
  // recording in one step) rather than getDefaultChatProvider directly.
  getChatResponse: (...args: unknown[]) => mockGetChatResponse(...args),
}));

vi.mock('../system-prompt', () => ({
  SYSTEM_PROMPT: 'You are a helpful assistant.',
}));

vi.mock('../action-cockpit', () => ({
  parseActionEnvelope: vi.fn().mockReturnValue({ actions: [], parsingError: null }),
  stripActionBlock: vi.fn().mockImplementation((content: string) => content),
}));

vi.mock('@/config/api-defaults', () => ({
  API_DEFAULTS: { CHAT_HISTORY_LIMIT: 50 },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import type { Mock } from 'vitest';
import { chat, getChatHistory, getUserSessions, deleteSession, clearUserHistory } from '../chat';
import { parseActionEnvelope, stripActionBlock } from '../action-cockpit';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SESSION_ID = 'session-abc';
const USER_ID = 'user-1';

function makeHistoryRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'msg-1',
    role: 'user',
    content: 'Wie repariere ich einen ThinkPad-Akku?',
    createdAt: '2026-04-01T10:00:00Z',
    provider: null,
    model: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockDbSelect.mockImplementation(() => makeChain([]));
  mockDbInsert.mockImplementation(() => makeChain([]));
  mockDbDelete.mockImplementation(() => makeChain([]));
  mockDbExecute.mockResolvedValue({ rows: [] });
  mockGetChatResponse.mockResolvedValue({
    content: 'Hier ist meine Antwort.',
    provider: 'groq',
    model: 'groq:llama-3.3-70b',
    usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
  });
  (parseActionEnvelope as Mock).mockReturnValue({ actions: [], parsingError: null });
  (stripActionBlock as Mock).mockImplementation((c: string) => c);
});

// ============================================================================
// chat — history and response
// ============================================================================

describe('chat', () => {
  it('loads session history and inserts 2 history records', async () => {
    mockDbSelect.mockImplementationOnce(() =>
      makeChain([makeHistoryRow({ role: 'user' }), makeHistoryRow({ role: 'assistant' })]),
    );

    await chat('Neue Frage', { sessionId: SESSION_ID, userId: USER_ID });

    expect(mockDbSelect).toHaveBeenCalledTimes(1);
    expect(mockDbInsert).toHaveBeenCalledTimes(2); // user msg + assistant response
  });

  it('does not throw when DB history save fails (best-effort)', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]));
    mockDbInsert.mockImplementation(() => {
      throw new Error('DB connection lost');
    });

    // Should not throw despite DB error
    await expect(chat('Test', { sessionId: SESSION_ID })).resolves.toBeDefined();
  });

  it('returns cleaned content with stripped action block', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]));
    (stripActionBlock as Mock).mockReturnValueOnce('Bereinigte Antwort');

    const result = await chat('Frage', { sessionId: SESSION_ID });

    expect(result.content).toBe('Bereinigte Antwort');
  });

  it('returns parsed action cards from response', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]));
    (parseActionEnvelope as Mock).mockReturnValueOnce({
      actions: [{ type: 'create_task', title: 'Akku prüfen' }],
      parsingError: null,
    });

    const result = await chat('Frage', { sessionId: SESSION_ID });

    expect(result.actions).toHaveLength(1);
  });

  it('returns provider and model from AI response', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]));

    const result = await chat('Frage', { sessionId: SESSION_ID });

    expect(result.provider).toBe('groq');
    expect(result.model).toBe('groq:llama-3.3-70b');
  });
});

// ============================================================================
// getChatHistory
// ============================================================================

describe('getChatHistory', () => {
  it('returns empty array when no history', async () => {
    mockDbSelect.mockImplementationOnce(() => makeChain([]));

    const result = await getChatHistory(SESSION_ID, USER_ID);

    expect(result).toEqual([]);
  });

  it('returns mapped history rows', async () => {
    mockDbSelect.mockImplementationOnce(() =>
      makeChain([makeHistoryRow({ role: 'assistant', provider: 'groq', model: 'groq:llama' })]),
    );

    const result = await getChatHistory(SESSION_ID, USER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('assistant');
    expect(result[0].provider).toBe('groq');
    expect(result[0].model).toBe('groq:llama');
  });

  it('returns undefined for provider/model when null in DB', async () => {
    mockDbSelect.mockImplementationOnce(() =>
      makeChain([makeHistoryRow({ provider: null, model: null })]),
    );

    const result = await getChatHistory(SESSION_ID, USER_ID);

    expect(result[0].provider).toBeUndefined();
    expect(result[0].model).toBeUndefined();
  });
});

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
    });

    const result = await getUserSessions(USER_ID);

    expect(result).toHaveLength(1);
    expect(result[0].sessionId).toBe('session-1');
    expect(result[0].firstMessage).toBe('Wie repariere ich?');
    expect(result[0].messageCount).toBe(4);
  });

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
    });

    const result = await getUserSessions(USER_ID);

    expect(result[0].firstMessage).toBe('Neues Gespräch');
  });
});

// ============================================================================
// deleteSession / clearUserHistory
// ============================================================================

describe('deleteSession', () => {
  it('calls db.delete once', async () => {
    await deleteSession(SESSION_ID, USER_ID);
    expect(mockDbDelete).toHaveBeenCalledTimes(1);
  });
});

describe('clearUserHistory', () => {
  it('calls db.delete once', async () => {
    await clearUserHistory(USER_ID);
    expect(mockDbDelete).toHaveBeenCalledTimes(1);
  });
});
