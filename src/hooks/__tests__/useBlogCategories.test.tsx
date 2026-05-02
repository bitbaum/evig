/**
 * Tests for useBlogCategories — admin blog category CRUD hook.
 *
 * Two actions (save = create or edit, delete) plus message-state
 * management. Locks the URL+method routing for each action and the
 * Swiss-German messages so the admin UI stays consistent.
 *
 *   saveCategory(data, { isEdit: true,  id: 'x' }) → PATCH /api/admin/blog/categories/x
 *   saveCategory(data, { isEdit: false })          → POST  /api/admin/blog/categories
 *   deleteCategory('x')                            → DELETE /api/admin/blog/categories/x
 *   clearMessages()                                → resets error + success
 */

const mockApiFetch = jest.fn()

jest.mock('@/lib/api/client', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch.apply(null, args),
}))

import { renderHook, act, waitFor } from '@testing-library/react'
import { useBlogCategories, type CategoryFormData } from '../useBlogCategories'

const sampleData: CategoryFormData = {
  name: 'Linux',
  slug: 'linux',
  description: 'Open-source OS',
  color: '#0066ff',
  sort_order: 1,
  is_active: true,
}

beforeEach(() => {
  mockApiFetch.mockReset()
})

// ============================================================================
// Initial state + clearMessages
// ============================================================================

describe('useBlogCategories — initial state', () => {
  it('starts with no error/success and not saving/deleting', () => {
    const { result } = renderHook(() => useBlogCategories())
    expect(result.current.saving).toBe(false)
    expect(result.current.deleting).toBe(false)
    expect(result.current.error).toBe('')
    expect(result.current.success).toBe('')
  })
})

describe('clearMessages', () => {
  it('resets both error and success state to empty strings', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useBlogCategories())

    // Populate success via a save
    await act(async () => {
      await result.current.saveCategory(sampleData, { isEdit: false })
    })
    expect(result.current.success).toBe('Kategorie erstellt!')

    act(() => {
      result.current.clearMessages()
    })

    expect(result.current.error).toBe('')
    expect(result.current.success).toBe('')
  })
})

// ============================================================================
// saveCategory — create
// ============================================================================

describe('saveCategory — create mode', () => {
  it('POSTs to /api/admin/blog/categories with the data', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useBlogCategories())

    await act(async () => {
      await result.current.saveCategory(sampleData, { isEdit: false })
    })

    expect(mockApiFetch).toHaveBeenCalledWith('/api/admin/blog/categories', {
      method: 'POST',
      body: sampleData,
    })
  })

  it('returns true and sets "Kategorie erstellt!" on success', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useBlogCategories())

    let ok = false
    await act(async () => {
      ok = await result.current.saveCategory(sampleData, { isEdit: false })
    })

    expect(ok).toBe(true)
    expect(result.current.success).toBe('Kategorie erstellt!')
    expect(result.current.error).toBe('')
  })

  it('returns false and sets error from result on failure', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false, error: 'Slug already exists' })

    const { result } = renderHook(() => useBlogCategories())

    let ok = true
    await act(async () => {
      ok = await result.current.saveCategory(sampleData, { isEdit: false })
    })

    expect(ok).toBe(false)
    expect(result.current.error).toBe('Slug already exists')
    expect(result.current.success).toBe('')
  })

  it('uses Swiss-German fallback "Fehler beim Speichern" when error missing', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false })

    const { result } = renderHook(() => useBlogCategories())

    await act(async () => {
      await result.current.saveCategory(sampleData, { isEdit: false })
    })

    expect(result.current.error).toBe('Fehler beim Speichern')
  })

  it('catches thrown exceptions with "Netzwerkfehler" Swiss-German message', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('connection lost'))

    const { result } = renderHook(() => useBlogCategories())

    let ok = true
    await act(async () => {
      ok = await result.current.saveCategory(sampleData, { isEdit: false })
    })

    expect(ok).toBe(false)
    expect(result.current.error).toBe('Netzwerkfehler')
  })

  it('clears success/error before the new attempt', async () => {
    mockApiFetch
      .mockResolvedValueOnce({ success: false, error: 'first error' })
      .mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useBlogCategories())

    await act(async () => {
      await result.current.saveCategory(sampleData, { isEdit: false })
    })
    expect(result.current.error).toBe('first error')

    await act(async () => {
      await result.current.saveCategory(sampleData, { isEdit: false })
    })

    // Previous error cleared, new success set
    expect(result.current.error).toBe('')
    expect(result.current.success).toBe('Kategorie erstellt!')
  })
})

// ============================================================================
// saveCategory — edit
// ============================================================================

describe('saveCategory — edit mode', () => {
  it('PATCHes /api/admin/blog/categories/{id}', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useBlogCategories())

    await act(async () => {
      await result.current.saveCategory(sampleData, { isEdit: true, id: 'cat-1' })
    })

    expect(mockApiFetch).toHaveBeenCalledWith('/api/admin/blog/categories/cat-1', {
      method: 'PATCH',
      body: sampleData,
    })
  })

  it('uses different success message: "Kategorie gespeichert!"', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useBlogCategories())

    await act(async () => {
      await result.current.saveCategory(sampleData, { isEdit: true, id: 'cat-1' })
    })

    expect(result.current.success).toBe('Kategorie gespeichert!')
  })

  it('isEdit=true with id=undefined produces /undefined URL (documented edge — caller must validate id)', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useBlogCategories())

    await act(async () => {
      await result.current.saveCategory(sampleData, { isEdit: true, id: undefined })
    })

    // The hook does not guard against missing id — it just builds the URL
    expect(mockApiFetch.mock.calls[0][0]).toBe('/api/admin/blog/categories/undefined')
  })
})

