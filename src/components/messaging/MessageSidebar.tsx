'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  MessageSquare,
  Send,
  Search,
  MoreVertical,
  User,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { apiFetch } from '@/lib/api/client'
import { logger } from '@/lib/logger'
import { formatDateShort, formatTime } from '@/lib/date-formats'
import Heading from '@/components/ui/Heading'
import { Button } from '@/components/ui/button'

interface Conversation {
  id: string
  title: string
  type: string
  other_participant: {
    id: string
    name: string
    email: string
    role: string
  }
  last_message_preview: string
  last_message_at: string
  unread_count: number
}

interface Message {
  id: string
  content: string
  sender_id: string
  recipient_id: string
  is_read: boolean
  created_at: string
  sender_name: string
}

interface MessageSidebarProps {
  isOpen: boolean
  onClose: () => void
  initialConversationId?: string | null
}

export function MessageSidebar({ isOpen, onClose, initialConversationId }: MessageSidebarProps) {
  const t = useTranslations('components.messageSidebar')
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen && session?.user) {
      fetchConversations()
    }
  }, [isOpen, session])

  useEffect(() => {
    if (isOpen && initialConversationId) {
      setSelectedConversation(initialConversationId)
    }
  }, [isOpen, initialConversationId])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      const result = await apiFetch<{ conversations: Conversation[] }>('/api/messages/conversations')
      if (result.success && result.data?.conversations) {
        setConversations(result.data.conversations)
      }
    } catch (error) {
      logger.error('Error fetching conversations', { error })
    }
  }

  const fetchMessages = async (conversationId: string) => {
    try {
      setIsLoading(true)
      const result = await apiFetch<{ messages: Message[] }>(`/api/messages/${conversationId}`)
      if (result.success && result.data?.messages) {
        setMessages(result.data.messages)
      }
    } catch (error) {
      logger.error('Error fetching messages', { error, conversationId })
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!selectedConversation || !newMessage.trim()) return

    try {
      const result = await apiFetch<void>(`/api/messages/${selectedConversation}`, {
        method: 'POST',
        body: { content: newMessage.trim() }
      })

      if (result.success) {
        setNewMessage('')
        // Refresh messages
        fetchMessages(selectedConversation)
        // Refresh conversations to update last message
        fetchConversations()
      }
    } catch (error) {
      logger.error('Error sending message', { error, conversationId: selectedConversation })
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.other_participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="ml-auto w-full max-w-md bg-white h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <Heading level={2} className="text-lg font-semibold">{t('title')}</Heading>
          <Button onClick={onClose} variant="ghost" size="icon" className="p-1">
            ×
          </Button>
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Conversations List */}
          {!selectedConversation && (
            <div className="flex-1 flex flex-col">
              {/* Search */}
              <div className="p-4 border-b border-neutral-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                    <p>{t('noConversations')}</p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className="w-full p-4 border-b border-neutral-100 hover:bg-neutral-50 text-left flex items-start gap-3"
                    >
                      <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium truncate">
                            {conversation.other_participant.name}
                          </p>
                          <span className="text-xs text-neutral-500 flex-shrink-0">
                            {formatDateShort(conversation.last_message_at)}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 truncate mb-1">
                          {conversation.last_message_preview || t('newConversation')}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-500 capitalize">
                            {conversation.type}
                          </span>
                          {conversation.unread_count > 0 && (
                            <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                              {conversation.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Messages View */}
          {selectedConversation && (
            <div className="flex-1 flex flex-col">
              {/* Message Header */}
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <Button onClick={() => setSelectedConversation(null)} variant="ghost" size="icon" className="p-1">
                  ←
                </Button>
                <div className="flex-1 text-center">
                  <Heading level={3} className="text-sm font-medium">
                    {conversations.find(c => c.id === selectedConversation)?.other_participant.name}
                  </Heading>
                </div>
                <Button variant="ghost" size="icon" className="p-1">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                  <div className="text-center text-neutral-500">{t('loading')}</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-neutral-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
                    <p>{t('noMessages')}</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwn = message.sender_id === session?.user?.id
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            isOwn
                              ? 'bg-primary-600 text-white'
                              : 'bg-neutral-100 text-neutral-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className={`flex items-center gap-1 mt-1 text-xs ${
                            isOwn ? 'text-primary-100' : 'text-neutral-500'
                          }`}>
                            <span>{formatTime(message.created_at)}</span>
                            {isOwn && (
                              message.is_read ? (
                                <CheckCheck className="w-3 h-3" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-neutral-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={t('messagePlaceholder')}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    variant="primary"
                    className="p-2"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



