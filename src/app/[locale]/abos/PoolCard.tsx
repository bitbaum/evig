'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Users, ChevronRight, RefreshCw, X } from 'lucide-react'
import type { Pool } from './types'
import { CATEGORY_EMOJIS } from './types'

interface Props {
  pool: Pool
  userId?: string
  onJoin: (id: string) => Promise<void>
  onLeave: (id: string) => Promise<void>
  myPoolIds: Set<string>
}

export function PoolCard({ pool, userId, onJoin, onLeave, myPoolIds }: Props) {
  const t = useTranslations('abos')
  const [loading, setLoading] = useState(false)
  const isMember = myPoolIds.has(pool.id)
  const isFull = pool.spotsLeft <= 0
  const emoji = CATEGORY_EMOJIS[pool.serviceCategory] ?? CATEGORY_EMOJIS.other
  // @ts-expect-error — t() accepts string keys; categories keys are dynamic
  const catLabel = t(`categories.${pool.serviceCategory}`) as string

  const handleAction = async () => {
    setLoading(true)
    try {
      if (isMember) await onLeave(pool.id)
      else await onJoin(pool.id)
    } finally {
      setLoading(false)
    }
  }

  const spotsText = pool.spotsLeft === 1
    ? t('spotsLeft', { count: pool.spotsLeft })
    : t('spotsLeftPlural', { count: pool.spotsLeft })

  return (
    <div className="card-shell rounded-2xl p-6 flex flex-col gap-4 hover:border-strong transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <h3 className="font-semibold text-text-primary">{pool.serviceName}</h3>
            <span className="text-xs text-text-tertiary bg-surface-raised px-2 py-0.5 rounded-full">{catLabel}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-action">
            CHF {Number(pool.costPerMemberChf).toFixed(2)}
          </div>
          <div className="text-xs text-text-tertiary">{t('perMonthPerson')}</div>
        </div>
      </div>

      {pool.description && (
        <p className="text-sm text-text-secondary line-clamp-2">{pool.description}</p>
      )}

      <div className="flex items-center gap-4 text-sm text-text-tertiary">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          <span>{pool.memberCount}/{pool.maxMembers} {t('members')}</span>
        </div>
        <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          isFull
            ? 'bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400'
            : pool.spotsLeft <= 2
            ? 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400'
            : 'bg-action-muted-muted text-action'
        }`}>
          {isFull ? t('full') : spotsText}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-subtle">
        <span className="text-xs text-text-muted">{t('by')} {pool.ownerName ?? t('anonymous')}</span>
        {userId ? (
          <button
            onClick={handleAction}
            disabled={loading || (isFull && !isMember)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isMember
                ? 'bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 hover:bg-error-100 dark:hover:bg-error-900/30'
                : 'bg-action hover:bg-action-hover text-action-text'
            }`}
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isMember ? (
              <><X className="w-3.5 h-3.5" />{t('leave')}</>
            ) : (
              <><ChevronRight className="w-3.5 h-3.5" />{t('join')}</>
            )}
          </button>
        ) : (
          <span className="text-xs text-text-muted">{t('loginToJoin')}</span>
        )}
      </div>
    </div>
  )
}
