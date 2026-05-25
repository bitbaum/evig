'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  // next-themes' resolvedTheme is undefined during SSR + first client
  // render, then fills in once the client reads its preference. Skipping
  // render while undefined prevents hydration mismatch (server can't know
  // light-vs-dark, so we can't render the icon yet). This replaces the
  // older [mounted, setMounted] + useEffect dance, which tripped the
  // react-hooks/set-state-in-effect rule.
  const { resolvedTheme, setTheme } = useTheme()
  if (!resolvedTheme) return null

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Auf Hell umschalten' : 'Auf Dunkel umschalten'}
      className={cn(
        'p-2 rounded-lg transition-colors',
        'text-neutral-500 dark:text-neutral-400',
        'hover:text-neutral-700 dark:hover:text-neutral-200',
        'hover:bg-neutral-100 dark:hover:bg-white/[0.06]',
        className
      )}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}
