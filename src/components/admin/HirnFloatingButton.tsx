'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const t = useTranslations('admin.hirn.floatingButton')
  const [isOpen, setIsOpen] = useState(false)

  if (!hasAccess) {
    return null
  }

  return (
    <>
      {/* Floating Button */}
      <Button
        variant="primary"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg hover:scale-105 group"
        title={t('open')}
      >
        <Brain className="w-6 h-6 text-white" />

        {/* Tooltip */}
        <span className="absolute right-full mr-3 px-3 py-1.5 bg-surface-overlay text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {t('label')}
        </span>
      </Button>

      {/* Slide Over Panel */}
      <HirnSlideOver isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
