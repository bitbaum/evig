'use client'

import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { MessageSidebar } from './MessageSidebar'
import { apiFetch } from '@/lib/api/client'

interface Conversation {
  id: string
  unread_count: number
}

export function MessageButton() {
  const t = useTranslations('components.messageButton')
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Poll for unread messages every 30 seconds
    const fetchUnreadCount = async () => {
      try {
        const { data } = await apiFetch<{ conversations: Conversation[] }>(
          '/api/messages/conversations?limit=1'
        )
        if (data?.conversations) {
          const totalUnread = data.conversations.reduce(
            (sum: number, conv: Conversation) => sum + (conv.unread_count || 0),
            0
          )
          setUnreadCount(totalUnread)
        }
      } catch {
        // Silently ignore polling errors
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-lg hover:scale-105 z-40"
        title={t('title')}
      >
        <MessageSquare className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-error-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      <MessageSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}



