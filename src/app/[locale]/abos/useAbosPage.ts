'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api/client';
import { useSwrFetch } from '@/lib/api/swr';
import type { Pool } from './types';

export function useAbosPage() {
  const { data: session } = useSession();
  const [showCreate, setShowCreate] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const {
    data: poolsData,
    isLoading: loading,
    mutate: mutatePools,
  } = useSwrFetch<Pool[]>('/api/pools');
  const pools = poolsData ?? [];

  // Memberships are gated on an authenticated session via the null SWR key.
  const { data: myData, mutate: mutateMy } = useSwrFetch<{ poolId: string }[]>(
    session?.user ? '/api/pools/my' : null,
  );
  const myPoolIds = new Set((myData ?? []).map((m) => m.poolId));

  // Join/leave patch both caches locally — the server already recorded the change.
  const applyMembership = (id: string, delta: 1 | -1) => {
    mutateMy(
      (current) =>
        delta === 1
          ? [...(current ?? []), { poolId: id }]
          : (current ?? []).filter((m) => m.poolId !== id),
      { revalidate: false },
    );
    mutatePools(
      (current) =>
        current?.map((p) =>
          p.id === id
            ? { ...p, memberCount: p.memberCount + delta, spotsLeft: p.spotsLeft - delta }
            : p,
        ),
      { revalidate: false },
    );
  };

  const handleJoin = async (id: string) => {
    const result = await apiFetch<unknown>(`/api/pools/${id}/join`, { method: 'POST' });
    if (!result.success) throw new Error(result.error);
    applyMembership(id, 1);
  };

  const handleLeave = async (id: string) => {
    const result = await apiFetch<unknown>(`/api/pools/${id}/leave`, { method: 'POST' });
    if (!result.success) throw new Error(result.error);
    applyMembership(id, -1);
  };

  // A newly created pool goes straight into both caches (creator auto-joins).
  const addPool = (pool: Pool) => {
    mutatePools((current) => [pool, ...(current ?? [])], { revalidate: false });
    mutateMy((current) => [...(current ?? []), { poolId: pool.id }], { revalidate: false });
  };

  const filtered = activeCategory
    ? pools.filter((p) => p.serviceCategory === activeCategory)
    : pools;
  const categories = [...new Set(pools.map((p) => p.serviceCategory))];

  return {
    session,
    pools,
    myPoolIds,
    addPool,
    loading,
    showCreate,
    setShowCreate,
    activeCategory,
    setActiveCategory,
    handleJoin,
    handleLeave,
    filtered,
    categories,
  };
}
