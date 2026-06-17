'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface FilterPillProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
  ariaLabel?: string
}

/** Monochrome filter pill — x.ai / fleetcrown discipline. Green only on primary CTAs. */
export function FilterPill({
  active,
  onClick,
  children,
  className,
  ariaLabel,
}: FilterPillProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        'h-auto shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium',
        active
          ? 'border-strong bg-text-primary text-canvas hover:bg-text-primary'
          : 'border-subtle bg-surface-base text-text-secondary hover:border-default hover:text-text-primary',
        className,
      )}
    >
      {children}
    </Button>
  )
}
