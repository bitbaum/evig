'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { modernChatbotEngine } from '../lib/ModernChatbotEngine'
import { detectLanguage, getMessage } from '@/lib/chatbot-language'
import type { NavigationSuggestion, Language } from '@/lib/suggestion-utils'

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: NavigationSuggestion[]
  confidence?: number
}

interface UseChatbotOptions {
  initialLanguage?: Language
  getCurrentPage?: () => string
}

export function useChatbot(options: UseChatbotOptions = {}) {
  const { initialLanguage = 'de', getCurrentPage } = options
  
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState<Language>(initialLanguage)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const currentPage = getCurrentPage?.() || '/'
      try {
        const welcomeResponse = modernChatbotEngine.getWelcomeMessage(currentPage, currentLanguage)

        setMessages([{
          id: '1',
          type: 'assistant',
          content: welcomeResponse.content,
          timestamp: new Date(),
          suggestions: welcomeResponse.suggestions,
          confidence: welcomeResponse.confidence
        }])
      } catch (error) {
        console.error('Error getting welcome message:', error)
        setMessages([{
          id: '1',
          type: 'assistant',
          content: 'Willkommen! Wie kann ich Ihnen helfen?',
          timestamp: new Date(),
          suggestions: [],
          confidence: 0.5
        }])
      }
    }
  }, [messages.length, currentLanguage, getCurrentPage])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const focusInput = useCallback(() => {
    if (inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }, [])

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return

    const trimmedInput = inputValue.trim()
    
    // Detect language from user input
    const detectedLanguage = detectLanguage(trimmedInput, currentLanguage)
    if (detectedLanguage !== currentLanguage) {
      setCurrentLanguage(detectedLanguage)
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: trimmedInput,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const currentPage = getCurrentPage?.() || '/'
      const conversationContext = {
        currentPage,
        userHistory: messages.slice(-5).map(m => m.content),
        language: detectedLanguage,
        timeOfDay: new Date().getHours()
      }

      // Handle special commands first
      if (trimmedInput.startsWith('/')) {
        const response = modernChatbotEngine.handleCommand(trimmedInput, conversationContext)
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: response.content,
          timestamp: new Date(),
          suggestions: response.suggestions,
          confidence: response.confidence
        }
        setMessages(prev => [...prev, assistantMessage])
        return
      }

      // Use the modern intelligent chatbot engine
      const response = await modernChatbotEngine.processMessage(trimmedInput, conversationContext)

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
      console.error('Chatbot error:', error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: getMessage('error', currentLanguage),
        timestamp: new Date(),
        suggestions: [
          {
            label: currentLanguage === 'de' ? '📞 Support kontaktieren' : '📞 Contact Support',
            href: '/contact',
            description: currentLanguage === 'de' ? 'Direkte Hilfe von unserem Team' : 'Direct help from our team'
          }
        ],
        confidence: 0.5
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      // Focus input after processing
      setTimeout(focusInput, 100)
    }
  }, [inputValue, isLoading, currentLanguage, messages, getCurrentPage, focusInput])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleSuggestionClick = useCallback((suggestion: NavigationSuggestion) => {
    if (suggestion.external) {
      window.open(suggestion.href, '_blank')
    } else {
      window.location.href = suggestion.href
    }
  }, [])

  return {
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
  }
}