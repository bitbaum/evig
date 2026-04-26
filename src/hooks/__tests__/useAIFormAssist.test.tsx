/**
 * Tests for useAIFormAssist — generic AI form assist hook.
 *
 * Used by erfassung donor intake, IT-Hilfe matchmaking, blog editor,
 * and any future AI-assisted form. Mission-relevant: this is the
 * client-side gate to /api/ai/extract — a regression here breaks
 * AI assist across the entire app.
 *
 * Three actions:
 *   extractFromText(text)        → mode: 'extract'
 *   refineFields(data, instr)    → mode: 'refine'
 *   runQuickAction(data, action) → mode: 'refine' with quickAction
 *
 * Plus shared callAPI with AbortController (cancels in-flight requests
 * on new request — the documented intentional skip from apiFetch SSOT
 * migration in the session log).
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAIFormAssist } from '../useAIFormAssist'

const mockFetch = global.fetch as jest.Mock

interface SampleForm {
  title: string
  description: string
}

beforeEach(() => {
  mockFetch.mockReset()
})

// Helper to build a successful API response
function okResponse(overrides?: {
  data?: Partial<SampleForm>
  confidence?: Record<string, number>
  model?: string
  suggestedActions?: Array<{ label: string; prompt: string }>
}) {
  return {
    ok: true,
    json: jest.fn().mockResolvedValue({
      success: true,
      data: overrides?.data ?? { title: 'Auto', description: 'Generated' },
      confidence: overrides?.confidence ?? {},
      model: overrides?.model ?? 'llama-3.3-70b',
      suggestedActions: overrides?.suggestedActions ?? [],
    }),
  }
}

// ============================================================================
// Initial state
// ============================================================================

describe('useAIFormAssist — initial state', () => {
  it('starts with no error, not extracting, no success, empty suggestedActions', () => {
    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    expect(result.current.isExtracting).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.success).toBe(false)
    expect(result.current.suggestedActions).toEqual([])
  })
})

// ============================================================================
// extractFromText — input validation
// ============================================================================

describe('extractFromText — input validation', () => {
  it('empty string → error "Bitte gib eine Beschreibung ein."', async () => {
    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('')
    })

    expect(result.current.error).toBe('Bitte gib eine Beschreibung ein.')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('whitespace-only → same error (trimmed before length check)', async () => {
    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('   \t\n  ')
    })

    expect(result.current.error).toBe('Bitte gib eine Beschreibung ein.')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('text > 5000 chars → length error', async () => {
    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('a'.repeat(5001))
    })

    expect(result.current.error).toContain('5000')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('text exactly 5000 chars passes the length gate', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())
    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('a'.repeat(5000))
    })

    expect(mockFetch).toHaveBeenCalled()
  })
})

// ============================================================================
// extractFromText — happy path
// ============================================================================

describe('extractFromText — happy path', () => {
  it('POSTs to /api/ai/extract with formType + mode=extract + trimmed text', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())
    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('  MacBook Pro 14"  ')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/ai/extract', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }))

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body).toEqual({
      formType: 'erfassung',
      text: 'MacBook Pro 14"', // trimmed
      mode: 'extract',
    })
  })

  it('calls onFieldsFilled with data + per-field metadata derived from confidence', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({
      data: { title: 'MacBook Pro', description: 'Refurbished' },
      confidence: { title: 0.95, description: 0.7 },
      model: 'llama-3.3-70b',
    }))

    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('macbook pro')
    })

    expect(onFieldsFilled).toHaveBeenCalledTimes(1)
    const [data, metadata] = onFieldsFilled.mock.calls[0]
    expect(data).toEqual({ title: 'MacBook Pro', description: 'Refurbished' })
    expect(metadata.title).toMatchObject({
      confidence: 0.95,
      model: 'llama-3.3-70b',
      timestamp: expect.any(Number),
    })
    expect(metadata.description).toMatchObject({
      confidence: 0.7,
      model: 'llama-3.3-70b',
    })
  })

  it('defaults model to "unknown" in metadata when API omits it', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        data: { title: 'X' },
        confidence: { title: 0.8 },
        // no model field
      }),
    })

    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('text')
    })

    const [, metadata] = onFieldsFilled.mock.calls[0]
    expect(metadata.title.model).toBe('unknown')
  })

  it('sets success=true on successful extract', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())
    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('text')
    })

    expect(result.current.success).toBe(true)
    expect(result.current.error).toBeNull()
  })
})

// ============================================================================
// suggestedActions — filter + cap at 3
// ============================================================================

describe('suggestedActions handling', () => {
  it('stores AI-returned suggestedActions', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({
      suggestedActions: [
        { label: 'Specs ergänzen', prompt: 'Add CPU/RAM/storage' },
        { label: 'Preis schätzen', prompt: 'Estimate market price' },
      ],
    }))

    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('text')
    })

    expect(result.current.suggestedActions).toHaveLength(2)
    expect(result.current.suggestedActions[0]).toEqual({
      label: 'Specs ergänzen',
      prompt: 'Add CPU/RAM/storage',
    })
  })

  it('filters out actions missing label or prompt', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({
      suggestedActions: [
        { label: 'Valid', prompt: 'Has both' },
        { label: '', prompt: 'No label' } as { label: string; prompt: string },
        { label: 'No prompt', prompt: '' } as { label: string; prompt: string },
        { label: 'Another valid', prompt: 'OK' },
      ],
    }))

    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('text')
    })

    expect(result.current.suggestedActions).toHaveLength(2)
    expect(result.current.suggestedActions.map(a => a.label))
      .toEqual(['Valid', 'Another valid'])
  })

  it('caps at 3 actions even if API returns more', async () => {
    mockFetch.mockResolvedValueOnce(okResponse({
      suggestedActions: [
        { label: 'One', prompt: 'A' },
        { label: 'Two', prompt: 'B' },
        { label: 'Three', prompt: 'C' },
        { label: 'Four', prompt: 'D' },
        { label: 'Five', prompt: 'E' },
      ],
    }))

    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('text')
    })

    expect(result.current.suggestedActions).toHaveLength(3)
    expect(result.current.suggestedActions.map(a => a.label))
      .toEqual(['One', 'Two', 'Three'])
  })
})

// ============================================================================
// Failure paths
// ============================================================================

describe('callAPI — failure handling', () => {
  it('result.success=false → error from result.error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ success: false, error: 'Rate limited' }),
    })

    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('text')
    })

    expect(result.current.error).toBe('Rate limited')
    expect(onFieldsFilled).not.toHaveBeenCalled()
  })

  it('success=false without error message → "KI-Extraktion fehlgeschlagen"', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValue({ success: false }),
    })

    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('text')
    })

    expect(result.current.error).toBe('KI-Extraktion fehlgeschlagen')
  })

  it('JSON parse failure → "Ungültige Antwort vom Server" (proper umlaut)', async () => {
    // CLAUDE.md rule #4 — Ungültig not Ungueltig
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockRejectedValue(new SyntaxError('Unexpected token')),
    })

    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('text')
    })

    expect(result.current.error).toBe('Ungültige Antwort vom Server.')
    expect(result.current.error).not.toContain('Ungueltig')
  })

  it('network error → "Verbindung zum KI-Service fehlgeschlagen."', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'))

    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('text')
    })

    expect(result.current.error).toBe('Verbindung zum KI-Service fehlgeschlagen.')
  })

  it('AbortError silently ignored (no error message)', async () => {
    const abortErr = new Error('aborted')
    abortErr.name = 'AbortError'
    mockFetch.mockRejectedValueOnce(abortErr)

    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('text')
    })

    // Aborted requests don't surface as user-facing errors
    expect(result.current.error).toBeNull()
  })
})

// ============================================================================
// AbortController — request cancellation
// ============================================================================

describe('AbortController — in-flight cancellation', () => {
  it('cancels previous request when a new extract is started', async () => {
    let resolveFirst!: (val: unknown) => void
    const firstPromise = new Promise(r => { resolveFirst = r })
    mockFetch
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce(okResponse({ data: { title: 'Second' } }))

    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    // Fire first request (will hang)
    let firstCall!: Promise<void>
    act(() => {
      firstCall = result.current.extractFromText('first text')
    })

    // Fire second request — should abort the first
    await act(async () => {
      await result.current.extractFromText('second text')
    })

    // Get the AbortSignal from the first fetch call
    const firstSignal = mockFetch.mock.calls[0][1].signal as AbortSignal
    expect(firstSignal.aborted).toBe(true)

    // Resolve the first (now-aborted) promise — should not affect state
    resolveFirst({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        data: { title: 'First' },
        confidence: {},
      }),
    })
    await firstCall.catch(() => {})

    // Only the second call should have set state
    expect(onFieldsFilled).toHaveBeenCalledTimes(1)
    expect(onFieldsFilled.mock.calls[0][0].title).toBe('Second')
  })
})

// ============================================================================
// refineFields
// ============================================================================

describe('refineFields', () => {
  it('empty instruction → error "Bitte gib eine Anweisung ein."', async () => {
    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.refineFields({ title: 'X' }, '   ')
    })

    expect(result.current.error).toBe('Bitte gib eine Anweisung ein.')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('POSTs with mode=refine + currentData + instruction', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())
    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.refineFields(
        { title: 'MacBook' },
        'make it more enthusiastic',
      )
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body).toEqual({
      formType: 'erfassung',
      text: 'make it more enthusiastic',
      mode: 'refine',
      currentData: { title: 'MacBook' },
      instruction: 'make it more enthusiastic',
    })
  })
})

// ============================================================================
// runQuickAction
// ============================================================================

describe('runQuickAction', () => {
  it('POSTs with mode=refine + currentData + quickAction key', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())
    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.runQuickAction(
        { title: 'MacBook', description: 'Used' },
        'estimatePrice',
      )
    })

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body).toEqual({
      formType: 'erfassung',
      text: 'estimatePrice', // sentinel — server picks up the quickAction
      mode: 'refine',
      currentData: { title: 'MacBook', description: 'Used' },
      quickAction: 'estimatePrice',
    })
  })

  it('does NOT validate input length (quick actions are server-driven)', async () => {
    mockFetch.mockResolvedValueOnce(okResponse())
    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      // Empty data + short action key — should still fire
      await result.current.runQuickAction({}, 'addSpecs')
    })

    expect(mockFetch).toHaveBeenCalled()
  })
})

// ============================================================================
// isExtracting lifecycle
// ============================================================================

describe('isExtracting lifecycle', () => {
  it('flips to true mid-flight, false after success', async () => {
    let resolveRequest!: (val: unknown) => void
    mockFetch.mockReturnValueOnce(new Promise(r => { resolveRequest = r }))

    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    let extractPromise!: Promise<void>
    act(() => {
      extractPromise = result.current.extractFromText('text')
    })

    await waitFor(() => expect(result.current.isExtracting).toBe(true))

    await act(async () => {
      resolveRequest(okResponse())
      await extractPromise
    })

    expect(result.current.isExtracting).toBe(false)
  })

  it('flips back to false even after error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('boom'))

    const onFieldsFilled = jest.fn()
    const { result } = renderHook(() =>
      useAIFormAssist<SampleForm>({ formType: 'erfassung', onFieldsFilled }),
    )

    await act(async () => {
      await result.current.extractFromText('text')
    })

    expect(result.current.isExtracting).toBe(false)
  })
})
