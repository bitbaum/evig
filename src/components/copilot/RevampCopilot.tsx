/**
 * Revamp Copilot Component - Refactored
 * @fileoverview Modular chatbot component with clean separation of concerns
 *
 * Improvements:
 * - Separated chat logic into custom hook (useCopilot)
 * - Extracted UI components (ChatInterface, MessageBubble, FloatingButton)
 * - Improved TypeScript types and interfaces
 * - Better state management and error handling
 * - Reduced complexity from 312 lines to focused responsibility
 */

'use client'

import React from 'react'
import { X, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useCopilot } from './useCopilot'
import { ChatInterface } from './ChatInterface'
import { FloatingButton } from './FloatingButton'

export function RevampCopilot() {
  const {
    isOpen,
    isMinimized,
    messages,
    inputValue,
    isLoading,
    setIsOpen,
    setIsMinimized,
    sendMessage,
    handleInputChange,
    handleSuggestionClick
  } = useCopilot()

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setIsMinimized(false)
    }
  }

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const handleClose = () => {
    setIsOpen(false)
    setIsMinimized(false)
  }

  return (
    <>
      {/* Chat Panel */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-gray-200 rounded-lg shadow-xl w-96 h-[500px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
            <h3 className="font-semibold">Revamp Copilot</h3>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleMinimize}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-700 p-1"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-blue-700 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Chat Interface */}
          <ChatInterface
            messages={messages}
            inputValue={inputValue}
            isLoading={isLoading}
            onInputChange={handleInputChange}
            onSendMessage={sendMessage}
            onSuggestionClick={handleSuggestionClick}
          />
        </div>
      )}

      {/* Floating Button */}
      <FloatingButton
        isOpen={isOpen}
        isMinimized={isMinimized}
        onClick={handleToggle}
        onMinimize={handleMinimize}
      />
    </>
  )
}