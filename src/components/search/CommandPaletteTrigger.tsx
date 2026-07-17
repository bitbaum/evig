'use client'

import { useSession } from 'next-auth/react'
import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { openCommandPalette } from './UserCommandPalette'

/**
 * Opens the single mounted UserCommandPalette via a window event. Placed in both
 * the desktop and mobile header action areas — no dialog/⌘K duplication. Icon-only
 * on phones (<sm), full "Suche ⌘K" box on sm+/lg+. Logged-in users only.
 */
export function CommandPaletteTrigger({ className }: { className?: string }) {
  const t = useTranslations('search')
  const { status } = useSession()
  if (status !== 'authenticated') return null

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={openCommandPalette}
      aria-label={t('triggerAria')}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg p-0 text-text-tertiary hover:bg-surface-raised sm:w-auto sm:gap-2 sm:px-3',
        className,
      )}
    >
      <Search className="h-4 w-4" />
      <span className="hidden text-sm sm:inline">{t('trigger')}</span>
      <kbd className="hidden items-center rounded-sm bg-surface-raised px-1.5 py-0.5 font-mono text-xs leading-none lg:inline-flex">⌘K</kbd>
    </Button>
  )
}
