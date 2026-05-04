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
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <h3 className="font-semibold text-neutral-900">{pool.serviceName}</h3>
            <span className="text-xs text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">{catLabel}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-emerald-600">
            CHF {Number(pool.costPerMemberChf).toFixed(2)}
          </div>
          <div className="text-xs text-neutral-500">{t('perMonthPerson')}</div>
        </div>
      </div>

      {pool.description && (
        <p className="text-sm text-neutral-600 line-clamp-2">{pool.description}</p>
      )}

      <div className="flex items-center gap-4 text-sm text-neutral-500">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          <span>{pool.memberCount}/{pool.maxMembers} {t('members')}</span>
        </div>
        <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          isFull
            ? 'bg-error-50 text-error-600'
            : pool.spotsLeft <= 2
            ? 'bg-warning-50 text-warning-700'
            : 'bg-emerald-50 text-emerald-700'
        }`}>
          {isFull ? t('full') : spotsText}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-neutral-50">
        <span className="text-xs text-neutral-400">{t('by')} {pool.ownerName ?? t('anonymous')}</span>
        {userId ? (
          <button
            onClick={handleAction}
            disabled={loading || (isFull && !isMember)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isMember
                ? 'bg-error-50 text-error-600 hover:bg-error-100'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
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
          <span className="text-xs text-neutral-400">{t('loginToJoin')}</span>
        )}
      </div>
    </div>
  )
}
