/**
 * Tests for useProductAnalysis — AI image analysis hook for the
 * erfassung donor-intake flow.
 *
 * Mission-relevant: this hook lets staff snap a photo of donated
 * hardware and get an AI-extracted product record pre-filled into the
 * erfassung form. A regression here breaks the scan-to-fill UX that makes
 * intake fast.
 *
 * Behaviors locked:
 *   - POSTs the image to the full-fidelity staff route /api/admin/erfassung/image
 *   - returns the WHOLE product record (specs, category, profiles, description),
 *     not a four-field subset, plus AI confidence metadata
 *   - throws + sets error from result.error on success=false
 *   - "Analyse fehlgeschlagen" Swiss-German fallback
 *   - "Keine Analysedaten erhalten" guard when the nested data is missing
 *   - non-Error throws fall back to "Analyse fehlgeschlagen"
 *   - isAnalyzing lifecycle (true mid-flight, false after)
 *   - clears previous error on new attempt
 */

const mockApiFetch = jest.fn()

jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch.apply(null, args),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { renderHook, act, waitFor } from '@testing-library/react'
import { useProductAnalysis } from '../useProductAnalysis'

const TINY_PNG_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

/** A full VoiceProductData record as the vision route returns it. */
function fullProduct() {
  return {
    hersteller: 'Canon',
    produktname: 'MAXIFY MB2350',
    kurzbeschreibung: 'Multifunktions-Tintenstrahldrucker',
    specs: [{ key: 'Typ', value: 'Tintenstrahl' }],
    verkaufspreis: '60',
    zustand: 'good',
    hauptkategorie: '99',
    unterkategorie: '',
    kundenprofile: ['buero'],
  }
}

beforeEach(() => {
  mockApiFetch.mockReset()
})

// ============================================================================
// Initial state
// ============================================================================

describe('useProductAnalysis — initial state', () => {
  it('starts not analyzing with no error', () => {
    const { result } = renderHook(() => useProductAnalysis())
    expect(result.current.isAnalyzing).toBe(false)
    expect(result.current.error).toBeNull()
  })
})

// ============================================================================
// analyzeProduct — happy path
// ============================================================================

describe('analyzeProduct — happy path', () => {
  it('POSTs the image to the full-fidelity staff route', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { data: fullProduct(), metadata: {} },
    })

    const { result } = renderHook(() => useProductAnalysis())

    await act(async () => {
      await result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    expect(mockApiFetch).toHaveBeenCalledWith('/api/admin/erfassung/image', {
      method: 'POST',
      body: { image: TINY_PNG_BASE64 },
    })
  })

  it('returns the whole product record (not a 4-field subset) plus metadata', async () => {
    const metadata = { hersteller: { type: 'image', confidence: 0.9, timestamp: 1 } }
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { data: fullProduct(), metadata },
    })

    const { result } = renderHook(() => useProductAnalysis())

    let analysisResult: Awaited<ReturnType<typeof result.current.analyzeProduct>> = null
    await act(async () => {
      analysisResult = await result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    expect(analysisResult).toEqual({
      formData: {
        hersteller: 'Canon',
        produktname: 'MAXIFY MB2350',
        kurzbeschreibung: 'Multifunktions-Tintenstrahldrucker',
        specs: [{ key: 'Typ', value: 'Tintenstrahl' }],
        verkaufspreis: '60',
        zustand: 'good',
        hauptkategorie: '99',
        unterkategorie: '',
        kundenprofile: ['buero'],
      },
      metadata,
    })
  })

  it('tolerates a missing metadata object (defaults to {})', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { data: fullProduct() },
    })

    const { result } = renderHook(() => useProductAnalysis())

    let analysisResult: Awaited<ReturnType<typeof result.current.analyzeProduct>> = null
    await act(async () => {
      analysisResult = await result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    expect(analysisResult!.metadata).toEqual({})
  })

  it('error is null after success', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { data: fullProduct(), metadata: {} },
    })

    const { result } = renderHook(() => useProductAnalysis())

    await act(async () => {
      await result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    expect(result.current.error).toBeNull()
  })
})

// ============================================================================
// analyzeProduct — failure paths
// ============================================================================

describe('analyzeProduct — failure paths', () => {
  it('success=false → returns null and sets error from result.error', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false, error: 'Image too dark' })

    const { result } = renderHook(() => useProductAnalysis())

    let analysisResult: Awaited<ReturnType<typeof result.current.analyzeProduct>> = undefined as never
    await act(async () => {
      analysisResult = await result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    expect(analysisResult).toBeNull()
    expect(result.current.error).toBe('Image too dark')
  })

  it('success=false without error message → "Analyse fehlgeschlagen" Swiss-German fallback', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false })

    const { result } = renderHook(() => useProductAnalysis())

    await act(async () => {
      await result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    expect(result.current.error).toBe('Analyse fehlgeschlagen')
  })

  it('success=true but nested data missing → "Keine Analysedaten erhalten"', async () => {
    // Defensive: API returned ok but no product payload (model timed out, etc.)
    mockApiFetch.mockResolvedValueOnce({ success: true, data: { metadata: {} } })

    const { result } = renderHook(() => useProductAnalysis())

    let analysisResult: Awaited<ReturnType<typeof result.current.analyzeProduct>> = undefined as never
    await act(async () => {
      analysisResult = await result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    expect(analysisResult).toBeNull()
    expect(result.current.error).toBe('Keine Analysedaten erhalten')
  })

  it('thrown Error → preserves message in error state', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network unreachable'))

    const { result } = renderHook(() => useProductAnalysis())

    await act(async () => {
      await result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    expect(result.current.error).toBe('Network unreachable')
  })

  it('non-Error throw falls back to "Analyse fehlgeschlagen"', async () => {
    mockApiFetch.mockRejectedValueOnce('weird string throw')

    const { result } = renderHook(() => useProductAnalysis())

    await act(async () => {
      await result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    expect(result.current.error).toBe('Analyse fehlgeschlagen')
  })
})

// ============================================================================
// State management
// ============================================================================

describe('analyzeProduct — state management', () => {
  it('clears previous error on a new attempt', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: false, error: 'first error' })
      .mockResolvedValueOnce({
        success: true,
        data: { data: fullProduct(), metadata: {} },
      })

    const { result } = renderHook(() => useProductAnalysis())

    await act(async () => {
      await result.current.analyzeProduct(TINY_PNG_BASE64)
    })
    expect(result.current.error).toBe('first error')

    await act(async () => {
      await result.current.analyzeProduct(TINY_PNG_BASE64)
    })
    expect(result.current.error).toBeNull()
  })

  it('isAnalyzing flips to true mid-flight, false after success', async () => {
    let resolveRequest!: (val: unknown) => void
    mockApiFetch.mockReturnValueOnce(new Promise(r => { resolveRequest = r }))

    const { result } = renderHook(() => useProductAnalysis())

    let analyzePromise!: Promise<unknown>
    act(() => {
      analyzePromise = result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    await waitFor(() => expect(result.current.isAnalyzing).toBe(true))

    await act(async () => {
      resolveRequest({
        success: true,
        data: { data: fullProduct(), metadata: {} },
      })
      await analyzePromise
    })

    expect(result.current.isAnalyzing).toBe(false)
  })

  it('isAnalyzing flips back to false even after error (finally block)', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('boom'))

    const { result } = renderHook(() => useProductAnalysis())

    await act(async () => {
      await result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    expect(result.current.isAnalyzing).toBe(false)
  })
})
