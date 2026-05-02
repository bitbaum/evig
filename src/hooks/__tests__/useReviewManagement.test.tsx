/**
 * Tests for useReviewManagement — user-facing review CRUD + voting.
 *
 * Mission-relevant: reviews are the trust layer of the marketplace
 * (sellers + technicians earn stars from real customers). A regression
 * either lets users mutate other reviews, blocks legitimate edits, or
 * skews vote counts.
 *
 * Key behaviors locked:
 *   - auth gate: redirect to /auth/login when unauthenticated
 *   - fetchUserReviews on auth, populates state, error fallback
 *   - handleEditReview populates editForm from the review (with safe
 *     defaults for missing per-dimension ratings)
 *   - handleSaveEdit PUTs /api/reviews/:id, refetches, clears editing,
 *     toasts success or error
 *   - handleDeleteReview confirms via window.confirm, DELETEs only on
 *     confirm, refetches + toasts
 *   - handleVote POSTs to /api/reviews/:id/vote, optimistically updates
 *     helpfulVotes + totalVotes based on action ('added' or 'removed')
 *   - canEditReview: only within 30 days of creation
 *   - cancelEdit clears editingReview state
 *   - getUserVoteForReview lookup
 */

const mockApiFetch = jest.fn()
const mockToastSuccess = jest.fn()
const mockToastError = jest.fn()
const mockRedirect = jest.fn()
const mockLoggerWarn = jest.fn()
const mockLoggerError = jest.fn()

jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch.apply(null, args),
}))

jest.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess.apply(null, args),
    error: (...args: unknown[]) => mockToastError.apply(null, args),
  },
}))

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect.apply(null, args),
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: (...args: unknown[]) => mockLoggerWarn.apply(null, args),
    error: (...args: unknown[]) => mockLoggerError.apply(null, args),
    debug: jest.fn(),
  },
}))

import { renderHook, act, waitFor } from '@testing-library/react'
import { useReviewManagement, type Review } from '../useReviewManagement'

const baseReview: Review = {
  id: 'rev-1',
  targetType: 'seller',
  targetId: 'svc-1',
  targetName: 'Anna',
  overallRating: 5,
  ratings: {
    communication: 5,
    professionalism: 4,
    quality: 5,
    timeliness: 4,
    value: 5,
  },
  title: 'Excellent service',
  content: 'Great experience overall',
  status: 'published',
  helpfulVotes: 3,
  totalVotes: 5,
  isVerifiedPurchase: true,
  createdAt: '2025-12-15T10:00:00Z',
  updatedAt: '2025-12-15T10:00:00Z',
}

beforeEach(() => {
  mockApiFetch.mockReset()
  mockToastSuccess.mockReset()
  mockToastError.mockReset()
  mockRedirect.mockReset()
  mockLoggerWarn.mockReset()
  mockLoggerError.mockReset()
})

// ============================================================================
// Auth gate
// ============================================================================

describe('useReviewManagement — auth gate', () => {
  it('redirects to /auth/login when unauthenticated', () => {
    renderHook(() => useReviewManagement('unauthenticated'))
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login')
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('does NOT fetch or redirect while auth status is "loading"', () => {
    renderHook(() => useReviewManagement('loading'))
    expect(mockRedirect).not.toHaveBeenCalled()
    expect(mockApiFetch).not.toHaveBeenCalled()
  })

  it('fetches reviews when authenticated', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true, data: { reviews: [baseReview] } })

    renderHook(() => useReviewManagement('authenticated'))

    await waitFor(() => expect(mockApiFetch).toHaveBeenCalledWith('/api/user/reviews'))
  })
})

// ============================================================================
// Fetch reviews
// ============================================================================

describe('useReviewManagement — fetchUserReviews', () => {
  it('populates reviews and clears loading on success', async () => {
    mockApiFetch.mockResolvedValueOnce({
      success: true,
      data: { reviews: [baseReview, { ...baseReview, id: 'rev-2' }] },
    })

    const { result } = renderHook(() => useReviewManagement('authenticated'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.reviews).toHaveLength(2)
    expect(result.current.reviews[0].id).toBe('rev-1')
  })

  it('defaults reviews to [] when data.reviews is missing', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true, data: {} })

    const { result } = renderHook(() => useReviewManagement('authenticated'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.reviews).toEqual([])
  })

  it('sets error from result on failure with fallback message', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false })

    const { result } = renderHook(() => useReviewManagement('authenticated'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Failed to fetch reviews')
  })

  it('catches thrown errors with the message', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('Network down'))

    const { result } = renderHook(() => useReviewManagement('authenticated'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBe('Network down')
  })
})

// ============================================================================
// handleEditReview
// ============================================================================

