/**
 * Tests for useProductAnalysis — AI image analysis hook for the
 * erfassung donor-intake flow.
 *
 * Mission-relevant: this hook lets staff snap a photo of donated
 * hardware and get an AI-extracted brand/product/condition/price
 * pre-filled into the erfassung form. A regression here breaks the
 * scan-to-fill UX that makes intake fast.
 *
 * Behaviors locked:
 *   - POSTs to /api/ai/analyze-product with image + saveToDatabase=false
 *   - returns mapped formData on success (4 fields with safe defaults)
 *   - throws + sets error from result.error on success=false
 *   - "Analyse fehlgeschlagen" Swiss-German fallback
 *   - "Keine Analysedaten erhalten" guard when data.analysis missing
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

const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

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
  it('POSTs to /api/ai/analyze-product with image + saveToDatabase=false', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: {
        analysis: {
          brand: 'Apple',
          product_name: 'MacBook Pro 14"',
          condition: 'good',
          estimated_price_chf: 1500,
        },
      },
    })

    const { result } = renderHook(() => useProductAnalysis())

    await act(async () => {
      await result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    expect(mockApiFetch).toHaveBeenCalledWith('/api/ai/analyze-product', {
      method: 'POST',
      body: { image: TINY_PNG_BASE64, saveToDatabase: false },
    })
  })

  it('does NOT persist to database on this code path (saveToDatabase=false)', async () => {
    // Critical invariant: the analyze-from-photo flow is preview-only —
    // staff verify the AI extraction before any DB write. saveToDatabase=true
    // would create orphan records every time someone tries the camera.
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { analysis: { brand: 'X', product_name: 'Y', condition: 'good', estimated_price_chf: 100 } },
    })

    const { result } = renderHook(() => useProductAnalysis())

    await act(async () => {
      await result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    expect(mockApiFetch.mock.calls[0][1].body.saveToDatabase).toBe(false)
  })

  it('returns mapped formData on success (4 erfassung fields)', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: {
        analysis: {
          brand: 'Apple',
          product_name: 'MacBook Pro 14"',
          condition: 'good',
          estimated_price_chf: 1500,
        },
      },
    })

    const { result } = renderHook(() => useProductAnalysis())

    let analysisResult: Awaited<ReturnType<typeof result.current.analyzeProduct>> = null
    await act(async () => {
      analysisResult = await result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    expect(analysisResult).toEqual({
      formData: {
        hersteller: 'Apple',
        produktname: 'MacBook Pro 14"',
        zustand: 'good',
        verkaufspreis: '1500',
      },
    })
  })

  it('coerces estimated_price_chf number to string for the form input', async () => {
    // Forms use string inputs; the price needs to be a string for binding
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { analysis: { estimated_price_chf: 2499.99 } },
    })

    const { result } = renderHook(() => useProductAnalysis())

    let analysisResult: Awaited<ReturnType<typeof result.current.analyzeProduct>> = null
    await act(async () => {
      analysisResult = await result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    expect(analysisResult!.formData.verkaufspreis).toBe('2499.99')
    expect(typeof analysisResult!.formData.verkaufspreis).toBe('string')
  })

  it('uses empty-string defaults when analysis fields are missing', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { analysis: {} }, // empty analysis
    })

    const { result } = renderHook(() => useProductAnalysis())

    let analysisResult: Awaited<ReturnType<typeof result.current.analyzeProduct>> = null
    await act(async () => {
      analysisResult = await result.current.analyzeProduct(TINY_PNG_BASE64)
    })

    expect(analysisResult!.formData).toEqual({
      hersteller: '',
      produktname: '',
      zustand: '',
      verkaufspreis: '',
    })
  })

  it('error is null after success', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { analysis: { brand: 'X' } },
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

  it('success=true but analysis missing → "Keine Analysedaten erhalten"', async () => {
    // Defensive: API returned ok but no analysis payload (model timed out, etc.)
    mockApiFetch.mockResolvedValueOnce({ success: true, data: {} })

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
        data: { analysis: { brand: 'X' } },
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
        data: { analysis: { brand: 'X' } },
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
