'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useChatbot } from '../hooks/useChatbot'
import { FloatingButton } from './FloatingButton'
import { ChatHeader } from './ChatHeader'
import { ChatWindow } from './ChatWindow'
import { uiEvents } from '@/lib/ui/uiEvents'

// Get current page context
function getCurrentPageContext(): string {
  if (typeof window === 'undefined') return '/'
  return window.location.pathname
}

export default function RevampCopilot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Component mounts successfully

  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    currentLanguage,
    inputRef,
    messagesEndRef,
    handleSend,
    handleKeyDown,
    handleSuggestionClick,
    focusInput
  } = useChatbot({
    getCurrentPage: getCurrentPageContext
  })

  // Focus input when opening or when chat becomes unminimized
  useEffect(() => {
    if (isOpen && !isMinimized) {
      focusInput()
    }
  }, [isOpen, isMinimized, focusInput])

  // Coordinate with Suggestion panel: close it when chat opens, close chat when suggestions open
  useEffect(() => {
    const offOpenSuggestion = uiEvents.on('openSuggestion', () => setIsOpen(false))
    return () => {
      offOpenSuggestion()
    }
  }, [])

  return (
    <>
      <FloatingButton
        currentLanguage={currentLanguage}
        isOpen={isOpen}
        onClick={() => { setIsOpen(true); uiEvents.emit('openChat') }}
      />

      {/* Chat Interface */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-[610]",
            "bg-white rounded-2xl shadow-2xl border border-gray-200/80 backdrop-blur-sm",
            "w-96 transition-all duration-300 ease-in-out",
            isMinimized ? "h-16" : "h-[28rem]"
          )}
        >
          <ChatHeader
            currentLanguage={currentLanguage}
            isMinimized={isMinimized}
            onToggleMinimize={() => setIsMinimized(!isMinimized)}
            onClose={() => setIsOpen(false)}
          />

          <ChatWindow
            messages={messages}
            inputValue={inputValue}
            setInputValue={setInputValue}
            isLoading={isLoading}
            currentLanguage={currentLanguage}
            onSend={handleSend}
            onKeyDown={handleKeyDown}
            onSuggestionClick={handleSuggestionClick}
            inputRef={inputRef}
            messagesEndRef={messagesEndRef}
            isMinimized={isMinimized}
          />
        </div>
      )}
    </>
  )
}
