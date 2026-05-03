'use client'

import { ArrowRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NavigationSuggestion } from '@/lib/suggestion-utils'

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: NavigationSuggestion[]
  confidence?: number
}

interface ChatMessageProps {
  message: ChatMessage
  onSuggestionClick: (suggestion: NavigationSuggestion) => void
}

export function ChatMessage({ message, onSuggestionClick }: ChatMessageProps) {
  return (
    <div className={cn(
      "flex",
      message.type === 'user' ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[85%] p-3 rounded-2xl shadow-sm",
        message.type === 'user'
          ? "bg-gradient-to-r from-primary-600 to-info-600 text-white rounded-br-md"
          : "bg-white text-neutral-800 rounded-bl-md border border-neutral-100"
      )}>
        <p className="text-sm leading-relaxed">{message.content}</p>
        
        {/* Navigation Suggestions */}
        {message.type === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {message.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => onSuggestionClick(suggestion)}
                className="flex items-center justify-between w-full text-left p-2.5 text-xs bg-gradient-to-r from-neutral-50 to-info-50/30 hover:from-primary-50 hover:to-info-50 rounded-lg border border-neutral-200/50 hover:border-primary-300/50 text-neutral-700 hover:text-neutral-900 transition-all duration-200 group"
              >
                <div className="flex-1">
                  <div className="font-medium flex items-center">
                    {suggestion.label}
                  </div>
                  {suggestion.description && (
                    <div className="text-neutral-500 mt-0.5 text-xs">{suggestion.description}</div>
                  )}
                </div>
                <div className="flex items-center ml-2">
                  {suggestion.external ? (
                    <ExternalLink className="w-3 h-3 text-neutral-500 group-hover:text-primary-600 transition-colors" />
                  ) : (
                    <ArrowRight className="w-3 h-3 text-neutral-500 group-hover:text-primary-600 transition-colors" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}