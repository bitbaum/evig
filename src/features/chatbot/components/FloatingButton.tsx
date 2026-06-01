'use client'

import { Bot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Language } from '@/lib/suggestion-utils'
import { uiEvents } from '@/lib/ui/uiEvents'

interface FloatingButtonProps {
  currentLanguage: Language
  isOpen: boolean
  onClick: () => void
}

export function FloatingButton({ currentLanguage, isOpen, onClick }: FloatingButtonProps) {
  if (isOpen) return null

  return (
    <button
      onClick={() => { uiEvents.emit('closeSuggestion'); onClick() }}
      className={cn(
        "fixed z-[600] pointer-events-auto",
        "bg-primary-700 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-500",
        "text-white rounded-full shadow-lg hover:shadow-xl",
        "transition-all duration-300 ease-in-out transform hover:scale-105",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        "hover:scale-110 active:scale-95 touch-manipulation",
        // Mobile: larger button, better positioning
        "bottom-4 right-4 sm:bottom-6 sm:right-6",
        "p-3 sm:p-4",
        isOpen && "ring-2 ring-primary-500 ring-offset-2"
      )}
      aria-label={currentLanguage === 'de' ? 'Revamp IT Assistent öffnen' : 'Open Revamp IT Assistant'}
    >
      <div className="relative">
        <Bot className="w-6 h-6 sm:w-6 sm:h-6" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse">
          <Sparkles className="w-2 h-2 text-white absolute top-0.5 left-0.5" />
        </div>
      </div>
    </button>
  )
}
