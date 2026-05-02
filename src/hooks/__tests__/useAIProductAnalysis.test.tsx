/**
 * Tests for useAIProductAnalysis — SSOT for AI image-based product
 * analysis (the bigger sibling of useProductAnalysis).
 *
 * Mission-relevant: powers the marketplace AI camera flow that lets
 * sellers snap a photo and pre-fill their listing. A regression here
 * breaks the seller onboarding UX.
 *
 * What's tested:
 *   - analyzeImage POST shape (saveToDatabase configurable, default false)
 *   - analyzeImage success: state populated (analysis, sustainability,
 *     saved_product_id), onAnalyzed callback fired
 *   - analyzeImage failure: error set, returns null, onAnalyzed NOT fired
 *   - "Analyse fehlgeschlagen" + "Keine Produktdaten erkannt" Swiss-German
 *     fallbacks
 *   - state clears on each new attempt (analysis/sustainability/error reset)
 *   - handleFileSelect: FileReader → analyzeImage with data URL
 *   - reset: clears all state + fileInputRef value
 *   - getConfidenceColor pure helper (3 tier color thresholds)
 *
 * What's NOT tested (browser hardware API too brittle to mock):
 *   - startCamera / stopCamera / capturePhoto (MediaStream + canvas)
 */

const mockApiFetch = jest.fn()

jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch.apply(null, args),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import { renderHook, act, waitFor } from '@testing-library/react'
import { useAIProductAnalysis, getConfidenceColor, type ProductAnalysis } from '../useAIProductAnalysis'

const TINY_PNG_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

const sampleAnalysis = {
  product_name: 'MacBook Pro 14"',
  product_name_confidence: 0.95,
  brand: 'Apple',
  brand_confidence: 0.98,
  category: 'laptop',
  category_confidence: 0.92,
  estimated_price_chf: 1500,
  price_confidence: 0.7,
  condition: 'good',
  condition_confidence: 0.8,
  color: 'silver',
  color_confidence: 0.85,
  specifications: { ram: '16GB', storage: '512GB' },
  total_confidence: 0.88,
}

const sampleSustainability = {
  overall_score: 75,
  environmental_score: 80,
  social_score: 70,
  economic_score: 75,
  factors: { repairability: 0.8 },
  recommendations: ['Use eco-friendly accessories'],
}

beforeEach(() => {
  mockApiFetch.mockReset()
})

// ============================================================================
// Initial state
// ============================================================================

describe('useAIProductAnalysis — initial state', () => {
  it('starts with all state null and not analyzing', () => {
    const { result } = renderHook(() => useAIProductAnalysis())

    expect(result.current.image).toBeNull()
    expect(result.current.isAnalyzing).toBe(false)
    expect(result.current.analysis).toBeNull()
    expect(result.current.sustainabilityScore).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.savedProductId).toBeNull()
  })

  it('exposes refs (videoRef, canvasRef, fileInputRef) starting at null', () => {
    const { result } = renderHook(() => useAIProductAnalysis())

    expect(result.current.videoRef).toEqual({ current: null })
    expect(result.current.canvasRef).toEqual({ current: null })
    expect(result.current.fileInputRef).toEqual({ current: null })
  })
})

// ============================================================================
// analyzeImage — POST shape
// ============================================================================

describe('analyzeImage — POST shape', () => {
  it('POSTs to /api/ai/analyze-product with image + saveToDatabase=false (default)', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { analysis: sampleAnalysis },
    })

    const { result } = renderHook(() => useAIProductAnalysis())

    await act(async () => {
      await result.current.analyzeImage(TINY_PNG_BASE64)
    })

    expect(mockApiFetch).toHaveBeenCalledWith('/api/ai/analyze-product', {
      method: 'POST',
      body: { image: TINY_PNG_BASE64, saveToDatabase: false },
    })
  })

  it('uses saveToDatabase=true when option set (admin write-through flow)', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { analysis: sampleAnalysis },
    })

    const { result } = renderHook(() =>
      useAIProductAnalysis({ saveToDatabase: true }),
    )

    await act(async () => {
      await result.current.analyzeImage(TINY_PNG_BASE64)
    })

    expect(mockApiFetch.mock.calls[0][1].body.saveToDatabase).toBe(true)
  })
})

// ============================================================================
// analyzeImage — happy path
// ============================================================================

