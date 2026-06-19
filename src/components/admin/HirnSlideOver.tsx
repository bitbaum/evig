'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Brain, Maximize2 } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { HirnChat } from './HirnChat'
import { ORG } from '@/config/org'
import { ROUTES } from '@/config/routes'

interface HirnSlideOverProps {
  isOpen: boolean
  onClose: () => void
}

function generateSessionId(): string {
  return crypto.randomUUID()
}

/**
 * Slide-over panel for Hirn AI chat
 * Opens from the right side like ChatGPT/Claude interfaces
 */
export function HirnSlideOver({ isOpen, onClose }: HirnSlideOverProps) {
  const [sessionId, setSessionId] = useState<string>(() => generateSessionId())
  const t = useTranslations('admin.hirn')
  const tCommon = useTranslations('common')

  // Escape-to-close, initial focus, focus restore and the Tab trap all live in
  // the shared hook; attach its ref to the panel below.
  const panelRef = useFocusTrap<HTMLDivElement>(isOpen, onClose)

  // Lock body scroll while the panel is open.
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [isOpen])

  const handleNewSession = useCallback(() => {
    setSessionId(generateSessionId())
  }, [])

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — tabIndex=-1 so the trap can focus it before any child. */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Hirn AI"
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface-base shadow-xs flex flex-col animate-slide-in-right focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border bg-action">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-base/20 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <Heading level={2} className="font-semibold text-white">Hirn AI</Heading>
              <p className="text-xs text-white/70">{ORG.name} {t('assistantSubtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Full screen link */}
            <Link
              href={ROUTES.admin.hirn}
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-surface-base/10 rounded-lg transition-colors"
              title={t('openFullscreen')}
            >
              <Maximize2 className="w-4 h-4" />
            </Link>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label={tCommon('close')}
              className="text-white/80 hover:text-white hover:bg-surface-base/10 rounded-lg"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          {sessionId && (
            <HirnChat
              sessionId={sessionId}
              onSessionChange={handleNewSession}
              compact
            />
          )}
        </div>
      </div>

      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.2s ease-out;
        }
      `}</style>
    </>
  )
}
