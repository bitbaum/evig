/**
 * @jest-environment node
 */

/**
 * Tests for the Listmonk transactional email client (lib/email/listmonk.ts).
 *
 * Listmonk is the open-source newsletter/email backend. Three exported
 * helpers + two API wrappers:
 *
 *   isListmonkEnabled / getListmonkConfig — config inspection
 *   sendViaListmonk(to, content, attrs)   — POST /api/tx
 *   testListmonkConnection()              — GET /api/health
 *   subscribeToList(email, name, listIds) — POST /api/subscribers
 *
 * The wrappers all gate on LISTMONK_CONFIG.ENABLED and use HTTP Basic
 * auth. Tests verify guards, payload shape, response handling, and the
 * 409-already-subscribed special case.
 */

jest.mock('@/config/email', () => ({
  LISTMONK_CONFIG: {
    URL: 'http://listmonk.test',
    USERNAME: 'admin',
    PASSWORD: 'pw',
    FROM_EMAIL: 'noreply@revamp-it.ch',
    FROM_NAME: 'RevampIT',
    ENABLED: true,
  },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import {
  isListmonkEnabled,
  getListmonkConfig,
  sendViaListmonk,
  testListmonkConnection,
  subscribeToList,
} from '../listmonk'
import { LISTMONK_CONFIG } from '@/config/email'

const mockFetch = global.fetch as jest.Mock

const expectedAuth = 'Basic ' + Buffer.from('admin:pw').toString('base64')

const sampleEmail = {
  subject: 'Welcome',
  html: '<p>Hi</p>',
  text: 'Hi',
}

beforeEach(() => {
  mockFetch.mockReset()
  // Re-enable for each test (a couple flip it off)
  ;(LISTMONK_CONFIG as { ENABLED: boolean }).ENABLED = true
})

// ============================================================================
// Config inspection
// ============================================================================

describe('isListmonkEnabled', () => {
  it('reflects LISTMONK_CONFIG.ENABLED', () => {
    expect(isListmonkEnabled()).toBe(true)
    ;(LISTMONK_CONFIG as { ENABLED: boolean }).ENABLED = false
    expect(isListmonkEnabled()).toBe(false)
  })
})

describe('getListmonkConfig', () => {
  it('returns url/username/from/enabled WITHOUT exposing the password', () => {
    const config = getListmonkConfig()
    expect(config).toEqual({
      url: 'http://listmonk.test',
      username: 'admin',
      fromEmail: 'noreply@revamp-it.ch',
      fromName: 'RevampIT',
      enabled: true,
    })
    // Anti-leak: password must never appear in the public config
    expect(config).not.toHaveProperty('password')
    expect(JSON.stringify(config)).not.toContain('pw')
  })
})

// ============================================================================
// sendViaListmonk
// ============================================================================

describe('sendViaListmonk — guards', () => {
  it('returns { success: false } without calling fetch when disabled', async () => {
    ;(LISTMONK_CONFIG as { ENABLED: boolean }).ENABLED = false

    const result = await sendViaListmonk('a@b.ch', sampleEmail)

    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect(result.error).toContain('Listmonk is not enabled')
  })
})

describe('sendViaListmonk — happy path', () => {
  it('POSTs to /api/tx with Basic auth + JSON body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'tx-123' } }),
    })

    await sendViaListmonk('user@b.ch', sampleEmail)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('http://listmonk.test/api/tx')
    expect(init.method).toBe('POST')
    expect(init.headers['Content-Type']).toBe('application/json')
    expect(init.headers['Authorization']).toBe(expectedAuth)
  })

  it('serializes the Listmonk payload with subscriber + content + messenger=email', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'tx-1' } }),
    })

    await sendViaListmonk('user@b.ch', sampleEmail, { name: 'Anna', plan: 'pro' })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body).toEqual({
      subscriber_email: 'user@b.ch',
      subscriber_name: 'Anna',
      from_email: 'noreply@revamp-it.ch',
      subject: 'Welcome',
      body: '<p>Hi</p>',
      alt_body: 'Hi',
      content_type: 'html',
      messenger: 'email',
      data: { name: 'Anna', plan: 'pro' },
    })
  })

  it('defaults subscriber_name to "" when no attrs provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'tx-1' } }),
    })

    await sendViaListmonk('user@b.ch', sampleEmail)

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.subscriber_name).toBe('')
    expect(body.data).toEqual({})
  })

  it('returns success=true with messageId from API response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: 'tx-abc' } }),
    })

    const result = await sendViaListmonk('user@b.ch', sampleEmail)
    expect(result).toEqual({ success: true, messageId: 'tx-abc' })
  })

  it('falls back to "listmonk-tx" message id when API omits one', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: {} }),
    })

    const result = await sendViaListmonk('user@b.ch', sampleEmail)
    expect(result.messageId).toBe('listmonk-tx')
  })
})