describe('analyzeImage — happy path', () => {
  it('populates analysis state on success and returns it', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { analysis: sampleAnalysis },
    })

    const { result } = renderHook(() => useAIProductAnalysis())

    let returned: ProductAnalysis | null = null
    await act(async () => {
      returned = await result.current.analyzeImage(TINY_PNG_BASE64)
    })

    expect(returned).toEqual(sampleAnalysis)
    expect(result.current.analysis).toEqual(sampleAnalysis)
    expect(result.current.error).toBeNull()
  })

  it('populates sustainabilityScore when API returns it', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { analysis: sampleAnalysis, sustainability_score: sampleSustainability },
    })

    const { result } = renderHook(() => useAIProductAnalysis())

    await act(async () => {
      await result.current.analyzeImage(TINY_PNG_BASE64)
    })

    expect(result.current.sustainabilityScore).toEqual(sampleSustainability)
  })

  it('populates savedProductId when API returns it (admin save-through)', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { analysis: sampleAnalysis, saved_product_id: 'p-new-1' },
    })

    const { result } = renderHook(() =>
      useAIProductAnalysis({ saveToDatabase: true }),
    )

    await act(async () => {
      await result.current.analyzeImage(TINY_PNG_BASE64)
    })

    expect(result.current.savedProductId).toBe('p-new-1')
  })

  it('fires onAnalyzed callback with analysis + sustainability', async () => {
    const onAnalyzed = jest.fn()
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: {
        analysis: sampleAnalysis,
        sustainability_score: sampleSustainability,
      },
    })

    const { result } = renderHook(() => useAIProductAnalysis({ onAnalyzed }))

    await act(async () => {
      await result.current.analyzeImage(TINY_PNG_BASE64)
    })

    expect(onAnalyzed).toHaveBeenCalledWith(sampleAnalysis, sampleSustainability)
  })

  it('omitted onAnalyzed is fine (optional)', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { analysis: sampleAnalysis },
    })

    const { result } = renderHook(() => useAIProductAnalysis())

    await expect(
      act(async () => {
        await result.current.analyzeImage(TINY_PNG_BASE64)
      }),
    ).resolves.not.toThrow()
  })
})

// ============================================================================
// analyzeImage — failure paths
// ============================================================================

describe('analyzeImage — failure paths', () => {
  it('success=false → returns null + sets error from result.error', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false, error: 'Image too dark' })

    const { result } = renderHook(() => useAIProductAnalysis())

    let returned: unknown = 'not-null-yet'
    await act(async () => {
      returned = await result.current.analyzeImage(TINY_PNG_BASE64)
    })

    expect(returned).toBeNull()
    expect(result.current.error).toBe('Image too dark')
    expect(result.current.analysis).toBeNull()
  })

  it('success=false without error → "Analyse fehlgeschlagen" Swiss-German fallback', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false })

    const { result } = renderHook(() => useAIProductAnalysis())

    await act(async () => {
      await result.current.analyzeImage(TINY_PNG_BASE64)
    })

    expect(result.current.error).toBe('Analyse fehlgeschlagen')
  })

  it('success=true but data missing → returns null + error from "Analyse fehlgeschlagen"', async () => {
    // Defensive: guards against API shape drift
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useAIProductAnalysis())

    let returned: unknown = 'not-null-yet'
    await act(async () => {
      returned = await result.current.analyzeImage(TINY_PNG_BASE64)
    })

    expect(returned).toBeNull()
    expect(result.current.error).toBe('Analyse fehlgeschlagen')
  })

  it('success=true with data but analysis missing → "Keine Produktdaten erkannt" fallback', async () => {
    // Specific guard: API responded ok but couldn't extract product data
    // (e.g. blurry image, irrelevant subject)
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: {}, // no analysis
    })

    const { result } = renderHook(() => useAIProductAnalysis())

    let returned: unknown = 'not-null-yet'
    await act(async () => {
      returned = await result.current.analyzeImage(TINY_PNG_BASE64)
    })

    expect(returned).toBeNull()
    expect(result.current.error).toContain('Keine Produktdaten')
    expect(result.current.error).toContain('Text-Eingabe') // suggests fallback
  })

  it('does NOT fire onAnalyzed callback on failure', async () => {
    const onAnalyzed = jest.fn()
    mockApiFetch.mockResolvedValueOnce({ success: false, error: 'x' })

    const { result } = renderHook(() => useAIProductAnalysis({ onAnalyzed }))

    await act(async () => {
      await result.current.analyzeImage(TINY_PNG_BASE64)
    })

    expect(onAnalyzed).not.toHaveBeenCalled()
  })
})

// ============================================================================
// State clearing on new attempts
// ============================================================================

describe('analyzeImage — state clearing', () => {
  it('clears previous error/analysis/sustainability before new attempt', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: false, error: 'first error' })
      .mockResolvedValueOnce({
        success: true,
        data: { analysis: sampleAnalysis, sustainability_score: sampleSustainability },
      })

    const { result } = renderHook(() => useAIProductAnalysis())

    await act(async () => {
      await result.current.analyzeImage(TINY_PNG_BASE64)
    })
    expect(result.current.error).toBe('first error')

    // Second attempt should clear the first error
    await act(async () => {
      await result.current.analyzeImage(TINY_PNG_BASE64)
    })
    expect(result.current.error).toBeNull()
    expect(result.current.analysis).toEqual(sampleAnalysis)
  })
})

