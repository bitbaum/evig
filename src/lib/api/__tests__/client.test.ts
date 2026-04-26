/**
 * Tests for the apiFetch SSOT client.
 *
 * apiFetch wraps every client-side `/api/...` call so envelope unwrapping,
 * non-2xx handling, and network-error messaging all live in one place.
 * The migration to apiFetch surfaced 6 envelope/field bugs in callers, so
 * locking the helper's contract here protects against regressions in
 * either direction.
 */

import { apiFetch } from '../client'

const mockFetch = global.fetch as jest.Mock

beforeEach(() => {
  mockFetch.mockReset()
})

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response
}

function nonJsonResponse(status = 500): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => { throw new Error('Unexpected token <') },
  } as unknown as Response
}

describe('apiFetch', () => {
  // ── success path ────────────────────────────────────────────────────────────

  it('returns the unwrapped data on a successful envelope', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: { id: 'abc' } }))

    const result = await apiFetch<{ id: string }>('/api/test')

    expect(result).toEqual({ success: true, data: { id: 'abc' } })
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('defaults to GET with no body and no Content-Type header', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: null }))

    await apiFetch('/api/test')

    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toBe('/api/test')
    expect(init.method).toBe('GET')
    expect(init.body).toBeUndefined()
    expect(init.headers).toEqual({})
  })

  // ── JSON body handling ──────────────────────────────────────────────────────

  it('JSON-stringifies body and sets Content-Type for POST', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: { ok: true } }))

    await apiFetch('/api/test', {
      method: 'POST',
      body: { hello: 'world', n: 42 },
    })

    const [, init] = mockFetch.mock.calls[0]
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(init.body).toBe(JSON.stringify({ hello: 'world', n: 42 }))
  })

  it('merges custom headers without overriding Content-Type', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: null }))

    await apiFetch('/api/test', {
      method: 'POST',
      body: { x: 1 },
      headers: { 'X-Custom': 'yes' },
    })

    const [, init] = mockFetch.mock.calls[0]
    expect(init.headers).toEqual({
      'Content-Type': 'application/json',
      'X-Custom': 'yes',
    })
  })

  // ── FormData handling ───────────────────────────────────────────────────────

  it('passes FormData through unchanged and skips Content-Type when formData=true', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: { uploaded: 1 } }))

    const fd = new FormData()
    fd.append('file', 'fake-blob')

    await apiFetch('/api/uploads', {
      method: 'POST',
      body: fd,
      formData: true,
    })

    const [, init] = mockFetch.mock.calls[0]
    expect(init.body).toBe(fd) // identity, not stringified
    // Browser sets Content-Type with boundary itself — we must NOT pre-set it
    expect(init.headers).toEqual({})
  })

  // ── error envelope handling ─────────────────────────────────────────────────

  it('surfaces the server error message when success=false', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: false, error: 'Validierung fehlgeschlagen' }, 400))

    const result = await apiFetch('/api/test')

    expect(result).toEqual({ success: false, error: 'Validierung fehlgeschlagen' })
  })

  it('treats success=false on a 200 as an error too', async () => {
    // Some routes (vote service) return 200 with { success: false } for soft failures
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: false, error: 'Nicht stimmberechtigt' }, 200))

    const result = await apiFetch('/api/test')

    expect(result).toEqual({ success: false, error: 'Nicht stimmberechtigt' })
  })

  it('falls back to a status-coded message when the server omits an error string', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: false }, 500))

    const result = await apiFetch('/api/test')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Anfrage fehlgeschlagen (500)')
  })

  it('handles a non-JSON 5xx response without throwing', async () => {
    mockFetch.mockResolvedValueOnce(nonJsonResponse(503))

    const result = await apiFetch('/api/test')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Anfrage fehlgeschlagen (503)')
  })

  // ── network failures ────────────────────────────────────────────────────────

  it('returns a friendly network error when fetch rejects', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const result = await apiFetch('/api/test')

    expect(result).toEqual({
      success: false,
      error: 'Netzwerkfehler. Bitte versuche es erneut.',
    })
  })

  // ── contract guarantees ─────────────────────────────────────────────────────

  it('never throws for any of: ok envelope, error envelope, non-JSON, network error', async () => {
    const cases = [
      () => mockFetch.mockResolvedValueOnce(jsonResponse({ success: true, data: 1 })),
      () => mockFetch.mockResolvedValueOnce(jsonResponse({ success: false, error: 'x' }, 400)),
      () => mockFetch.mockResolvedValueOnce(nonJsonResponse(500)),
      () => mockFetch.mockRejectedValueOnce(new Error('boom')),
    ]

    for (const setup of cases) {
      mockFetch.mockReset()
      setup()
      await expect(apiFetch('/api/test')).resolves.toMatchObject({ success: expect.any(Boolean) })
    }
  })
})
