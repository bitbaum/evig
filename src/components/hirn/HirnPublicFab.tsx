'use client'

/**
 * HirnPublicFab — floating entry point for the Hirn assistant on public pages.
 *
 * Resolves the page context from the pathname (config SSOT, no LLM call) and
 * shows a small dismissible proactive chip with the first suggestion — once
 * per pathname per browser session. Clicking the FAB opens HirnChatPanel.
 */

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Brain, X } from 'lucide-react'
import { usePathname } from '@/i18n/navigation'
import { Button } from '@/components/ui/button'
import { resolveHirnContext } from '@/config/hirn/page-contexts'
import { HirnChatPanel } from './HirnChatPanel'

const CHIP_STORAGE_PREFIX = 'hirn-chip:'

export function HirnPublicFab() {
  const t = useTranslations('hirn')
  const pathname = usePathname() ?? '/'
  const { status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [showChip, setShowChip] = useState(false)

  const context = resolveHirnContext(pathname, 'public')

  // Proactive chip: first suggestion for this page, once per pathname per session.
  useEffect(() => {
    setShowChip(false)
    if (isOpen || context.suggestions.length === 0) return
    const key = `${CHIP_STORAGE_PREFIX}${pathname}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
      setShowChip(true)
    } catch {
      // sessionStorage unavailable (private mode) — skip the chip.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const openPanel = () => {
    setShowChip(false)
    setIsOpen(true)
  }

  return (
    <>
      {/* Proactive suggestion chip */}
      {showChip && !isOpen && (
        // Sits above BOTH stacked FABs on phones (brain + feedback pencil).
        <div className="fixed bottom-[calc(8rem+var(--bottom-nav-clearance,0px))] right-4 sm:bottom-24 sm:right-6 z-40 max-w-[calc(100vw-2rem)] sm:max-w-xs">
          <div className="flex items-start gap-2 bg-surface-base border border-strong rounded-xl px-3 py-2 text-sm text-text-primary">
            <Button
              type="button"
              variant="ghost"
              onClick={openPanel}
              className="h-auto whitespace-normal bg-transparent p-0 text-left text-sm font-normal text-text-primary hover:bg-transparent hover:text-action"
            >
              {context.suggestions[0]}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowChip(false)}
              aria-label={t('proactiveDismiss')}
              className="h-5 w-5 shrink-0 bg-transparent p-0 text-text-tertiary hover:bg-transparent hover:text-text-primary"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <Button
        variant="primary"
        size="icon"
        onClick={openPanel}
        aria-label={t('open')}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="fixed bottom-[calc(1rem+var(--bottom-nav-clearance,0px))] right-4 sm:bottom-6 sm:right-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-xs hover:scale-105"
      >
        <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-white" aria-hidden="true" />
      </Button>

      <HirnChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        context={context}
        pathname={pathname}
        isAuthenticated={status === 'authenticated'}
      />
    </>
  )
}
