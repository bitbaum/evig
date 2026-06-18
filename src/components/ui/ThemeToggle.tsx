'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useTranslations } from 'next-intl'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

const OPTIONS = [
  { value: 'light', icon: Sun, key: 'light' as const },
  { value: 'system', icon: Monitor, key: 'system' as const },
  { value: 'dark', icon: Moon, key: 'dark' as const },
] as const

/**
 * Theme switcher — a 3-way segmented control (Hell / System / Dunkel).
 * "System" follows the OS preference (enableSystem in ThemeProvider). All three
 * buttons render on the server too, so the DOM is stable across hydration; only
 * the active highlight is withheld until mounted (the selected theme is unknown
 * on the server), which avoids the next-themes hydration-mismatch warning.
 */
export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const t = useTranslations('accessibility.theme')
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only mount flag
  useEffect(() => setMounted(true), [])
  const current = mounted ? (theme ?? 'system') : undefined

  return (
    <div
      role="radiogroup"
      aria-label={t('label')}
      suppressHydrationWarning
      className={cn(
        'inline-flex items-center gap-0.5 rounded-lg border border-subtle bg-surface-raised p-0.5',
        className,
      )}
    >
      {OPTIONS.map(({ value, icon: Icon, key }) => {
        const active = current === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(key)}
            title={t(key)}
            onClick={() => setTheme(value)}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md transition-colors',
              active
                ? 'bg-surface-base text-text-primary shadow-xs'
                : 'text-text-tertiary hover:text-text-secondary',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
