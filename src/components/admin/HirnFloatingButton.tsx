'use client'

import { useState } from 'react'
import { Brain } from 'lucide-react'
import { HirnSlideOver } from './HirnSlideOver'

interface HirnFloatingButtonProps {
  /** Whether user has access to Hirn */
  hasAccess: boolean
}

/**
 * Floating button for quick access to Hirn AI
 * Positioned in bottom-right corner of admin layout
 */
export function HirnFloatingButton({ hasAccess }: HirnFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!hasAccess) {
    return null
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center group"
        title="Hirn AI öffnen"
      >
        <Brain className="w-6 h-6 text-white" />

        {/* Tooltip */}
        <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Hirn AI
        </span>
      </button>

      {/* Slide Over Panel */}
      <HirnSlideOver isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
