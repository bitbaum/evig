'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useChatbot } from '@/features/chatbot/hooks/useChatbot'
import { FloatingButton } from '@/features/chatbot/components/FloatingButton'
import { ChatHeader } from '@/features/chatbot/components/ChatHeader'
import { ChatWindow } from '@/features/chatbot/components/ChatWindow'
import { uiEvents } from '@/lib/ui/uiEvents'

// Get current page context
function getCurrentPageContext(): string {
  if (typeof window === 'undefined') return '/'
  return window.location.pathname
}

export default function RevampCopilot() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

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

      {/* Backdrop for mobile - click to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[605] bg-black/20 sm:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Chat Interface */}
      {isOpen && (
        <div
          className={cn(
            "fixed z-[610]",
            "bg-surface-base rounded-2xl border border-default backdrop-blur-sm",
            "transition-all duration-300 ease-in-out",
            // Mobile: full width with margins, bottom-aligned
            "w-[calc(100%-2rem)] max-w-sm sm:w-96",
            "bottom-4 left-1/2 -translate-x-1/2 sm:bottom-6 sm:right-6 sm:left-auto sm:translate-x-0",
            isMinimized ? "h-16" : "h-[calc(100vh-8rem)] max-h-[28rem] sm:h-[28rem]"
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
