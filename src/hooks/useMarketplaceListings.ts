'use client';

import { useState, useMemo, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useSwrFetch } from '@/lib/api/swr';
import { MARKETPLACE_LIMITS } from '@/config/marketplace';

export interface ListingItem {
  id: string;
  title: string;
  price_chf: number;
  category: string;
  condition: string;
  brand: string | null;
  model: string | null;
  delivery_options: string;
  payment_mode: string;
  is_revampit: boolean;
  pickup_location: string | null;
  view_count: number;
  favorite_count: number;
  created_at: string;
  seller_name: string;
  seller_display_name: string | null;
  seller_rating: number | null;
  seller_city: string | null;
  seller_is_verified: boolean | null;
  thumbnail: string | null;
  verified_at: string | null;
  specs?: Array<{ key: string; value: string; unit: string | null }>;
}

interface Pagination {
  total: number;
  limit: number;
  offset: number;
}

export interface MarketplaceFilters {
  category: string;
  condition: string;
  delivery: string;
  payment: string;
  sort: string;
  searchInput: string;
  priceMin: string;
  priceMax: string;
  sellerType: string;
  gratisOnly: boolean;
  verifiedOnly: boolean;
  specRamMin: string;
  specStorageMin: string;
  specDisplayMin: string;
}

interface InitialMarketplaceFilters {
  category?: string;
  sellerType?: string;
  search?: string;
}

export function useMarketplaceListings(initialFilters: InitialMarketplaceFilters = {}) {
  const [offset, setOffset] = useState(0);

  // Filters
  const [category, setCategory] = useState(initialFilters.category ?? '');
  const [condition, setCondition] = useState('');
  const [delivery, setDelivery] = useState('');
  const [payment, setPayment] = useState('');
  const [sort, setSort] = useState('newest');
  const [searchInput, setSearchInputState] = useState(initialFilters.search ?? '');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  // Phase 1 additions
  const [sellerType, setSellerType] = useState(initialFilters.sellerType ?? '');
  const [gratisOnly, setGratisOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [specRamMin, setSpecRamMin] = useState('');
  const [specStorageMin, setSpecStorageMin] = useState('');
  const [specDisplayMin, setSpecDisplayMin] = useState('');

  // The debounced input IS the applied search term (no second `search` copy).
  const debouncedSearch = useDebounce(searchInput, 300);

  // Derived, not state: recomputes as the user types, clears itself when the
  // inputs become valid again.
  const priceError = useMemo((): string | null => {
    const min = Number(priceMin);
    const max = Number(priceMax);
    if ((priceMin && min < 0) || (priceMax && max < 0)) return 'Preis kann nicht negativ sein';
    if (priceMin && priceMax && min > max)
      return 'Mindestpreis darf nicht höher als Höchstpreis sein';
    if ((priceMin && min > 50000) || (priceMax && max > 50000))
      return "Preis darf maximal CHF 50'000 sein";
    return null;
  }, [priceMin, priceMax]);

  // All applied filters + pagination live in the SWR key — any change
  // refetches automatically. Invalid price bounds are simply not applied.
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (condition) params.set('condition', condition);
  if (delivery) params.set('delivery', delivery);
  if (payment) params.set('payment', payment);
  if (sort) params.set('sort', sort);
  if (debouncedSearch) params.set('search', debouncedSearch);
  if (priceMin && !priceError) params.set('price_min', priceMin);
  if (priceMax && !priceError) params.set('price_max', priceMax);
  if (sellerType) params.set('seller_type', sellerType);
  if (gratisOnly) params.set('gratis_only', 'true');
  if (verifiedOnly) params.set('verified_only', 'true');
  if (specRamMin) params.set('spec_ram_min', specRamMin);
  if (specStorageMin) params.set('spec_storage_min', specStorageMin);
  if (specDisplayMin) params.set('spec_display_min', specDisplayMin);
  params.set('limit', String(MARKETPLACE_LIMITS.DEFAULT_PAGE_SIZE));
  params.set('offset', String(offset));

  const {
    data,
    error: loadError,
    isLoading,
    mutate,
  } = useSwrFetch<{
    items: ListingItem[];
    pagination: Pagination;
  }>(`/api/listings?${params.toString()}`);

  const fetchListings = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const listings = data?.items ?? [];
  const pagination: Pagination = data?.pagination ?? {
    total: 0,
    limit: MARKETPLACE_LIMITS.DEFAULT_PAGE_SIZE,
    offset,
  };
  const error = loadError
    ? loadError instanceof Error && loadError.message
      ? loadError.message
      : 'Ein unerwarteter Fehler ist aufgetreten'
    : null;

  const resetOffset = () => setOffset(0);

  // Typing starts a new search — back to the first page immediately.
  const setSearchInput = useCallback((value: string) => {
    setSearchInputState(value);
    setOffset(0);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The debounced term applies within 300ms; submit just resets paging.
    resetOffset();
  };

  const clearFilters = () => {
    setCategory('');
    setCondition('');
    setDelivery('');
    setPayment('');
    setSort('newest');
    setSearchInputState('');
    setPriceMin('');
    setPriceMax('');
    setSellerType('');
    setGratisOnly(false);
    setVerifiedOnly(false);
    setSpecRamMin('');
    setSpecStorageMin('');
    setSpecDisplayMin('');
    resetOffset();
  };

  const hasActiveFilters = !!(
    category ||
    condition ||
    delivery ||
    payment ||
    searchInput ||
    priceMin ||
    priceMax ||
    sellerType ||
    gratisOnly ||
    verifiedOnly ||
    specRamMin ||
    specStorageMin ||
    specDisplayMin
  );

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  const goToPage = (page: number) => {
    setOffset((page - 1) * MARKETPLACE_LIMITS.DEFAULT_PAGE_SIZE);
  };

  return {
    // Data
    listings,
    pagination,
    isLoading,
    error,
    // Filters
    filters: {
      category,
      setCategory,
      condition,
      setCondition,
      delivery,
      setDelivery,
      payment,
      setPayment,
      sort,
      setSort,
      searchInput,
      setSearchInput,
      priceMin,
      setPriceMin,
      priceMax,
      setPriceMax,
      priceError,
      sellerType,
      setSellerType,
      gratisOnly,
      setGratisOnly,
      verifiedOnly,
      setVerifiedOnly,
      specRamMin,
      setSpecRamMin,
      specStorageMin,
      setSpecStorageMin,
      specDisplayMin,
      setSpecDisplayMin,
    },
    // Actions
    handleSearch,
    clearFilters,
    fetchListings,
    resetOffset,
    goToPage,
    // Computed
    hasActiveFilters,
    totalPages,
    currentPage,
  };
}