// ============================================================================
// isAnalyzing lifecycle
// ============================================================================

describe('isAnalyzing lifecycle', () => {
  it('flips to true mid-flight, false after success', async () => {
    let resolveRequest!: (val: unknown) => void
    mockApiFetch.mockReturnValueOnce(new Promise(r => { resolveRequest = r }))

    const { result } = renderHook(() => useAIProductAnalysis())

    let analyzePromise!: Promise<unknown>
    act(() => {
      analyzePromise = result.current.analyzeImage(TINY_PNG_BASE64)
    })

    await waitFor(() => expect(result.current.isAnalyzing).toBe(true))

    await act(async () => {
      resolveRequest({ success: true, data: { analysis: sampleAnalysis } })
      await analyzePromise
    })

    expect(result.current.isAnalyzing).toBe(false)
  })
})

// ============================================================================
// reset
// ============================================================================

describe('reset', () => {
  it('clears all state to null', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: {
        analysis: sampleAnalysis,
        sustainability_score: sampleSustainability,
        saved_product_id: 'p-1',
      },
    })

    const { result } = renderHook(() =>
      useAIProductAnalysis({ saveToDatabase: true }),
    )

    await act(async () => {
      await result.current.analyzeImage(TINY_PNG_BASE64)
    })

    expect(result.current.analysis).not.toBeNull()
    expect(result.current.sustainabilityScore).not.toBeNull()
    expect(result.current.savedProductId).toBe('p-1')

    act(() => {
      result.current.reset()
    })

    expect(result.current.image).toBeNull()
    expect(result.current.analysis).toBeNull()
    expect(result.current.sustainabilityScore).toBeNull()
    expect(result.current.error).toBeNull()
    expect(result.current.savedProductId).toBeNull()
  })

  it('resets the fileInputRef value when present (for reselect of same file)', async () => {
    const { result } = renderHook(() => useAIProductAnalysis())

    // Attach a fake file input
    const fakeInput = { value: 'previous-file.jpg' } as HTMLInputElement
    ;(result.current.fileInputRef as { current: HTMLInputElement | null }).current = fakeInput

    act(() => {
      result.current.reset()
    })

    expect(fakeInput.value).toBe('')
  })
})

// ============================================================================
// handleFileSelect
// ============================================================================

describe('handleFileSelect', () => {
  it('reads file as data URL and triggers analyzeImage', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { analysis: sampleAnalysis },
    })

    const { result } = renderHook(() => useAIProductAnalysis())

    // Build a fake file event
    const file = new File(['fake jpg'], 'photo.jpg', { type: 'image/jpeg' })
    const fakeEvent = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>

    await act(async () => {
      result.current.handleFileSelect(fakeEvent)
      // Wait for FileReader.onload to fire and analyzeImage to complete
      await new Promise(r => setTimeout(r, 50))
    })

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled())

    // The image data URL passed to analyzeImage should be a data: URL
    const passedImage = mockApiFetch.mock.calls[0][1].body.image as string
    expect(passedImage.startsWith('data:')).toBe(true)
  })

  it('no-op when no file is selected (event.target.files is empty)', async () => {
    const { result } = renderHook(() => useAIProductAnalysis())

    const fakeEvent = {
      target: { files: [] },
    } as unknown as React.ChangeEvent<HTMLInputElement>

    act(() => {
      result.current.handleFileSelect(fakeEvent)
    })

    expect(mockApiFetch).not.toHaveBeenCalled()
  })
})

// ============================================================================
// getConfidenceColor (pure helper)
// ============================================================================

describe('getConfidenceColor', () => {
  it('high confidence (>=0.9) → green', () => {
    expect(getConfidenceColor(0.95)).toBe('text-green-600')
    expect(getConfidenceColor(0.9)).toBe('text-green-600') // boundary inclusive
    expect(getConfidenceColor(1)).toBe('text-green-600')
  })

  it('medium confidence (0.7 to 0.9) → yellow', () => {
    expect(getConfidenceColor(0.7)).toBe('text-yellow-600') // boundary inclusive
    expect(getConfidenceColor(0.75)).toBe('text-yellow-600')
    expect(getConfidenceColor(0.89)).toBe('text-yellow-600')
  })

  it('low confidence (< 0.7) → red', () => {
    expect(getConfidenceColor(0.69)).toBe('text-red-600')
    expect(getConfidenceColor(0.5)).toBe('text-red-600')
    expect(getConfidenceColor(0)).toBe('text-red-600')
  })
})
