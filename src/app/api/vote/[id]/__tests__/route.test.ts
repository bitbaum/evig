/**
 * @vitest-environment node
 *
 * Tests for GET /api/vote/[id] (public) and POST /api/vote/[id] (public)
 *
 * Behaviors locked:
 *   GET  - 404 (decision not found), 200 (with decision data)
 *   POST - 400 (no email), 400 (no voteData),
 *          400 (submitVote returns error), 200 (anonymous success)
 *
 * Security invariant (the reason this route exists in its current shape):
 * an unauthenticated caller can NEVER vote as a registered member. Identity
 * comes from the session; a body email only ever names an anonymous voter.
 * The negative cases below are the point — they assert the closed side.
 */

const mockGetPublicDecision = vi.fn();
const mockSubmitVote = vi.fn();
const mockAuth = vi.fn();
const mockGetDbUserId = vi.fn();

vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/lib/api/task-helpers', () => ({
  getDbUserId: (...args: unknown[]) => mockGetDbUserId(...args),
}));

vi.mock('@/lib/services/decisions', () => ({
  getPublicDecision: (...args: unknown[]) => mockGetPublicDecision(...args),
  submitVote: (...args: unknown[]) => mockSubmitVote(...args),
}));

const mockQuery = vi.fn();

vi.mock('@/lib/auth/db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

vi.mock('@/config/database', () => ({
  TABLE_NAMES: { USERS: 'users' },
}));

vi.mock('@/lib/api/helpers', async () => {
  return {
    apiSuccess: (data: unknown, status = 200) =>
      NextResponse.json({ success: true, data }, { status }),
    apiSuccessCached: (data: unknown) =>
      NextResponse.json({ success: true, data }, { status: 200 }),
    apiError: (_err: unknown, msg: string, status = 500) =>
      NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, errors?: unknown, code?: string) =>
      NextResponse.json({ success: false, error: msg, ...(code && { code }) }, { status: 400 }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/security/rate-limit', () => ({
  rateLimiters: { voteSubmit: vi.fn((..._args: unknown[]) => true) },
  getClientIdentifier: vi.fn((..._args: unknown[]) => '127.0.0.1'),
}));

import type { Mock } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../route';
import { rateLimiters } from '@/lib/security/rate-limit';

const MOCK_DECISION = {
  id: 'decision-1',
  title: 'Test Decision',
  description: 'Should we do X?',
  background: 'Context here',
  status: 'voting',
  votingMethod: 'single_choice',
  options: [
    { id: 'opt-1', label: 'Yes' },
    { id: 'opt-2', label: 'No' },
  ],
  dotCount: 3,
  votingDeadline: new Date().toISOString(),
};

beforeEach(() => {
  vi.resetAllMocks();

  (rateLimiters.voteSubmit as Mock).mockReturnValue(true);
  mockGetPublicDecision.mockResolvedValue(MOCK_DECISION);
  // Default: no session, and the typed email belongs to nobody — the ordinary
  // "someone opened a shared link" case.
  mockAuth.mockResolvedValue(null);
  mockQuery.mockResolvedValue({ rows: [] });
  mockGetDbUserId.mockResolvedValue({ dbUserId: 'user-1' });
  mockSubmitVote.mockResolvedValue({ vote: { id: 'vote-1', optionId: 'opt-1' } });
});

// ============================================================================
// GET — decision not found
// ============================================================================

describe('GET /api/vote/[id] — decision not found', () => {
  it('returns 404 when decision is null', async () => {
    mockGetPublicDecision.mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost/api/vote/nonexistent');
    const response = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/nicht gefunden/i);
  });
});

// ============================================================================
// GET — success
// ============================================================================

