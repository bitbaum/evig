/**
 * Message Bubble Component
 * @fileoverview Individual message bubble with suggestions
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { Bot, ExternalLink } from 'lucide-react'
import { MessageBubbleProps } from './types'

export function MessageBubble({ message, onSuggestionClick }: MessageBubbleProps) {
  const isUser = message.type === 'user'

  return (
    <div className={cn("flex items-start space-x-3 mb-4", isUser && "flex-row-reverse space-x-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
        isUser ? "bg-blue-600" : "bg-gray-600"
      )}>
        {isUser ? (
          <span className="text-white text-sm font-medium">U</span>
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn(
        "flex-1 max-w-xs lg:max-w-md",
        isUser && "flex justify-end"
      )}>
        <div className={cn(
          "rounded-lg px-4 py-2 text-sm",
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        )}>
          <p className="whitespace-pre-wrap">{message.content}</p>

          {/* Suggestions */}
          {message.suggestions && message.suggestions.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="w-full text-left p-2 bg-white/10 hover:bg-white/20 rounded border border-white/20 hover:border-white/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{suggestion.label}</div>
                      <div className="text-xs opacity-75">{suggestion.description}</div>
                    </div>
                    {suggestion.external && (
                      <ExternalLink className="w-3 h-3 opacity-75" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={cn(
          "text-xs text-gray-500 mt-1",
          isUser ? "text-right" : "text-left"
        )}>
          {message.timestamp.toLocaleTimeString('de-DE', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  )
}