'use client'

import { Bot, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
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
    <div className="flex items-center justify-between p-4 border-b border-neutral-100 bg-gradient-to-r from-primary-50 to-primary-100 rounded-t-2xl">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary-500 rounded-full border-2 border-white">
            <div className="w-1 h-1 bg-white rounded-full mx-auto mt-0.5"></div>
          </div>
        </div>
        <div>
          <span className="font-semibold text-neutral-800">
            {currentLanguage === 'de' ? 'Revamp IT Assistent' : 'Revamp IT Assistant'}
          </span>
          <p className="text-xs text-neutral-600">{getMessage('status', currentLanguage)}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleMinimize}
          className="p-2 sm:p-1.5 hover:bg-neutral-100 active:bg-neutral-200 rounded-full text-neutral-500 hover:text-neutral-700 transition-colors touch-manipulation"
          aria-label={isMinimized ? getMessage('buttons', currentLanguage).maximize : getMessage('buttons', currentLanguage).minimize}
        >
          <ChevronDown className={cn("w-5 h-5 sm:w-4 sm:h-4 transition-transform", isMinimized && "rotate-180")} />
        </button>
        <button
          onClick={onClose}
          className="p-2 sm:p-1.5 hover:bg-neutral-100 active:bg-neutral-200 rounded-full text-neutral-500 hover:text-neutral-700 transition-colors touch-manipulation"
          aria-label={getMessage('buttons', currentLanguage).close}
        >
          <X className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  )
}