describe('GET /api/vote/[id] — success', () => {
  it('returns 200 with decision data', async () => {
    const req = new NextRequest('http://localhost/api/vote/decision-1');
    const response = await GET(req, { params: Promise.resolve({ id: 'decision-1' }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('decision-1');
    expect(body.data.title).toBe('Test Decision');
    expect(body.data.options).toHaveLength(2);
    expect(mockGetPublicDecision).toHaveBeenCalledWith('decision-1');
  });
});

// ============================================================================
// POST — rate limiting
// ============================================================================

describe('POST /api/vote/[id] — rate limited', () => {
  it('returns 429 when rate limit is exceeded', async () => {
    (rateLimiters.voteSubmit as Mock).mockReturnValue(false);

    const req = new NextRequest('http://localhost/api/vote/decision-1', {
      method: 'POST',
      body: JSON.stringify({ email: 'voter@example.com', voteData: { optionId: 'opt-1' } }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'decision-1' }) });
    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});

// ============================================================================
// POST — validation
// ============================================================================

describe('POST /api/vote/[id] — missing email', () => {
  it('returns 400 when email is missing', async () => {
    const req = new NextRequest('http://localhost/api/vote/decision-1', {
      method: 'POST',
      body: JSON.stringify({ voteData: { optionId: 'opt-1' } }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'decision-1' }) });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/E-Mail/i);
  });
});

describe('POST /api/vote/[id] — missing voteData', () => {
  it('returns 400 when voteData is missing', async () => {
    const req = new NextRequest('http://localhost/api/vote/decision-1', {
      method: 'POST',
      body: JSON.stringify({ email: 'voter@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'decision-1' }) });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/Stimmdaten/i);
  });
});

// ============================================================================
// POST — user not found
// ============================================================================

describe('POST /api/vote/[id] — anonymous voter', () => {
  it('submits anonymously when email is not registered', async () => {
    const req = new NextRequest('http://localhost/api/vote/decision-1', {
      method: 'POST',
      body: JSON.stringify({ email: 'unknown@example.com', voteData: { optionId: 'opt-1' } }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'decision-1' }) });
    expect(response.status).toBe(200);
    expect(mockSubmitVote).toHaveBeenCalledWith(
      'decision-1',
      { voterEmail: 'unknown@example.com' },
      { optionId: 'opt-1' },
    );
  });
});

// ============================================================================
// POST — submitVote returns error
// ============================================================================

describe('POST /api/vote/[id] — submitVote error', () => {
  it('returns 400 when submitVote returns an error', async () => {
    mockSubmitVote.mockResolvedValueOnce({ error: 'not_voting_phase' });

    const req = new NextRequest('http://localhost/api/vote/decision-1', {
      method: 'POST',
      body: JSON.stringify({ email: 'voter@example.com', voteData: { optionId: 'opt-1' } }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'decision-1' }) });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/läuft/i);
  });

  it('returns 400 with generic message for unknown error code', async () => {
    mockSubmitVote.mockResolvedValueOnce({ error: 'unknown_error_code' });

    const req = new NextRequest('http://localhost/api/vote/decision-1', {
      method: 'POST',
      body: JSON.stringify({ email: 'voter@example.com', voteData: { optionId: 'opt-1' } }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'decision-1' }) });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/Fehler beim Abgeben/i);
  });
});

// ============================================================================
// POST — success
// ============================================================================

describe('POST /api/vote/[id] — success', () => {
  it('returns 200 with vote data on successful submission', async () => {
    const req = new NextRequest('http://localhost/api/vote/decision-1', {
      method: 'POST',
      body: JSON.stringify({ email: 'voter@example.com', voteData: { optionId: 'opt-1' } }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'decision-1' }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('vote-1');
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT id FROM'), [
      'voter@example.com',
    ]);
    expect(mockSubmitVote).toHaveBeenCalledWith(
      'decision-1',
      { voterEmail: 'voter@example.com' },
      { optionId: 'opt-1' },
    );
  });
});

// ============================================================================
// POST — identity may never be asserted by the request body
// ============================================================================

describe('POST /api/vote/[id] — cannot vote as a registered member', () => {
  it('refuses an unauthenticated ballot claiming a registered email', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 'victim-user' }] });

    const req = new NextRequest('http://localhost/api/vote/decision-1', {
      method: 'POST',
      body: JSON.stringify({ email: 'Member@Example.com', voteData: { optionId: 'opt-1' } }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'decision-1' }) });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toMatch(/registrierten Konto/i);
    // The UI offers a login link off this code. Without it the only way to
    // recognise this failure is matching the German sentence, which breaks
    // the first time someone rewords or translates it.
    expect(body.code).toBe('vote_email_registered');
    // The whole point: no ballot is cast, so the member's existing vote
    // cannot be overwritten and allow_public_voting cannot be bypassed.
    expect(mockSubmitVote).not.toHaveBeenCalled();
  });

  it('never passes a userId derived from the request body', async () => {
    mockQuery.mockResolvedValue({ rows: [{ id: 'victim-user' }] });

    for (const email of ['member@example.com', 'MEMBER@example.com ']) {
      const req = new NextRequest('http://localhost/api/vote/decision-1', {
        method: 'POST',
        body: JSON.stringify({ email, voteData: { optionId: 'opt-1' } }),
        headers: { 'Content-Type': 'application/json' },
      });
      await POST(req, { params: Promise.resolve({ id: 'decision-1' }) });
    }

    for (const call of mockSubmitVote.mock.calls) {
      expect(call[1]).not.toHaveProperty('userId');
    }
  });
});

describe('POST /api/vote/[id] — signed-in voter', () => {
  it('votes as the session user and ignores the email in the body', async () => {
    mockAuth.mockResolvedValueOnce({ user: { email: 'me@example.com' } });

    const req = new NextRequest('http://localhost/api/vote/decision-1', {
      method: 'POST',
      body: JSON.stringify({ email: 'someone-else@example.com', voteData: { optionId: 'opt-1' } }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req, { params: Promise.resolve({ id: 'decision-1' }) });

    expect(response.status).toBe(200);
    expect(mockSubmitVote).toHaveBeenCalledWith(
      'decision-1',
      { userId: 'user-1' },
      { optionId: 'opt-1' },
    );
    // The body email is never looked up when a session decides identity.
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
