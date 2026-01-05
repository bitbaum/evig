'use client'

import { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { MessageSidebar } from './MessageSidebar'
import { logger } from '@/lib/logger'

interface Conversation {
  id: string
  unread_count: number
}

export function MessageButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Poll for unread messages every 30 seconds
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/messages/conversations?limit=1')
        const data = await response.json()
        if (data.success) {
          const totalUnread = data.conversations.reduce(
            (sum: number, conv: Conversation) => sum + (conv.unread_count || 0),
            0
          )
          setUnreadCount(totalUnread)
        }
      } catch (error) {
        logger.error('Error fetching unread count', { error })
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 z-40"
        title="Nachrichten"
      >
        <MessageSquare className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <MessageSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}



