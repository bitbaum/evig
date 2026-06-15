'use client'

import { Bot, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { getMessage } from '@/lib/chatbot-language'
import type { Language } from '@/lib/suggestion-utils'

interface ChatHeaderProps {
  currentLanguage: Language
  isMinimized: boolean
  onToggleMinimize: () => void
  onClose: () => void
}

export function ChatHeader({
  currentLanguage,
  isMinimized,
  onToggleMinimize,
  onClose
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-subtle bg-surface-raised rounded-t-2xl">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-8 h-8 bg-action rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-action-text" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-action rounded-full border-2 border-surface-base">
            <div className="w-1 h-1 bg-action-text rounded-full mx-auto mt-0.5"></div>
          </div>
        </div>
        <div>
          <span className="font-semibold text-text-primary">
            {currentLanguage === 'de' ? 'Revamp IT Assistent' : 'Revamp IT Assistant'}
          </span>
          <p className="text-xs text-text-secondary">{getMessage('status', currentLanguage)}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleMinimize}
          className="p-2 sm:p-1.5 hover:bg-surface-overlay active:bg-surface-raised rounded-full text-text-tertiary hover:text-text-primary transition-colors touch-manipulation"
          aria-label={isMinimized ? getMessage('buttons', currentLanguage).maximize : getMessage('buttons', currentLanguage).minimize}
        >
          <ChevronDown className={cn("w-5 h-5 sm:w-4 sm:h-4 transition-transform", isMinimized && "rotate-180")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="p-2 sm:p-1.5 hover:bg-surface-overlay active:bg-surface-raised rounded-full text-text-tertiary hover:text-text-primary transition-colors touch-manipulation"
          aria-label={getMessage('buttons', currentLanguage).close}
        >
          <X className="w-5 h-5 sm:w-4 sm:h-4" />
        </Button>
      </div>
    </div>
  )
}