describe('sendViaListmonk — errors', () => {
  it('throws when Listmonk returns non-2xx', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal server error',
    })

    await expect(sendViaListmonk('user@b.ch', sampleEmail)).rejects.toThrow(/Listmonk API error: 500/)
  })

  it('propagates fetch network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    await expect(sendViaListmonk('user@b.ch', sampleEmail)).rejects.toThrow('ECONNREFUSED')
  })
})

// ============================================================================
// testListmonkConnection
// ============================================================================

describe('testListmonkConnection', () => {
  it('GETs /api/health with Basic auth', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    await testListmonkConnection()

    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('http://listmonk.test/api/health')
    expect(init.method).toBe('GET')
    expect(init.headers.Authorization).toBe(expectedAuth)
  })

  it('returns success=true on 2xx', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })
    expect(await testListmonkConnection()).toEqual({ success: true })
  })

  it('returns success=false with status code when health check fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 })
    const result = await testListmonkConnection()
    expect(result.success).toBe(false)
    expect(result.error).toContain('503')
  })

  it('catches network errors and returns success=false (does not throw)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('connect ETIMEDOUT'))
    const result = await testListmonkConnection()
    expect(result.success).toBe(false)
    expect(result.error).toBe('connect ETIMEDOUT')
  })

  it('handles non-Error throws (string, undefined) without crashing', async () => {
    mockFetch.mockRejectedValueOnce('weird non-Error throw')
    const result = await testListmonkConnection()
    expect(result.success).toBe(false)
    expect(result.error).toBe('Connection failed')
  })
})

// ============================================================================
// subscribeToList
// ============================================================================

describe('subscribeToList — guards', () => {
  it('returns success=false when disabled', async () => {
    ;(LISTMONK_CONFIG as { ENABLED: boolean }).ENABLED = false
    const result = await subscribeToList('a@b.ch', 'Anna', [1])
    expect(mockFetch).not.toHaveBeenCalled()
    expect(result.success).toBe(false)
    expect(result.error).toBe('Listmonk is not enabled')
  })
})

describe('subscribeToList — happy path', () => {
  it('POSTs to /api/subscribers with the right shape', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '' })

    await subscribeToList('a@b.ch', 'Anna', [1, 2])

    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('http://listmonk.test/api/subscribers')
    expect(init.method).toBe('POST')
    expect(init.headers.Authorization).toBe(expectedAuth)

    const body = JSON.parse(init.body)
    expect(body).toEqual({
      email: 'a@b.ch',
      name: 'Anna',
      status: 'enabled',
      lists: [1, 2],
      preconfirm_subscriptions: false,
    })
  })

  it('sets preconfirm_subscriptions=false (so Listmonk sends a confirmation email)', async () => {
    // Important: this enforces double-opt-in flow at the Listmonk layer
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '' })
    await subscribeToList('a@b.ch', 'Anna', [1])
    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.preconfirm_subscriptions).toBe(false)
  })

  it('returns success=true on 2xx', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, text: async () => '' })
    const result = await subscribeToList('a@b.ch', 'Anna', [1])
    expect(result).toEqual({ success: true })
  })
})

describe('subscribeToList — 409 already subscribed', () => {
  it('treats HTTP 409 as success (subscriber already exists)', async () => {
    // Critical: re-subscribing an existing email should not bubble up as
    // an error to the user — they're already on the list
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      text: async () => '{"message":"subscriber exists"}',
    })

    const result = await subscribeToList('existing@b.ch', 'Anna', [1])
    expect(result).toEqual({ success: true })
  })
})

describe('subscribeToList — failure paths', () => {
  it('returns success=false with error text on non-409 failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'internal error',
    })

    const result = await subscribeToList('a@b.ch', 'Anna', [1])
    expect(result.success).toBe(false)
    expect(result.error).toContain('internal error')
  })

  it('catches network errors and returns success=false (does not throw)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    const result = await subscribeToList('a@b.ch', 'Anna', [1])
    expect(result.success).toBe(false)
    expect(result.error).toBe('ECONNREFUSED')
  })

  it('handles non-Error throws gracefully', async () => {
    mockFetch.mockRejectedValueOnce('weird throw')
    const result = await subscribeToList('a@b.ch', 'Anna', [1])
    expect(result.success).toBe(false)
    expect(result.error).toBe('Subscription failed')
  })
})
