'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, ArrowLeft } from 'lucide-react'
import { apiFetch } from '@/lib/api/client'
import { formatTime as fmtTime, formatDateShort } from '@/lib/date-formats'
import { logger } from '@/lib/logger'
import Heading from '@/components/ui/Heading'

export interface Message {
  id: string
  sender_id: string
  sender_name: string
  content: string
  is_read: boolean
  created_at: string
}

interface MessageThreadProps {
  conversationId: string
  currentUserId: string
  recipientId: string
  recipientName: string
  contextType?: string
  contextId?: string | null
  onBack?: () => void
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  const time = fmtTime(date)

  if (isToday) return time

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return `Gestern, ${time}`

  return `${formatDateShort(date)}, ${time}`
}

export default function MessageThread({
  conversationId,
  currentUserId,
  recipientId,
  recipientName,
  contextType,
  contextId,
  onBack,
}: MessageThreadProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      try {
        const result = await apiFetch<{ messages: Message[] }>(`/api/messages/${conversationId}`)
        if (!cancelled && result.success) {
          setMessages(result.data!.messages)
        }
      } catch (err) {
        logger.error('Failed to load messages', { error: err })
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!reply.trim() || sending) return
    setSending(true)
    try {
      const result = await apiFetch<{ message_id: string; created_at?: string }>('/api/messages', {
        method: 'POST',
        body: {
          recipient_id: recipientId,
          content: reply.trim(),
          context_type: contextType || 'general',
          context_id: contextId || null,
        },
      })
      if (result.success && result.data) {
        setMessages(prev => [...prev, {
          id: result.data!.message_id,
          sender_id: currentUserId,
          sender_name: 'Du',
          content: reply.trim(),
          is_read: false,
          created_at: result.data!.created_at || new Date().toISOString(),
        }])
        setReply('')
        textareaRef.current?.focus()
      }
    } catch (err) {
      logger.error('Failed to send message', { error: err })
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
            aria-label="Zurück"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <Heading level={3} className="font-semibold text-gray-900 dark:text-white truncate">
            {recipientName}
          </Heading>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-green-600 animate-spin" aria-hidden="true" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 text-sm py-8">
            Noch keine Nachrichten. Schreib die erste!
          </p>
        ) : (
          messages.map(msg => {
            const isMine = msg.sender_id === currentUserId
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isMine
                      ? 'bg-green-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-md'
                  }`}
                >
                  {!isMine && (
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                      {msg.sender_name}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-line break-words">{msg.content}</p>
                  <p className={`text-xs mt-1 ${
                    isMine ? 'text-green-200' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply input */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nachricht schreiben..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent max-h-32"
            style={{ minHeight: '42px' }}
          />
          <button
            onClick={handleSend}
            disabled={!reply.trim() || sending}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label="Senden"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
