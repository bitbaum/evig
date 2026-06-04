'use client'

import { useTranslations } from 'next-intl'
import { Plus, Tag } from 'lucide-react'
import { CATEGORY_EMOJIS } from './types'
import { PoolCard } from './PoolCard'
import { CreatePoolModal } from './CreatePoolModal'
import { useAbosPage } from './useAbosPage'
import { PageShell } from '@/components/layout/PageShell'
import { Button } from '@/components/ui/button'

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
    <>
      {/* Hero */}
      <div className="bg-surface-base border-b border-subtle">
        <PageShell maxWidth="5xl" py="py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-5 h-5 text-action" />
                <span className="text-sm font-medium text-action uppercase tracking-wide">{t('tagline')}</span>
              </div>
              <h1 className="text-3xl font-bold text-text-primary">{t('title')}</h1>
              <p className="mt-2 text-text-tertiary max-w-lg">{t('subtitle')}</p>
            </div>
            {session?.user && (
              <Button onClick={() => setShowCreate(true)} variant="primary" size="sm" className="shrink-0">
                <Plus className="w-4 h-4" />
                {t('createPool')}
              </Button>
            )}
          </div>
        </PageShell>
      </div>

      <PageShell maxWidth="5xl" py="py-8">
        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                !activeCategory ? 'bg-primary-600 text-white' : 'bg-white text-text-secondary hover:bg-neutral-100 border'
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
                    activeCategory === cat ? 'bg-primary-600 text-white' : 'bg-white text-text-secondary hover:bg-neutral-100 border'
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
              <div key={i} className="bg-surface-base rounded-2xl border border-subtle p-6 h-48 animate-pulse">
                <div className="h-4 bg-surface-raised rounded-sm w-2/3 mb-3" />
                <div className="h-3 bg-surface-raised rounded-sm w-full mb-2" />
                <div className="h-3 bg-surface-raised rounded-sm w-4/5" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-text-secondary mb-1">
              {activeCategory ? t('emptyCategory') : t('emptyAll')}
            </h3>
            <p className="text-sm text-text-muted">
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

      </PageShell>

      {showCreate && (
        <CreatePoolModal
          onClose={() => setShowCreate(false)}
          onCreate={pool => {
            setPools(prev => [pool, ...prev])
            setMyPoolIds(prev => new Set([...prev, pool.id]))
          }}
        />
      )}
    </>
  )
}
