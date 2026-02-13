import { useState, useCallback } from 'react';

/**
 * Marketplace filter state
 * Consolidates multiple useState calls into single object
 */
export interface MarketplaceFilters {
  category: string;
  condition: string;
  delivery: string;
  payment: string;
  sort: string;
  search: string;
  searchInput: string;
  priceMin: string;
  priceMax: string;
  priceError: string | null;
}

/**
 * Custom hook to manage marketplace filter state
 *
 * Consolidates 11 separate useState calls into a single object,
 * reducing complexity and improving maintainability.
 *
 * @returns Filter state and update functions
 */
export function useMarketplaceFilters() {
  const [filters, setFilters] = useState<MarketplaceFilters>({
    category: '',
    condition: '',
    delivery: '',
    payment: '',
    sort: 'newest',
    search: '',
    searchInput: '',
    priceMin: '',
    priceMax: '',
    priceError: null,
  });

  /**
   * Update a single filter field
   */
  const updateFilter = useCallback((key: keyof MarketplaceFilters, value: string | null) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  /**
   * Update multiple filter fields at once
   */
  const updateFilters = useCallback((updates: Partial<MarketplaceFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  /**
   * Reset all filters to default values
   */
  const clearFilters = useCallback(() => {
    setFilters({
      category: '',
      condition: '',
      delivery: '',
      payment: '',
      sort: 'newest',
      search: '',
      searchInput: '',
      priceMin: '',
      priceMax: '',
      priceError: null,
    });
  }, []);

  /**
   * Validate price range
   */
  const validatePrices = useCallback(() => {
    const min = Number(filters.priceMin);
    const max = Number(filters.priceMax);

    if (filters.priceMin && min < 0) {
      updateFilter('priceError', 'Preis kann nicht negativ sein');
      return false;
    }
    if (filters.priceMax && max < 0) {
      updateFilter('priceError', 'Preis kann nicht negativ sein');
      return false;
    }
    if (filters.priceMin && filters.priceMax && min > max) {
      updateFilter('priceError', 'Mindestpreis darf nicht höher als Höchstpreis sein');
      return false;
    }
    if (filters.priceMin && min > 50000) {
      updateFilter('priceError', 'Preis darf maximal CHF 50\'000 sein');
      return false;
    }
    if (filters.priceMax && max > 50000) {
      updateFilter('priceError', 'Preis darf maximal CHF 50\'000 sein');
      return false;
    }

    updateFilter('priceError', null);
    return true;
  }, [filters.priceMin, filters.priceMax, updateFilter]);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters =
    filters.category ||
    filters.condition ||
    filters.delivery ||
    filters.payment ||
    filters.search ||
    filters.priceMin ||
    filters.priceMax;

  return {
    filters,
    updateFilter,
    updateFilters,
    clearFilters,
    validatePrices,
    hasActiveFilters,
  };
}
