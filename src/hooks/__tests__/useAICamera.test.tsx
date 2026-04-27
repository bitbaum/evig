/**
 * Tests for useAICamera — marketplace wrapper around useAIProductAnalysis.
 *
 * Mission-relevant: the AI camera lets community members photograph a donated
 * device and get instant product details pre-filled, lowering the barrier to
 * listing items on the marketplace. A regression here means donors must type
 * everything manually, reducing listing rates and slowing hardware rehoming.
 *
 * Behaviors locked:
 *   - initial suggestions array is empty, isAnalyzing is false
 *   - mapToSuggestion maps ProductAnalysis fields → ProductSuggestion correctly
 *   - 'Unbekanntes Produkt' fallback for missing product_name
 *   - estimatedPrice falls back to 0
 *   - confidence falls back to 0.5
 *   - condition falls back to 'good'
 *   - specifications serialised as "key: value" feature strings
 *   - getCategoryIcon called with category string
 *   - onAnalyzed callback triggers suggestions update (exactly one entry)
 *   - resetCapture clears suggestions and calls inner hook's reset()
 *   - handleFileUpload is the same reference as inner hook's handleFileSelect
 */

const mockReset = jest.fn()
const mockStartCamera = jest.fn()
const mockStopCamera = jest.fn()
const mockCapturePhoto = jest.fn()
const mockHandleFileSelect = jest.fn()

// Capture the options object passed to useAIProductAnalysis so we can invoke onAnalyzed
const mockUseAIProductAnalysis = jest.fn()

jest.mock('../useAIProductAnalysis', () => ({
  useAIProductAnalysis: (...args: unknown[]) => mockUseAIProductAnalysis(...args),
}))

jest.mock('@/components/marketplace/ai-camera/config', () => ({
  getCategoryIcon: jest.fn().mockReturnValue(() => null),
}))

import { renderHook, act } from '@testing-library/react'
import { useAICamera } from '../useAICamera'
import type { ProductAnalysis } from '../useAIProductAnalysis'
import { getCategoryIcon } from '@/components/marketplace/ai-camera/config'

const mockGetCategoryIcon = getCategoryIcon as jest.MockedFunction<typeof getCategoryIcon>

/** Default return value for the inner hook mock */
function makeInnerHook() {
  return {
    videoRef: { current: null },
    canvasRef: { current: null },
    fileInputRef: { current: null },
    image: null,
    isAnalyzing: false,
    error: null,
    startCamera: mockStartCamera,
    stopCamera: mockStopCamera,
    capturePhoto: mockCapturePhoto,
    handleFileSelect: mockHandleFileSelect,
    reset: mockReset,
  }
}

/** Minimal valid ProductAnalysis */
const fullAnalysis: ProductAnalysis = {
  product_name: 'MacBook Pro 14"',
  product_name_confidence: 0.95,
  brand: 'Apple',
  brand_confidence: 0.98,
  category: 'Laptops',
  category_confidence: 0.92,
  estimated_price_chf: 1200,
  price_confidence: 0.8,
  condition: 'excellent',
  condition_confidence: 0.9,
  color: 'Silver',
  color_confidence: 0.85,
  model: 'A2442',
  specifications: { RAM: '16GB', Storage: '512GB' },
  total_confidence: 0.93,
}

beforeEach(() => {
  mockUseAIProductAnalysis.mockReset()
  mockReset.mockReset()
  mockStartCamera.mockReset()
  mockStopCamera.mockReset()
  mockCapturePhoto.mockReset()
  mockHandleFileSelect.mockReset()
  mockGetCategoryIcon.mockReturnValue(() => null)
  mockUseAIProductAnalysis.mockReturnValue(makeInnerHook())
})

// ============================================================================
// Initial state
// ============================================================================

describe('useAICamera — initial state', () => {
  it('starts with an empty suggestions array', () => {
    const { result } = renderHook(() => useAICamera())
    expect(result.current.suggestions).toEqual([])
  })

  it('starts with isAnalyzing=false', () => {
    const { result } = renderHook(() => useAICamera())
    expect(result.current.isAnalyzing).toBe(false)
  })
})

// ============================================================================
// mapToSuggestion — field mapping
// ============================================================================

