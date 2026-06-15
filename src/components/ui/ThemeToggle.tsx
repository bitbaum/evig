'use client'

import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  // next-themes' resolvedTheme is undefined during SSR + first client render,
  // then fills in once the client reads localStorage. Returning null on the
  // server would shift sibling layout vs the client (re-mount, console
  // hydration warning). Instead we always render the same <button> shell so
  // SSR and first client render match; we just hide the icon until the
  // theme is known and lock the click handler. This keeps the surrounding
  // DOM stable and removes the documented hydration mismatch warning.
  const { resolvedTheme, setTheme } = useTheme()
  const t = useTranslations('accessibility.theme')
  const ready = Boolean(resolvedTheme)
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={() => ready && setTheme(isDark ? 'light' : 'dark')}
      aria-label={ready ? (isDark ? t('toLight') : t('toDark')) : t('toggle')}
      suppressHydrationWarning
      className={cn(
        'p-2 rounded-lg transition-colors',
        'text-text-tertiary',
        'hover:text-text-secondary',
        'hover:bg-surface-raised',
        className,
      )}
    >
      {/* Reserve icon space identically on SSR + client to avoid layout shift.
          We render an icon span at fixed size; its child swaps once theme is known. */}
      <span className="block w-4 h-4" aria-hidden={!ready}>
        {ready && (isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />)}
      </span>
    </button>
  )
}
