'use client';

import { useState, useCallback } from 'react';
import { useSwrFetch } from '@/lib/api/swr';
import type { ITHilfeRequest } from '@/components/it-hilfe/detail/types';
import { PAGINATION } from '@/config/pagination';

export interface ITHilfeFilters {
  category: string;
  canton: string;
  urgency: string;
  budgetType: string;
  skill: string;
  serviceType: string;
  matchMySkills: boolean;
}

const EMPTY_FILTERS: ITHilfeFilters = {
  category: '',
  canton: '',
  urgency: '',
  budgetType: '',
  skill: '',
  serviceType: '',
  matchMySkills: false,
};

export function useITHilfeRequests() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<ITHilfeFilters>(EMPTY_FILTERS);

  // Filters, search, sort and pagination are encoded in the SWR key — any
  // change refetches automatically.
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.canton) params.set('canton', filters.canton);
  if (filters.urgency) params.set('urgency', filters.urgency);
  if (filters.budgetType) params.set('budgetType', filters.budgetType);
  if (filters.skill) params.set('skill', filters.skill);
  if (filters.serviceType) params.set('serviceType', filters.serviceType);
  if (filters.matchMySkills) params.set('matchMySkills', 'true');
  if (search) params.set('search', search);
  if (sort) params.set('sort', sort);
  params.set('limit', String(PAGINATION.PUBLIC));
  params.set('offset', String(offset));

  const {
    data,
    error: loadError,
    isLoading: loading,
    mutate,
  } = useSwrFetch<{
    requests: ITHilfeRequest[];
    total: number;
  }>(`/api/it-hilfe/requests?${params}`);

  const requests = data?.requests ?? [];
  const total = data?.total ?? 0;
  const error =
    loadError instanceof Error ? loadError.message || 'Fehler beim Laden der Anfragen' : null;

  const retry = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setOffset(0);
  };

  const setFilter = (key: keyof ITHilfeFilters, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setOffset(0);
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setSearch('');
    setSearchInput('');
    setSort('newest');
    setOffset(0);
  };

  const totalPages = Math.ceil(total / PAGINATION.PUBLIC);
  const currentPage = Math.floor(offset / PAGINATION.PUBLIC) + 1;
  const goToPage = (page: number) => setOffset((page - 1) * PAGINATION.PUBLIC);

  const hasActiveFilters = !!(
    filters.category ||
    filters.canton ||
    filters.urgency ||
    filters.budgetType ||
    filters.skill ||
    filters.serviceType ||
    filters.matchMySkills ||
    search
  );

  return {
    requests,
    loading,
    total,
    error,
    searchInput,
    setSearchInput,
    sort,
    setSort: (s: string) => {
      setSort(s);
      setOffset(0);
    },
    filters,
    setFilter,
    handleSearch,
    clearFilters,
    hasActiveFilters,
    totalPages,
    currentPage,
    goToPage,
    retry,
    limit: PAGINATION.PUBLIC,
  };
}