describe('handleEditReview', () => {
  it('sets editingReview to the review id and populates editForm from review', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: { reviews: [baseReview] } })

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.handleEditReview(baseReview)
    })

    expect(result.current.editingReview).toBe('rev-1')
    expect(result.current.editForm).toEqual({
      overallRating: 5,
      communicationRating: 5,
      professionalismRating: 4,
      qualityRating: 5,
      timelinessRating: 4,
      valueRating: 5,
      title: 'Excellent service',
      content: 'Great experience overall',
    })
  })

  it('defaults missing per-dimension ratings to 5', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: { reviews: [baseReview] } })
    const incomplete: Review = {
      ...baseReview,
      ratings: { communication: 3 }, // only one rating present
    }

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.handleEditReview(incomplete)
    })

    expect(result.current.editForm.communicationRating).toBe(3)
    expect(result.current.editForm.professionalismRating).toBe(5) // default
    expect(result.current.editForm.qualityRating).toBe(5)
    expect(result.current.editForm.timelinessRating).toBe(5)
    expect(result.current.editForm.valueRating).toBe(5)
  })

  it('defaults missing title to empty string', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: { reviews: [baseReview] } })
    const noTitle: Review = { ...baseReview, title: undefined }

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.handleEditReview(noTitle)
    })

    expect(result.current.editForm.title).toBe('')
  })
})

// ============================================================================
// cancelEdit
// ============================================================================

describe('cancelEdit', () => {
  it('clears editingReview state', async () => {
    mockApiFetch.mockResolvedValue({ success: true, data: { reviews: [baseReview] } })

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.handleEditReview(baseReview)
    })
    expect(result.current.editingReview).toBe('rev-1')

    act(() => {
      result.current.cancelEdit()
    })
    expect(result.current.editingReview).toBeNull()
  })
})

// ============================================================================
// handleSaveEdit
// ============================================================================

describe('handleSaveEdit', () => {
  it('PUTs to /api/reviews/:id with editForm and toasts success', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: true, data: { reviews: [baseReview] } }) // initial fetch
      .mockResolvedValueOnce({ success: true })                                    // PUT
      .mockResolvedValueOnce({ success: true, data: { reviews: [baseReview] } })   // re-fetch

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.handleEditReview(baseReview)
    })

    await act(async () => {
      await result.current.handleSaveEdit()
    })

    const putCall = mockApiFetch.mock.calls.find(
      (c) => c[0] === '/api/reviews/rev-1',
    )
    expect(putCall).toBeDefined()
    expect(putCall![1]).toMatchObject({ method: 'PUT' })
    expect(mockToastSuccess).toHaveBeenCalledWith('Bewertung erfolgreich aktualisiert!')
    expect(result.current.editingReview).toBeNull()
  })

  it('no-op when editingReview is null', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true, data: { reviews: [baseReview] } })

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    // No handleEditReview call → editingReview is null
    await act(async () => {
      await result.current.handleSaveEdit()
    })

    // Only the initial fetch happened — no PUT
    expect(mockApiFetch).toHaveBeenCalledTimes(1)
    expect(mockToastSuccess).not.toHaveBeenCalled()
  })

  it('toasts error and logs warning on failure', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: true, data: { reviews: [baseReview] } })
      .mockResolvedValueOnce({ success: false, error: 'forbidden' })

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.handleEditReview(baseReview)
    })

    await act(async () => {
      await result.current.handleSaveEdit()
    })

    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('forbidden'))
    expect(mockLoggerWarn).toHaveBeenCalled()
  })
})

// ============================================================================
// handleDeleteReview
// ============================================================================

describe('handleDeleteReview', () => {
  it('skips DELETE when window.confirm returns false', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true, data: { reviews: [baseReview] } })
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.handleDeleteReview('rev-1')
    })

    expect(confirmSpy).toHaveBeenCalled()
    // Only initial fetch, no DELETE
    expect(mockApiFetch).toHaveBeenCalledTimes(1)
    confirmSpy.mockRestore()
  })

  it('DELETEs and refetches when confirmed', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: true, data: { reviews: [baseReview] } })
      .mockResolvedValueOnce({ success: true })
      .mockResolvedValueOnce({ success: true, data: { reviews: [] } })
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.handleDeleteReview('rev-1')
    })

    const deleteCall = mockApiFetch.mock.calls.find(
      (c) => c[0] === '/api/reviews/rev-1' && c[1]?.method === 'DELETE',
    )
    expect(deleteCall).toBeDefined()
    expect(mockToastSuccess).toHaveBeenCalledWith('Bewertung erfolgreich gelöscht!')
    confirmSpy.mockRestore()
  })

  it('toasts error and logs warning on DELETE failure', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: true, data: { reviews: [baseReview] } })
      .mockResolvedValueOnce({ success: false, error: 'cannot delete' })
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.handleDeleteReview('rev-1')
    })

    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('cannot delete'))
    expect(mockLoggerWarn).toHaveBeenCalled()
    confirmSpy.mockRestore()
  })
})

// ============================================================================
// handleVote — optimistic update logic
// ============================================================================

