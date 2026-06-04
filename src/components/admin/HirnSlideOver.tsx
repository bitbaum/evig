'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Brain, Maximize2 } from 'lucide-react'
import Heading from '@/components/admin/AdminHeading'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when panel is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

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
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface-base shadow-2xl flex flex-col animate-slide-in-right">
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
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-surface-base/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
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
