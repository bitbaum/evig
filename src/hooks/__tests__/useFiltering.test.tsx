/**
 * Tests for useFiltering — generic list/grid filter hook used by
 * FilterableGrid, FilterBar, and FilterableSection (the marketplace
 * + content browse UIs).
 *
 * Pure logic on top of useState + useMemo. Locks the contract:
 *
 *   - Initial state pulls defaultValue per filter, "All" otherwise
 *   - filterOptions intersects the configured options[] with the values
 *     actually present in items[] (drops dead options)
 *   - filteredItems matches items where EVERY active filter matches
 *     (or filter is set to "All")
 *   - updateFilter sets a single key without mutating others
 *   - toggleFilter reverts to "All" if already selected
 *   - resetFilters returns to initial state
 *   - getFilterSummary shows label:"value" for each non-All filter
 *   - hasActiveFilters is true iff any filter is non-All
 */

import { renderHook, act } from '@testing-library/react'
import { useFiltering, type FilterConfig } from '../useFiltering'

interface Product {
  id: string
  category: string
  brand: string
  condition: string
}

const items: Product[] = [
  { id: '1', category: 'laptop', brand: 'Apple',  condition: 'good' },
  { id: '2', category: 'laptop', brand: 'Dell',   condition: 'fair' },
  { id: '3', category: 'phone',  brand: 'Apple',  condition: 'good' },
  { id: '4', category: 'phone',  brand: 'Samsung', condition: 'new' },
  { id: '5', category: 'tablet', brand: 'Apple',  condition: 'good' },
]

const filters: FilterConfig[] = [
  { key: 'category', label: 'Kategorie', options: ['laptop', 'phone', 'tablet', 'desktop'] },
  { key: 'brand',    label: 'Marke',     options: ['Apple', 'Dell', 'Samsung', 'HP'] },
  { key: 'condition', label: 'Zustand',  options: ['new', 'good', 'fair', 'poor'] },
]

// ============================================================================
// Initial state
// ============================================================================

describe('useFiltering — initial state', () => {
  it('every filter starts at "Alle" by default', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))

    expect(result.current.filterState).toEqual({
      category: 'Alle',
      brand: 'Alle',
      condition: 'Alle',
    })
    expect(result.current.hasActiveFilters).toBe(false)
  })

  it('honors per-filter defaultValue', () => {
    const filtersWithDefault: FilterConfig[] = [
      { key: 'category', label: 'Kategorie', options: ['laptop', 'phone'], defaultValue: 'laptop' },
      { key: 'brand', label: 'Marke', options: ['Apple', 'Dell'] },
    ]
    const { result } = renderHook(() => useFiltering({ items, filters: filtersWithDefault }))

    expect(result.current.filterState.category).toBe('laptop')
    expect(result.current.filterState.brand).toBe('Alle')
    // defaultValue counts as active
    expect(result.current.hasActiveFilters).toBe(true)
  })

  it('honors custom allLabel for non-German UI', () => {
    const { result } = renderHook(() =>
      useFiltering({ items, filters, allLabel: 'All' }),
    )
    expect(result.current.filterState).toEqual({
      category: 'All',
      brand: 'All',
      condition: 'All',
    })
  })
})

// ============================================================================
// filterOptions — intersection of configured options + actual item values
// ============================================================================

describe('useFiltering — filterOptions', () => {
  it('prepends "Alle" and drops options not present in items', () => {
    // 'desktop' is in the config but no item has it → dropped
    // 'HP' is in the config but no item has it → dropped
    const { result } = renderHook(() => useFiltering({ items, filters }))

    const categoryOpts = result.current.filterOptions.find(f => f.key === 'category')!.options
    expect(categoryOpts).toEqual(['Alle', 'laptop', 'phone', 'tablet'])
    expect(categoryOpts).not.toContain('desktop')

    const brandOpts = result.current.filterOptions.find(f => f.key === 'brand')!.options
    expect(brandOpts).toEqual(['Alle', 'Apple', 'Dell', 'Samsung'])
    expect(brandOpts).not.toContain('HP')
  })

  it('always keeps "Alle" first (sentinel for "no filter")', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))
    for (const opt of result.current.filterOptions) {
      expect(opt.options[0]).toBe('Alle')
    }
  })

  it('preserves the configured options[] order (filter, then dedup, not re-sort)', () => {
    // options config: ['laptop', 'phone', 'tablet', 'desktop']
    // present in items: laptop, phone, tablet
    // expected: ['Alle', 'laptop', 'phone', 'tablet'] in that order
    const { result } = renderHook(() => useFiltering({ items, filters }))
    const opts = result.current.filterOptions.find(f => f.key === 'category')!.options
    expect(opts).toEqual(['Alle', 'laptop', 'phone', 'tablet'])
  })
})

// ============================================================================
// filteredItems
// ============================================================================

describe('useFiltering — filteredItems', () => {
  it('returns ALL items when every filter is "Alle"', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))
    expect(result.current.filteredItems).toHaveLength(5)
  })

  it('filters by a single dimension', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))

    act(() => {
      result.current.updateFilter('category', 'laptop')
    })

    expect(result.current.filteredItems).toHaveLength(2)
    expect(result.current.filteredItems.map(i => i.id)).toEqual(['1', '2'])
  })

  it('AND-combines multiple active filters', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))

    act(() => {
      result.current.updateFilter('category', 'laptop')
    })
    act(() => {
      result.current.updateFilter('brand', 'Apple')
    })

    expect(result.current.filteredItems).toHaveLength(1)
    expect(result.current.filteredItems[0].id).toBe('1')
  })

  it('returns empty when no item matches the combined filter', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))

    act(() => {
      result.current.updateFilter('category', 'tablet')
    })
    act(() => {
      result.current.updateFilter('brand', 'Dell') // no Dell tablet
    })

    expect(result.current.filteredItems).toEqual([])
  })

  it('"Alle" on a dimension matches everything (the sentinel)', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))

    act(() => {
      result.current.updateFilter('brand', 'Apple')
      // category stays "Alle"
    })

    // 3 Apple items: laptop, phone, tablet
    expect(result.current.filteredItems).toHaveLength(3)
  })
})

