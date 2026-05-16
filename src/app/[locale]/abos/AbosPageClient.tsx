'use client'

import { useTranslations } from 'next-intl'
import { Plus, Tag } from 'lucide-react'
import { CATEGORY_EMOJIS } from './types'
import { PoolCard } from './PoolCard'
import { CreatePoolModal } from './CreatePoolModal'
import { useAbosPage } from './useAbosPage'

export default function AbosPageClient() {
  const t = useTranslations('abos')
  const {
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
  } = useAbosPage()

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-medium text-primary-600 uppercase tracking-wide">{t('tagline')}</span>
              </div>
              <h1 className="text-3xl font-bold text-neutral-900">{t('title')}</h1>
              <p className="mt-2 text-neutral-500 max-w-lg">{t('subtitle')}</p>
            </div>
            {session?.user && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
                {t('createPool')}
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
                !activeCategory ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              {t('filterAll')}
            </button>
            {categories.map(cat => {
              const emoji = CATEGORY_EMOJIS[cat] ?? CATEGORY_EMOJIS.other
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === cat ? 'bg-primary-600 text-white' : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200'
                  }`}
                >
                  {/* @ts-expect-error — dynamic category key */}
                  {emoji} {t(`categories.${cat}`)}
                </button>
              )
            })}
          </div>
        )}

        {/* Pool grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-neutral-100 p-6 h-48 animate-pulse">
                <div className="h-4 bg-neutral-100 rounded w-2/3 mb-3" />
                <div className="h-3 bg-neutral-100 rounded w-full mb-2" />
                <div className="h-3 bg-neutral-100 rounded w-4/5" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-600 mb-1">
              {activeCategory ? t('emptyCategory') : t('emptyAll')}
            </h3>
            <p className="text-sm text-neutral-400">
              {session?.user ? t('emptyLoggedIn') : t('emptyGuest')}
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
