'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import type { Pool } from './types'

export function useAbosPage() {
  const { data: session } = useSession()
  const [pools, setPools] = useState<Pool[]>([])
  const [myPoolIds, setMyPoolIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const loadPools = useCallback(async () => {
    try {
      const result = await apiFetch<Pool[]>('/api/pools')
      if (result.success && result.data) {
        setPools(result.data)
      } else {
        logger.error('Failed to load pools', { error: result.error })
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMyMemberships = useCallback(async () => {
    if (!session?.user) return
    const result = await apiFetch<{ poolId: string }[]>('/api/pools/my')
    if (result.success && result.data) {
      setMyPoolIds(new Set(result.data.map(m => m.poolId)))
    }
  }, [session?.user])

  useEffect(() => {
    loadPools()
    loadMyMemberships()
  }, [loadPools, loadMyMemberships])

  const handleJoin = async (id: string) => {
    const result = await apiFetch<unknown>(`/api/pools/${id}/join`, { method: 'POST' })
    if (!result.success) throw new Error(result.error)
    setMyPoolIds(prev => new Set([...prev, id]))
    setPools(prev => prev.map(p =>
      p.id === id ? { ...p, memberCount: p.memberCount + 1, spotsLeft: p.spotsLeft - 1 } : p
    ))
  }

  const handleLeave = async (id: string) => {
    const result = await apiFetch<unknown>(`/api/pools/${id}/leave`, { method: 'POST' })
    if (!result.success) throw new Error(result.error)
    setMyPoolIds(prev => { const s = new Set(prev); s.delete(id); return s })
    setPools(prev => prev.map(p =>
      p.id === id ? { ...p, memberCount: p.memberCount - 1, spotsLeft: p.spotsLeft + 1 } : p
    ))
  }

  const filtered = activeCategory ? pools.filter(p => p.serviceCategory === activeCategory) : pools
  const categories = [...new Set(pools.map(p => p.serviceCategory))]

  return {
    session,
    pools,
    setPools,
    myPoolIds,
    setMyPoolIds,
    loading,
    showCreate,
    setShowCreate,
    activeCategory,
    setActiveCategory,
    handleJoin,
    handleLeave,
    filtered,
    categories,
  }
}