// ============================================================================
// saveCategory — saving lifecycle
// ============================================================================

describe('saveCategory — saving lifecycle', () => {
  it('flips saving=true mid-flight, false after', async () => {
    let resolveRequest!: (val: unknown) => void
    mockApiFetch.mockReturnValueOnce(new Promise(r => { resolveRequest = r }))

    const { result } = renderHook(() => useBlogCategories())

    let savePromise!: Promise<unknown>
    act(() => {
      savePromise = result.current.saveCategory(sampleData, { isEdit: false })
    })

    await waitFor(() => expect(result.current.saving).toBe(true))

    await act(async () => {
      resolveRequest({ success: true })
      await savePromise
    })

    expect(result.current.saving).toBe(false)
  })

  it('saving flips back to false even after exception (finally)', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('boom'))

    const { result } = renderHook(() => useBlogCategories())

    await act(async () => {
      await result.current.saveCategory(sampleData, { isEdit: false })
    })

    expect(result.current.saving).toBe(false)
  })
})

// ============================================================================
// deleteCategory
// ============================================================================

describe('deleteCategory', () => {
  it('DELETEs /api/admin/blog/categories/{id}', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useBlogCategories())

    await act(async () => {
      await result.current.deleteCategory('cat-1')
    })

    expect(mockApiFetch).toHaveBeenCalledWith('/api/admin/blog/categories/cat-1', {
      method: 'DELETE',
    })
  })

  it('returns true on success', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useBlogCategories())

    let ok = false
    await act(async () => {
      ok = await result.current.deleteCategory('cat-1')
    })

    expect(ok).toBe(true)
  })

  it('does NOT set a success message on delete (success state stays empty)', async () => {
    // Documented divergence from saveCategory — delete just returns
    // boolean; the caller usually reflects the deletion in the list UI
    mockApiFetch.mockResolvedValueOnce({ success: true })

    const { result } = renderHook(() => useBlogCategories())

    await act(async () => {
      await result.current.deleteCategory('cat-1')
    })

    expect(result.current.success).toBe('')
  })

  it('returns false and sets error on failure with provided message', async () => {
    mockApiFetch.mockResolvedValueOnce({ success: false, error: 'Cannot delete: in use' })

    const { result } = renderHook(() => useBlogCategories())

    let ok = true
    await act(async () => {
      ok = await result.current.deleteCategory('cat-1')
    })

    expect(ok).toBe(false)
    expect(result.current.error).toBe('Cannot delete: in use')
  })

  it('uses "Fehler beim Löschen" Swiss-German fallback (proper umlaut, not Loeschen)', async () => {
    // CLAUDE.md rule #4 — proper umlaut, no ASCII substitution
    mockApiFetch.mockResolvedValueOnce({ success: false })

    const { result } = renderHook(() => useBlogCategories())

    await act(async () => {
      await result.current.deleteCategory('cat-1')
    })

    expect(result.current.error).toBe('Fehler beim Löschen')
    expect(result.current.error).not.toContain('Loeschen')
  })

  it('catches thrown exceptions with "Netzwerkfehler" message', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('connection lost'))

    const { result } = renderHook(() => useBlogCategories())

    let ok = true
    await act(async () => {
      ok = await result.current.deleteCategory('cat-1')
    })

    expect(ok).toBe(false)
    expect(result.current.error).toBe('Netzwerkfehler')
  })

  it('clears error before the new attempt (but does NOT clear success)', async () => {
    // delete only clears error, not success — so a "Kategorie gespeichert!"
    // success message survives a subsequent delete attempt
    mockApiFetch
      .mockResolvedValueOnce({ success: true })  // save sets success
      .mockResolvedValueOnce({ success: false, error: 'cannot' }) // delete sets error

    const { result } = renderHook(() => useBlogCategories())

    await act(async () => {
      await result.current.saveCategory(sampleData, { isEdit: true, id: 'cat-1' })
    })
    expect(result.current.success).toBe('Kategorie gespeichert!')

    await act(async () => {
      await result.current.deleteCategory('cat-1')
    })

    // Success message untouched, error populated
    expect(result.current.success).toBe('Kategorie gespeichert!')
    expect(result.current.error).toBe('cannot')
  })

  it('flips deleting=true mid-flight, false after (independent of saving)', async () => {
    let resolveRequest!: (val: unknown) => void
    mockApiFetch.mockReturnValueOnce(new Promise(r => { resolveRequest = r }))

    const { result } = renderHook(() => useBlogCategories())

    let deletePromise!: Promise<unknown>
    act(() => {
      deletePromise = result.current.deleteCategory('cat-1')
    })

    await waitFor(() => expect(result.current.deleting).toBe(true))
    expect(result.current.saving).toBe(false) // independent

    await act(async () => {
      resolveRequest({ success: true })
      await deletePromise
    })

    expect(result.current.deleting).toBe(false)
  })

  it('deleting flips back to false even after exception (finally)', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('boom'))

    const { result } = renderHook(() => useBlogCategories())

    await act(async () => {
      await result.current.deleteCategory('cat-1')
    })

    expect(result.current.deleting).toBe(false)
  })
})
