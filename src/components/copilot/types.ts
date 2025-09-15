/**
 * Types for the Copilot system components
 * @fileoverview Centralized type definitions for chatbot functionality
 */

import { Language } from '@/lib/chatbot-language'

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: NavigationSuggestion[]
  confidence?: number
}

export interface NavigationSuggestion {
  label: string
  href: string
  description: string
  external?: boolean
  icon?: string
}

export interface ChatInterfaceProps {
  messages: ChatMessage[]
  inputValue: string
  isLoading: boolean
  onInputChange: (value: string) => void
  onSendMessage: () => void
  onSuggestionClick: (suggestion: NavigationSuggestion) => void
}

export interface FloatingButtonProps {
  isOpen: boolean
  isMinimized: boolean
  onClick: () => void
  onMinimize: () => void
}

export interface MessageBubbleProps {
  message: ChatMessage
  onSuggestionClick: (suggestion: NavigationSuggestion) => void
}

export interface UseCopilotState {
  isOpen: boolean
  isMinimized: boolean
  messages: ChatMessage[]
  inputValue: string
  isLoading: boolean
  currentLanguage: Language
}

export interface UseCopilotActions {
  setIsOpen: (open: boolean) => void
  setIsMinimized: (minimized: boolean) => void
  sendMessage: () => Promise<void>
  handleInputChange: (value: string) => void
  handleSuggestionClick: (suggestion: NavigationSuggestion) => void
}