describe('mapToSuggestion — field mapping', () => {
  /** Helper: render hook and fire the onAnalyzed callback captured from the inner hook */
  function fireOnAnalyzed(analysis: ProductAnalysis) {
    const { result } = renderHook(() => useAICamera())
    const onAnalyzed = mockUseAIProductAnalysis.mock.calls[0][0].onAnalyzed as (
      a: ProductAnalysis,
    ) => void
    act(() => {
      onAnalyzed(analysis)
    })
    return result
  }

  it('maps product_name → suggestion.name', () => {
    const result = fireOnAnalyzed(fullAnalysis)
    expect(result.current.suggestions[0].name).toBe('MacBook Pro 14"')
  })

  it('falls back to "Unbekanntes Produkt" when product_name is empty string', () => {
    const result = fireOnAnalyzed({ ...fullAnalysis, product_name: '' })
    expect(result.current.suggestions[0].name).toBe('Unbekanntes Produkt')
  })

  it('maps estimated_price_chf → estimatedPrice', () => {
    const result = fireOnAnalyzed(fullAnalysis)
    expect(result.current.suggestions[0].estimatedPrice).toBe(1200)
  })

  it('falls back to 0 when estimated_price_chf is 0 (falsy)', () => {
    const result = fireOnAnalyzed({ ...fullAnalysis, estimated_price_chf: 0 })
    expect(result.current.suggestions[0].estimatedPrice).toBe(0)
  })

  it('maps total_confidence → confidence', () => {
    const result = fireOnAnalyzed(fullAnalysis)
    expect(result.current.suggestions[0].confidence).toBe(0.93)
  })

  it('falls back to 0.5 when total_confidence is 0 (falsy)', () => {
    const result = fireOnAnalyzed({ ...fullAnalysis, total_confidence: 0 })
    expect(result.current.suggestions[0].confidence).toBe(0.5)
  })

  it('maps brand through to suggestion', () => {
    const result = fireOnAnalyzed(fullAnalysis)
    expect(result.current.suggestions[0].brand).toBe('Apple')
  })

  it('maps model through to suggestion', () => {
    const result = fireOnAnalyzed(fullAnalysis)
    expect(result.current.suggestions[0].model).toBe('A2442')
  })

  it('maps condition through (cast to allowed union)', () => {
    const result = fireOnAnalyzed(fullAnalysis)
    expect(result.current.suggestions[0].condition).toBe('excellent')
  })

  it('falls back to "good" when condition is empty string', () => {
    const result = fireOnAnalyzed({ ...fullAnalysis, condition: '' })
    expect(result.current.suggestions[0].condition).toBe('good')
  })

  it('serialises specifications as "key: value" feature strings', () => {
    const result = fireOnAnalyzed(fullAnalysis)
    expect(result.current.suggestions[0].features).toEqual([
      'RAM: 16GB',
      'Storage: 512GB',
    ])
  })

  it('produces empty features array when specifications is empty object', () => {
    const result = fireOnAnalyzed({ ...fullAnalysis, specifications: {} })
    expect(result.current.suggestions[0].features).toEqual([])
  })

  it('calls getCategoryIcon with the category string', () => {
    fireOnAnalyzed(fullAnalysis)
    expect(mockGetCategoryIcon).toHaveBeenCalledWith('Laptops')
  })

  it('onAnalyzed fires → suggestions has exactly one entry', () => {
    const result = fireOnAnalyzed(fullAnalysis)
    expect(result.current.suggestions).toHaveLength(1)
  })
})

// ============================================================================
// resetCapture
// ============================================================================

describe('resetCapture', () => {
  it('calls inner hook reset() and clears suggestions back to []', () => {
    const { result } = renderHook(() => useAICamera())

    // First populate suggestions
    const onAnalyzed = mockUseAIProductAnalysis.mock.calls[0][0].onAnalyzed as (
      a: ProductAnalysis,
    ) => void
    act(() => {
      onAnalyzed(fullAnalysis)
    })
    expect(result.current.suggestions).toHaveLength(1)

    act(() => {
      result.current.resetCapture()
    })

    expect(mockReset).toHaveBeenCalledTimes(1)
    expect(result.current.suggestions).toEqual([])
  })
})

// ============================================================================
// handleFileUpload passthrough
// ============================================================================

describe('handleFileUpload', () => {
  it('is the same reference as the inner hook handleFileSelect', () => {
    const { result } = renderHook(() => useAICamera())
    expect(result.current.handleFileUpload).toBe(mockHandleFileSelect)
  })
})
