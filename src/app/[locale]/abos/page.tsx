'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Plus, Users, ChevronRight, RefreshCw, Tag, X } from 'lucide-react'
import { logger } from '@/lib/logger'

// ============================================================================
// Types
// ============================================================================

interface Pool {
  id: string
  serviceName: string
  serviceCategory: string
  maxMembers: number
  monthlyCostChf: string
  costPerMemberChf: string
  description: string | null
  rules: string | null
  ownerName: string | null
  memberCount: number
  spotsLeft: number
  createdAt: string
}

// ============================================================================
// Category config
// ============================================================================

const CATEGORIES: Record<string, { label: string; emoji: string }> = {
  streaming:  { label: 'Streaming',  emoji: '📺' },
  software:   { label: 'Software',   emoji: '💻' },
  cloud:      { label: 'Cloud',      emoji: '☁️' },
  gaming:     { label: 'Gaming',     emoji: '🎮' },
  music:      { label: 'Musik',      emoji: '🎵' },
  news:       { label: 'News',       emoji: '📰' },
  other:      { label: 'Sonstiges',  emoji: '📦' },
}

// ============================================================================
// Pool card
// ============================================================================

function PoolCard({
  pool,
  userId,
  onJoin,
  onLeave,
  myPoolIds,
}: {
  pool: Pool
  userId?: string
  onJoin: (id: string) => Promise<void>
  onLeave: (id: string) => Promise<void>
  myPoolIds: Set<string>
}) {
  const [loading, setLoading] = useState(false)
  const isMember = myPoolIds.has(pool.id)
  const isFull = pool.spotsLeft <= 0
  const cat = CATEGORIES[pool.serviceCategory] ?? CATEGORIES.other

  const handleAction = async () => {
    setLoading(true)
    try {
      if (isMember) {
        await onLeave(pool.id)
      } else {
        await onJoin(pool.id)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{cat.emoji}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{pool.serviceName}</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{cat.label}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-emerald-600">
            CHF {Number(pool.costPerMemberChf).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">pro Monat/Person</div>
        </div>
      </div>

      {pool.description && (
        <p className="text-sm text-gray-600 line-clamp-2">{pool.description}</p>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          <span>{pool.memberCount}/{pool.maxMembers} Mitglieder</span>
        </div>
        <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          isFull
            ? 'bg-red-50 text-red-600'
            : pool.spotsLeft <= 2
            ? 'bg-amber-50 text-amber-700'
            : 'bg-emerald-50 text-emerald-700'
        }`}>
          {isFull ? 'Voll' : `${pool.spotsLeft} Platz${pool.spotsLeft === 1 ? '' : 'e'} frei`}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-400">von {pool.ownerName ?? 'Anonym'}</span>
        {userId ? (
          <button
            onClick={handleAction}
            disabled={loading || (isFull && !isMember)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isMember
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isMember ? (
              <>
                <X className="w-3.5 h-3.5" />
                Verlassen
              </>
            ) : (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                Beitreten
              </>
            )}
          </button>
        ) : (
          <span className="text-xs text-gray-400">Anmelden zum Beitreten</span>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Create Pool modal
// ============================================================================

function CreatePoolModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (pool: Pool) => void
}) {
  const [form, setForm] = useState({
    serviceName: '',
    serviceCategory: 'streaming',
    maxMembers: 4,
    monthlyCostChf: '',
    description: '',
    rules: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          maxMembers: Number(form.maxMembers),
          monthlyCostChf: Number(form.monthlyCostChf),
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error ?? 'Fehler')
      onCreate(json.data)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold">Neuen Pool erstellen</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dienst-Name *</label>
            <input
              required
              value={form.serviceName}
              onChange={e => setForm(f => ({ ...f, serviceName: e.target.value }))}
              placeholder="z.B. Netflix, Spotify, Adobe CC"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie *</label>
              <select
                value={form.serviceCategory}
                onChange={e => setForm(f => ({ ...f, serviceCategory: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.entries(CATEGORIES).map(([val, { label, emoji }]) => (
                  <option key={val} value={val}>{emoji} {label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max. Mitglieder *</label>
              <input
                required
                type="number"
                min={2}
                max={20}
                value={form.maxMembers}
                onChange={e => setForm(f => ({ ...f, maxMembers: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gesamtkosten/Monat (CHF) *</label>
            <input
              required
              type="number"
              min={1}
              step={0.05}
              value={form.monthlyCostChf}
              onChange={e => setForm(f => ({ ...f, monthlyCostChf: e.target.value }))}
              placeholder="z.B. 17.90"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {form.monthlyCostChf && form.maxMembers > 0 && (
              <p className="text-xs text-emerald-600 mt-1">
                = CHF {(Number(form.monthlyCostChf) / form.maxMembers).toFixed(2)} pro Person/Monat
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Beschreibung</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Kurze Beschreibung des Angebots"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Regeln (optional)</label>
            <textarea
              value={form.rules}
              onChange={e => setForm(f => ({ ...f, rules: e.target.value }))}
              rows={2}
              placeholder="z.B. Zahlung bis 1. des Monats per TWINT"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Pool erstellen
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================================================
// Page
// ============================================================================

export default function AbosPage() {
  const { data: session } = useSession()
  const [pools, setPools] = useState<Pool[]>([])
  const [myPoolIds, setMyPoolIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const loadPools = useCallback(async () => {
    try {
      const res = await fetch('/api/pools')
      const json = await res.json()
      if (json.success) setPools(json.data)
    } catch (err) {
      logger.error('Failed to load pools', { error: err })
    } finally {
      setLoading(false)
    }
  }, [])

  const loadMyMemberships = useCallback(async () => {
    if (!session?.user) return
    try {
      const res = await fetch('/api/pools/my')
      const json = await res.json()
      if (json.success) {
        setMyPoolIds(new Set((json.data as { poolId: string }[]).map(m => m.poolId)))
      }
    } catch {
      // not critical
    }
  }, [session?.user])

  useEffect(() => {
    loadPools()
    loadMyMemberships()
  }, [loadPools, loadMyMemberships])

  const handleJoin = async (id: string) => {
    const res = await fetch(`/api/pools/${id}/join`, { method: 'POST' })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    setMyPoolIds(prev => new Set([...prev, id]))
    setPools(prev => prev.map(p =>
      p.id === id ? { ...p, memberCount: p.memberCount + 1, spotsLeft: p.spotsLeft - 1 } : p
    ))
  }

  const handleLeave = async (id: string) => {
    const res = await fetch(`/api/pools/${id}/leave`, { method: 'POST' })
    const json = await res.json()
    if (!json.success) throw new Error(json.error)
    setMyPoolIds(prev => { const s = new Set(prev); s.delete(id); return s })
    setPools(prev => prev.map(p =>
      p.id === id ? { ...p, memberCount: p.memberCount - 1, spotsLeft: p.spotsLeft + 1 } : p
    ))
  }

  const filtered = activeCategory
    ? pools.filter(p => p.serviceCategory === activeCategory)
    : pools

  const categories = [...new Set(pools.map(p => p.serviceCategory))]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600 uppercase tracking-wide">Abo-Tauschbörse</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Abo-Pools teilen</h1>
              <p className="mt-2 text-gray-500 max-w-lg">
                Teile digitale Abos mit der Revamp-IT-Community und spare Geld.
                Jeder zahlt nur seinen Anteil.
              </p>
            </div>
            {session?.user && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                Pool erstellen
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !activeCategory ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Alle
            </button>
            {categories.map(cat => {
              const info = CATEGORIES[cat] ?? CATEGORIES.other
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {info.emoji} {info.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Pool grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 h-48 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-1">
              {activeCategory ? 'Keine Pools in dieser Kategorie' : 'Noch keine Pools'}
            </h3>
            <p className="text-sm text-gray-400">
              {session?.user
                ? 'Sei der Erste und erstelle einen Pool!'
                : 'Melde dich an, um einen Pool zu erstellen.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(pool => (
              <PoolCard
                key={pool.id}
                pool={pool}
                userId={session?.user?.id}
                onJoin={handleJoin}
                onLeave={handleLeave}
                myPoolIds={myPoolIds}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreatePoolModal
          onClose={() => setShowCreate(false)}
          onCreate={pool => {
            setPools(prev => [pool, ...prev])
            setMyPoolIds(prev => new Set([...prev, pool.id]))
          }}
        />
      )}
    </div>
  )
}