describe('handleVote', () => {
  it('action=added increments totalVotes and helpful (when voteType=helpful)', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: true, data: { reviews: [baseReview] } })
      .mockResolvedValueOnce({ success: true, data: { action: 'added' } })

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.handleVote('rev-1', 'helpful')
    })

    // helpful added: helpfulVotes 3→4, totalVotes 5→6
    expect(result.current.reviews[0].helpfulVotes).toBe(4)
    expect(result.current.reviews[0].totalVotes).toBe(6)
  })

  it('action=added with voteType=unhelpful increments totalVotes only (not helpfulVotes)', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: true, data: { reviews: [baseReview] } })
      .mockResolvedValueOnce({ success: true, data: { action: 'added' } })

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.handleVote('rev-1', 'unhelpful')
    })

    expect(result.current.reviews[0].helpfulVotes).toBe(3) // unchanged
    expect(result.current.reviews[0].totalVotes).toBe(6)   // +1
  })

  it('action=removed decrements totalVotes (and helpful when voteType=helpful)', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: true, data: { reviews: [baseReview] } })
      .mockResolvedValueOnce({ success: true, data: { action: 'removed' } })

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.handleVote('rev-1', 'helpful')
    })

    expect(result.current.reviews[0].helpfulVotes).toBe(2) // -1
    expect(result.current.reviews[0].totalVotes).toBe(4)   // -1
  })

  it('only mutates the matching review id (other reviews untouched)', async () => {
    const reviewB = { ...baseReview, id: 'rev-2', helpfulVotes: 10, totalVotes: 20 }
    mockApiFetch
      .mockResolvedValueOnce({ success: true, data: { reviews: [baseReview, reviewB] } })
      .mockResolvedValueOnce({ success: true, data: { action: 'added' } })

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.handleVote('rev-1', 'helpful')
    })

    expect(result.current.reviews[1].helpfulVotes).toBe(10) // untouched
    expect(result.current.reviews[1].totalVotes).toBe(20)
  })

  it('toasts error and logs on vote failure (no state mutation)', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: true, data: { reviews: [baseReview] } })
      .mockResolvedValueOnce({ success: false, error: 'rate limit' })

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.handleVote('rev-1', 'helpful')
    })

    expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining('rate limit'))
    expect(mockLoggerError).toHaveBeenCalled()
    // Vote counts unchanged
    expect(result.current.reviews[0].helpfulVotes).toBe(3)
    expect(result.current.reviews[0].totalVotes).toBe(5)
  })
})

// ============================================================================
// canEditReview — 30-day window
// ============================================================================

describe('canEditReview', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-01-15T12:00:00Z'))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns true for a review created today', () => {
    const { result } = renderHook(() => useReviewManagement('loading'))
    expect(result.current.canEditReview('2026-01-15T10:00:00Z')).toBe(true)
  })

  it('returns true for a review created 29 days ago', () => {
    const { result } = renderHook(() => useReviewManagement('loading'))
    // 29 days before 2026-01-15 = 2025-12-17
    expect(result.current.canEditReview('2025-12-17T12:00:00Z')).toBe(true)
  })

  it('returns true at exactly 30 days (boundary inclusive)', () => {
    const { result } = renderHook(() => useReviewManagement('loading'))
    // 30 days before 2026-01-15 = 2025-12-16
    expect(result.current.canEditReview('2025-12-16T12:00:00Z')).toBe(true)
  })

  it('returns false for a review created 31 days ago', () => {
    const { result } = renderHook(() => useReviewManagement('loading'))
    // 31 days before = 2025-12-15
    expect(result.current.canEditReview('2025-12-15T11:00:00Z')).toBe(false)
  })

  it('returns false for an ancient review', () => {
    const { result } = renderHook(() => useReviewManagement('loading'))
    expect(result.current.canEditReview('2024-01-01T00:00:00Z')).toBe(false)
  })
})

// ============================================================================
// getUserVoteForReview
// ============================================================================

describe('getUserVoteForReview', () => {
  it('returns the voteType after a successful vote', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: true, data: { reviews: [baseReview] } })
      .mockResolvedValueOnce({ success: true, data: { action: 'added' } })

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.handleVote('rev-1', 'helpful')
    })

    expect(result.current.getUserVoteForReview('rev-1')).toBe('helpful')
    expect(result.current.getUserVoteForReview('rev-other')).toBeUndefined()
  })

  it('returns undefined after the vote is removed', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: true, data: { reviews: [baseReview] } })
      .mockResolvedValueOnce({ success: true, data: { action: 'added' } })
      .mockResolvedValueOnce({ success: true, data: { action: 'removed' } })

    const { result } = renderHook(() => useReviewManagement('authenticated'))
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      await result.current.handleVote('rev-1', 'helpful')
    })
    expect(result.current.getUserVoteForReview('rev-1')).toBe('helpful')

    await act(async () => {
      await result.current.handleVote('rev-1', 'helpful')
    })
    expect(result.current.getUserVoteForReview('rev-1')).toBeUndefined()
  })
})
