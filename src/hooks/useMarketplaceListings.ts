'use client'

import { useState, useEffect, useCallback } from 'react'
import { useDebounce } from '@/hooks/useDebounce'
import { apiFetch } from '@/lib/api/client'
import { MARKETPLACE_LIMITS } from '@/config/marketplace'

export interface ListingItem {
  id: string
  title: string
  price_chf: number
  category: string
  condition: string
  brand: string | null
  model: string | null
  delivery_options: string
  payment_mode: string
  is_revampit: boolean
  pickup_location: string | null
  view_count: number
  favorite_count: number
  created_at: string
  seller_name: string
  seller_display_name: string | null
  seller_rating: number | null
  seller_city: string | null
  thumbnail: string | null
  verified_at: string | null
  specs?: Array<{ key: string; value: string; unit: string | null }>
}

interface Pagination {
  total: number
  limit: number
  offset: number
}

export interface MarketplaceFilters {
  category: string
  condition: string
  delivery: string
  payment: string
  sort: string
  searchInput: string
  priceMin: string
  priceMax: string
  sellerType: string
  gratisOnly: boolean
  verifiedOnly: boolean
  specRamMin: string
  specStorageMin: string
  specDisplayMin: string
}

export function useMarketplaceListings() {
  const [listings, setListings] = useState<ListingItem[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit: MARKETPLACE_LIMITS.DEFAULT_PAGE_SIZE,
    offset: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState('')
  const [delivery, setDelivery] = useState('')
  const [payment, setPayment] = useState('')
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [priceError, setPriceError] = useState<string | null>(null)
  // Phase 1 additions
  const [sellerType, setSellerType] = useState('')
  const [gratisOnly, setGratisOnly] = useState(false)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [specRamMin, setSpecRamMin] = useState('')
  const [specStorageMin, setSpecStorageMin] = useState('')
  const [specDisplayMin, setSpecDisplayMin] = useState('')

  const debouncedSearch = useDebounce(searchInput, 300)

  const validatePrices = useCallback(() => {
    const min = Number(priceMin)
    const max = Number(priceMax)

    if (priceMin && min < 0) {
      setPriceError('Preis kann nicht negativ sein')
      return false
    }
    if (priceMax && max < 0) {
      setPriceError('Preis kann nicht negativ sein')
      return false
    }
    if (priceMin && priceMax && min > max) {
      setPriceError('Mindestpreis darf nicht höher als Höchstpreis sein')
      return false
    }
    if (priceMin && min > 50000) {
      setPriceError('Preis darf maximal CHF 50\'000 sein')
      return false
    }
    if (priceMax && max > 50000) {
      setPriceError('Preis darf maximal CHF 50\'000 sein')
      return false
    }

    setPriceError(null)
    return true
  }, [priceMin, priceMax])

  const fetchListings = useCallback(async () => {
    if (!validatePrices()) return
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (condition) params.set('condition', condition)
      if (delivery) params.set('delivery', delivery)
      if (payment) params.set('payment', payment)
      if (sort) params.set('sort', sort)
      if (search) params.set('search', search)
      if (priceMin) params.set('price_min', priceMin)
      if (priceMax) params.set('price_max', priceMax)
      if (sellerType) params.set('seller_type', sellerType)
      if (gratisOnly) params.set('gratis_only', 'true')
      if (verifiedOnly) params.set('verified_only', 'true')
      if (specRamMin) params.set('spec_ram_min', specRamMin)
      if (specStorageMin) params.set('spec_storage_min', specStorageMin)
      if (specDisplayMin) params.set('spec_display_min', specDisplayMin)
      params.set('limit', String(pagination.limit))
      params.set('offset', String(pagination.offset))

      const result = await apiFetch<{ items: ListingItem[]; pagination: Pagination }>(`/api/listings?${params.toString()}`)

      if (result.success && result.data) {
        setListings(result.data.items)
        setPagination(result.data.pagination)
      } else {
        throw new Error(result.error || 'Fehler beim Laden der Inserate')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unerwarteter Fehler ist aufgetreten')
      setListings([])
    } finally {
      setIsLoading(false)
    }
  }, [category, condition, delivery, payment, sort, search, priceMin, priceMax, sellerType, gratisOnly, verifiedOnly, specRamMin, specStorageMin, specDisplayMin, pagination.limit, pagination.offset, validatePrices])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  // Auto-search when debounced input changes
  useEffect(() => {
    if (debouncedSearch !== search) {
      setSearch(debouncedSearch)
      setPagination(prev => ({ ...prev, offset: 0 }))
    }
  }, [debouncedSearch, search])

  const resetOffset = () => setPagination(prev => ({ ...prev, offset: 0 }))

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    resetOffset()
  }

  const clearFilters = () => {
    setCategory('')
    setCondition('')
    setDelivery('')
    setPayment('')
    setSort('newest')
    setSearch('')
    setSearchInput('')
    setPriceMin('')
    setPriceMax('')
    setSellerType('')
    setGratisOnly(false)
    setVerifiedOnly(false)
    setSpecRamMin('')
    setSpecStorageMin('')
    setSpecDisplayMin('')
    resetOffset()
  }

  const hasActiveFilters = !!(category || condition || delivery || payment || search || priceMin || priceMax || sellerType || gratisOnly || verifiedOnly || specRamMin || specStorageMin || specDisplayMin)

  const totalPages = Math.ceil(pagination.total / pagination.limit)
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1

  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, offset: (page - 1) * prev.limit }))
  }

  return {
    // Data
    listings,
    pagination,
    isLoading,
    error,
    // Filters
    filters: {
      category, setCategory,
      condition, setCondition,
      delivery, setDelivery,
      payment, setPayment,
      sort, setSort,
      searchInput, setSearchInput,
      priceMin, setPriceMin,
      priceMax, setPriceMax,
      priceError, setPriceError,
      sellerType, setSellerType,
      gratisOnly, setGratisOnly,
      verifiedOnly, setVerifiedOnly,
      specRamMin, setSpecRamMin,
      specStorageMin, setSpecStorageMin,
      specDisplayMin, setSpecDisplayMin,
    },
    // Actions
    handleSearch,
    clearFilters,
    validatePrices,
    fetchListings,
    resetOffset,
    goToPage,
    // Computed
    hasActiveFilters,
    totalPages,
    currentPage,
  }
}
