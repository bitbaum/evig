'use client'

import { ChatMessage } from './ChatMessage'
import { LoadingIndicator } from './LoadingIndicator'
import { ChatInput } from './ChatInput'
import { cn } from '@/lib/utils'
import { getMessage } from '@/lib/chatbot-language'
import type { ChatMessage as ChatMessageType } from '../hooks/useChatbot'
import type { NavigationSuggestion, Language } from '@/lib/suggestion-utils'

interface ChatWindowProps {
  messages: ChatMessageType[]
  inputValue: string
  setInputValue: (value: string) => void
  isLoading: boolean
  currentLanguage: Language
  onSend: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onSuggestionClick: (suggestion: NavigationSuggestion) => void
  inputRef: React.RefObject<HTMLInputElement>
  messagesEndRef: React.RefObject<HTMLDivElement>
  isMinimized: boolean
}

export function ChatWindow({
  messages,
  inputValue,
  setInputValue,
  isLoading,
  currentLanguage,
  onSend,
  onKeyDown,
  onSuggestionClick,
  inputRef,
  messagesEndRef,
  isMinimized
}: ChatWindowProps) {
  if (isMinimized) return null

  return (
    <>
      {/* Chat Messages */}
      <div className="h-72 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50/30 to-transparent">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onSuggestionClick={onSuggestionClick}
          />
        ))}
        
        {isLoading && (
          <LoadingIndicator message={getMessage('typing', currentLanguage)} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
        <ChatInput
          ref={inputRef}
          value={inputValue}
          onChange={setInputValue}
          onSubmit={onSend}
          onKeyDown={onKeyDown}
          disabled={isLoading}
          placeholder={currentLanguage === 'de' ? 'Hier tippen...' : 'Type here...'}
        />
      </div>
    </>
  )
}