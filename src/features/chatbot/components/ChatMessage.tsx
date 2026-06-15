'use client'

import { ArrowRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
        "max-w-[85%] p-3 rounded-2xl",
        message.type === 'user'
          ? "bg-action text-action-text rounded-br-md"
          : "bg-surface-base text-text-primary rounded-bl-md border border-subtle"
      )}>
        <p className="text-sm leading-relaxed">{message.content}</p>
        
        {/* Navigation Suggestions */}
        {message.type === 'assistant' && message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {message.suggestions.map((suggestion, idx) => (
              <Button
                key={idx}
                variant="ghost"
                onClick={() => onSuggestionClick(suggestion)}
                className="flex items-center justify-between w-full text-left p-2.5 text-xs bg-surface-raised hover:bg-action-muted rounded-lg border border-subtle hover:border-strong text-text-secondary hover:text-text-primary transition-all duration-200 group"
              >
                <div className="flex-1">
                  <div className="font-medium flex items-center">
                    {suggestion.label}
                  </div>
                  {suggestion.description && (
                    <div className="text-text-muted mt-0.5 text-xs">{suggestion.description}</div>
                  )}
                </div>
                <div className="flex items-center ml-2">
                  {suggestion.external ? (
                    <ExternalLink className="w-3 h-3 text-text-tertiary group-hover:text-action transition-colors" />
                  ) : (
                    <ArrowRight className="w-3 h-3 text-text-tertiary group-hover:text-action transition-colors" />
                  )}
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