// ============================================================================
// updateFilter
// ============================================================================

describe('useFiltering — updateFilter', () => {
  it('sets a single filter without mutating others', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))

    act(() => {
      result.current.updateFilter('category', 'laptop')
    })

    expect(result.current.filterState).toEqual({
      category: 'laptop',
      brand: 'Alle',
      condition: 'Alle',
    })
  })

  it('overwrites existing value', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))

    act(() => {
      result.current.updateFilter('category', 'laptop')
    })
    act(() => {
      result.current.updateFilter('category', 'phone')
    })

    expect(result.current.filterState.category).toBe('phone')
  })
})

// ============================================================================
// toggleFilter
// ============================================================================

describe('useFiltering — toggleFilter', () => {
  it('selects the value when not already selected', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))

    act(() => {
      result.current.toggleFilter('category', 'laptop')
    })

    expect(result.current.filterState.category).toBe('laptop')
  })

  it('reverts to "Alle" when toggling the currently-selected value (deselect)', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))

    act(() => {
      result.current.toggleFilter('category', 'laptop')
    })
    act(() => {
      result.current.toggleFilter('category', 'laptop')
    })

    expect(result.current.filterState.category).toBe('Alle')
  })

  it('switches to a different value (does not toggle to "Alle" between values)', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))

    act(() => {
      result.current.toggleFilter('category', 'laptop')
    })
    act(() => {
      result.current.toggleFilter('category', 'phone')
    })

    expect(result.current.filterState.category).toBe('phone')
  })
})

// ============================================================================
// resetFilters
// ============================================================================

describe('useFiltering — resetFilters', () => {
  it('restores all filters to "Alle" (or their defaultValue)', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))

    act(() => {
      result.current.updateFilter('category', 'laptop')
    })
    act(() => {
      result.current.updateFilter('brand', 'Apple')
    })

    act(() => {
      result.current.resetFilters()
    })

    expect(result.current.filterState).toEqual({
      category: 'Alle',
      brand: 'Alle',
      condition: 'Alle',
    })
  })

  it('reset preserves configured defaultValue (not "Alle" if a default was set)', () => {
    const filtersWithDefault: FilterConfig[] = [
      { key: 'category', label: 'Kategorie', options: ['laptop', 'phone'], defaultValue: 'laptop' },
    ]
    const { result } = renderHook(() => useFiltering({ items, filters: filtersWithDefault }))

    act(() => {
      result.current.updateFilter('category', 'phone')
    })
    act(() => {
      result.current.resetFilters()
    })

    expect(result.current.filterState.category).toBe('laptop')
  })
})

// ============================================================================
// getFilterSummary
// ============================================================================

describe('useFiltering — getFilterSummary', () => {
  it('returns null when no filter is active', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))
    expect(result.current.getFilterSummary()).toBeNull()
  })

  it('returns a single label:"value" entry', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))

    act(() => {
      result.current.updateFilter('category', 'laptop')
    })

    expect(result.current.getFilterSummary()).toBe('Kategorie: "laptop"')
  })

  it('joins multiple active filters with ", "', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))

    act(() => {
      result.current.updateFilter('category', 'laptop')
    })
    act(() => {
      result.current.updateFilter('brand', 'Apple')
    })

    expect(result.current.getFilterSummary()).toBe(
      'Kategorie: "laptop", Marke: "Apple"',
    )
  })

  it('preserves configured filter order in the summary', () => {
    // filters config order: category, brand, condition
    const { result } = renderHook(() => useFiltering({ items, filters }))

    act(() => {
      result.current.updateFilter('condition', 'good')
    })
    act(() => {
      result.current.updateFilter('category', 'laptop')
    })

    // Summary follows filters[] order, not insertion order
    expect(result.current.getFilterSummary()).toBe(
      'Kategorie: "laptop", Zustand: "good"',
    )
  })
})

// ============================================================================
// hasActiveFilters
// ============================================================================

describe('useFiltering — hasActiveFilters', () => {
  it('false when every filter is "Alle"', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))
    expect(result.current.hasActiveFilters).toBe(false)
  })

  it('true when any filter is non-"Alle"', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))

    act(() => {
      result.current.updateFilter('brand', 'Apple')
    })

    expect(result.current.hasActiveFilters).toBe(true)
  })

  it('true with defaultValue (a default counts as active)', () => {
    const filtersWithDefault: FilterConfig[] = [
      { key: 'category', label: 'Kategorie', options: ['laptop'], defaultValue: 'laptop' },
    ]
    const { result } = renderHook(() => useFiltering({ items, filters: filtersWithDefault }))
    expect(result.current.hasActiveFilters).toBe(true)
  })

  it('false again after resetFilters when no defaults', () => {
    const { result } = renderHook(() => useFiltering({ items, filters }))

    act(() => {
      result.current.updateFilter('category', 'laptop')
    })
    act(() => {
      result.current.resetFilters()
    })

    expect(result.current.hasActiveFilters).toBe(false)
  })
})
