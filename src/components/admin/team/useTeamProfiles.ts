'use client';

/**
 * Hook for fetching and managing team profiles
 */

import { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useSwrFetch } from '@/lib/api/swr';
import type { TeamProfileWithUser } from '@/lib/schemas/team';
import type { TeamFilterState } from './types';

interface UseTeamProfilesOptions {
  initialFilters?: Partial<TeamFilterState>;
}

interface UseTeamProfilesReturn {
  profiles: TeamProfileWithUser[];
  loading: boolean;
  error: string | null;
  filters: TeamFilterState;
  setFilters: (filters: Partial<TeamFilterState>) => void;
  refetch: () => Promise<void>;
}

const defaultFilters: TeamFilterState = {
  department: '',
  employmentType: '',
  isActive: 'all',
  search: '',
};

export function useTeamProfiles(options: UseTeamProfilesOptions = {}): UseTeamProfilesReturn {
  const [filters, setFiltersState] = useState<TeamFilterState>({
    ...defaultFilters,
    ...options.initialFilters,
  });

  // Filters are encoded in the SWR key, so changing them refetches automatically.
  const params = new URLSearchParams();
  if (filters.department) params.set('department', filters.department);
  if (filters.employmentType) params.set('employment_type', filters.employmentType);
  if (filters.isActive !== 'all') params.set('is_active', filters.isActive);
  if (filters.search) params.set('search', filters.search);

  const { data, error, isLoading, mutate } = useSwrFetch<TeamProfileWithUser[]>(
    `/api/admin/team/profiles?${params.toString()}`,
  );

  const setFilters = useCallback((newFilters: Partial<TeamFilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    profiles: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    filters,
    setFilters,
    refetch,
  };
}

/**
 * Hook for fetching a single team profile
 */
export function useTeamProfile(profileId: string | null) {
  const { data, error, isLoading, mutate } = useSwrFetch<TeamProfileWithUser>(
    profileId ? `/api/admin/team/profiles/${profileId}` : null,
  );

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    profile: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

/**
 * Hook for team profile mutations (create, update, delete)
 */
export function useTeamProfileMutations() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProfile = useCallback(async (data: Record<string, unknown>) => {
    try {
      setSaving(true);
      setError(null);

      const result = await apiFetch<TeamProfileWithUser>('/api/admin/team/profiles', {
        method: 'POST',
        body: data,
      });

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Erstellen');
      }

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const updateProfile = useCallback(async (id: string, data: Record<string, unknown>) => {
    try {
      setSaving(true);
      setError(null);

      const result = await apiFetch<TeamProfileWithUser>(`/api/admin/team/profiles/${id}`, {
        method: 'PUT',
        body: data,
      });

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Aktualisieren');
      }

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteProfile = useCallback(async (id: string) => {
    try {
      setSaving(true);
      setError(null);

      const result = await apiFetch<unknown>(`/api/admin/team/profiles/${id}`, {
        method: 'DELETE',
      });

      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Löschen');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unbekannter Fehler';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    saving,
    error,
    createProfile,
    updateProfile,
    deleteProfile,
    clearError: () => setError(null),
  };
}
