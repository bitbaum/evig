'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = theme === 'dark'

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
