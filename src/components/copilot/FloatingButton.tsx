/**
 * Floating Button Component
 * @fileoverview Floating action button for opening/closing the copilot
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronDown, MessageCircle, X } from 'lucide-react'
import { FloatingButtonProps } from './types'

export function FloatingButton({ isOpen, isMinimized, onClick, onMinimize }: FloatingButtonProps) {
  if (isOpen && !isMinimized) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && isMinimized ? (
        <div className="flex items-center space-x-2">
          <Button
            onClick={onMinimize}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg"
            size="lg"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Chat wieder öffnen
          </Button>
        </div>
      ) : (
        <Button
          onClick={onClick}
          className={cn(
            "rounded-full shadow-lg transition-all duration-300 transform hover:scale-105",
            "bg-blue-600 hover:bg-blue-700 text-white",
            "w-14 h-14 p-0 flex items-center justify-center"
          )}
          aria-label="Revamp Copilot öffnen"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
    </div>
  )
}