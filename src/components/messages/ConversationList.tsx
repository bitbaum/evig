'use client'

import { MessageSquare, User } from 'lucide-react'

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Jetzt'
  if (mins < 60) return `${mins} Min.`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} Std.`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} T.`
  return new Date(dateStr).toLocaleDateString('de-CH')
}

export default function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" aria-hidden="true" />
        <p className="text-gray-500 dark:text-gray-400 font-medium">Keine Nachrichten</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Kontaktiere Verkäufer über den Marketplace
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {conversations.map(conv => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 ${
            selectedId === conv.id
              ? 'bg-green-50 dark:bg-green-900/20 border-l-2 border-green-500'
              : ''
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-gray-400" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-sm truncate ${
                  conv.unread_count > 0
                    ? 'font-bold text-gray-900 dark:text-white'
                    : 'font-medium text-gray-700 dark:text-gray-300'
                }`}>
                  {conv.other_user_name || 'Unbekannt'}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2">
                  {timeAgo(conv.last_message_at)}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className={`text-sm truncate ${
                  conv.unread_count > 0
                    ? 'text-gray-800 dark:text-gray-200'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {conv.last_message_preview || 'Keine Nachricht'}
                </p>
                {conv.unread_count > 0 && (
                  <span className="ml-2 flex-shrink-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-500 rounded-full">
                    {conv.unread_count}
                  </span>
                )}
              </div>
              {conv.type === 'marketplace' && (
                <span className="text-xs text-green-600 dark:text-green-400 mt-0.5 inline-block">
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
