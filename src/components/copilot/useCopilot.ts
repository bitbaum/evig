/**
 * Copilot Hook
 * @fileoverview Custom hook for managing copilot state and logic
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { chatbotEngine, type ConversationContext } from '@/lib/chatbot-engine'
import { detectLanguage, getWelcomeMessage, type Language } from '@/lib/chatbot-language'
import { ChatMessage, NavigationSuggestion, UseCopilotState, UseCopilotActions } from './types'

// Get current page context
function getCurrentPageContext() {
  if (typeof window === 'undefined') return { page: '/', title: 'Revamp IT', section: 'Main' }

  const path = window.location.pathname
  return { page: path, title: 'Revamp IT', section: 'Navigation' }
}

export function useCopilot(): UseCopilotState & UseCopilotActions {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<Language>('de')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize with contextual welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const context = getCurrentPageContext()
      setMessages([{
        id: '1',
        type: 'assistant',
        content: getWelcomeMessage(context.page, currentLanguage),
        timestamp: new Date(),
        suggestions: [
          {
            label: 'Services entdecken',
            href: '/services',
            description: 'Unsere Dienstleistungen ansehen'
          },
          {
            label: 'Projekte ansehen',
            href: '/projects',
            description: 'Referenzen und Fallstudien'
          },
          {
            label: 'Kontakt aufnehmen',
            href: '/contact',
            description: 'Sprechen Sie mit uns'
          }
        ]
      }])
    }
  }, [messages.length, currentLanguage])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, isMinimized])

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
    const detectedLang = detectLanguage(value)
    if (detectedLang !== currentLanguage) {
      setCurrentLanguage(detectedLang)
    }
  }, [currentLanguage])

  const sendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const userHistory = messages.filter(m => m.type === 'user').map(m => m.content);
      const conversationContext: ConversationContext = {
          currentPage: window.location.pathname,
          userHistory: userHistory,
          language: currentLanguage
      };
      const response = await chatbotEngine.processMessage(inputValue.trim(), conversationContext)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
        confidence: response.confidence
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error processing message:', error)

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Nachricht. Bitte versuchen Sie es erneut.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, currentLanguage, messages])

  const handleSuggestionClick = useCallback((suggestion: NavigationSuggestion) => {
    if (suggestion.external) {
      window.open(suggestion.href, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = suggestion.href
    }
  }, [])

  return {
    // State
    isOpen,
    isMinimized,
    messages,
    inputValue,
    isLoading,
    currentLanguage,

    // Actions
    setIsOpen,
    setIsMinimized,
    sendMessage,
    handleInputChange,
    handleSuggestionClick
  }
}