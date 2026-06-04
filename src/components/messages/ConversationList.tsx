'use client'

import { useState } from 'react'
import { MessageSquare, User } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { formatDateShort } from '@/lib/date-formats'

export interface Conversation {
  id: string
  type: string
  context_id: string | null
  other_user_name: string
  other_user_id: string
  last_message_preview: string | null
  last_message_at: string
  unread_count: number
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  const t = useTranslations('components.conversationList')
  // Stable snapshot of "now" — Date.now() must not be called directly in render (react-hooks/purity)
  const [now] = useState(Date.now)

  function timeAgo(dateStr: string): string {
    const diff = now - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return t('timeNow')
    if (mins < 60) return t('timeMin', { count: mins })
    const hours = Math.floor(mins / 60)
    if (hours < 24) return t('timeHour', { count: hours })
    const days = Math.floor(hours / 24)
    if (days < 7) return t('timeDay', { count: days })
    return formatDateShort(dateStr)
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessageSquare className="w-12 h-12 text-text-muted dark:text-text-secondary mb-3" aria-hidden="true" />
        <p className="text-text-tertiary font-medium">{t('emptyTitle')}</p>
        <p className="text-sm text-text-muted mt-1">
          {t('emptyDesc')}
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
      {conversations.map(conv => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={`w-full text-left px-4 py-3 hover:bg-surface-raised transition-colors focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-action ${
            selectedId === conv.id
              ? 'bg-action-muted border-l-2 border-action'
              : ''
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-surface-raised rounded-full flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-text-muted" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-sm truncate ${
                  conv.unread_count > 0
                    ? 'font-bold text-text-primary'
                    : 'font-medium text-text-secondary'
                }`}>
                  {conv.other_user_name || t('unknownUser')}
                </span>
                <span className="text-xs text-text-muted shrink-0 ml-2">
                  {timeAgo(conv.last_message_at)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className={`text-sm truncate ${
                  conv.unread_count > 0
                    ? 'text-text-primary'
                    : 'text-text-tertiary'
                }`}>
                  {conv.last_message_preview || t('noMessage')}
                </p>
                {conv.unread_count > 0 && (
                  <span className="ml-2 shrink-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-action rounded-full">
                    {conv.unread_count}
                  </span>
                )}
              </div>
              {conv.type === 'marketplace' && (
                <span className="text-xs text-action mt-0.5 inline-block">
                  Marketplace
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
