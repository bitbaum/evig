'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { locales, localeLabels, type Locale } from '@/i18n/routing'
import { useTransition, useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  /** When the switcher sits at the bottom of a container (e.g. mobile menu
   * footer), force the dropdown to open upward so options aren't clipped
   * by the viewport edge. */
  openUpward?: boolean
}

export function LocaleSwitcher({ className, openUpward = false }: Props) {
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function switchLocale(next: Locale) {
    if (next === locale) { setOpen(false); return }
    startTransition(() => {
      router.replace(pathname, { locale: next })
      setOpen(false)
    })
  }

  return (
    <div
      ref={ref}
      data-locale-up={openUpward ? 'true' : undefined}
      className={cn('group/locale-switcher relative', className)}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium uppercase tracking-wide',
          'text-text-tertiary hover:text-text-primary hover:bg-surface-raised transition-colors',
          'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-action',
          isPending && 'opacity-50 cursor-wait'
        )}
      >
        {locale}
        <ChevronDown className={cn('h-3 w-3 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          role="listbox"
          className={cn(
            // top-full opens downward by default; bottom-[100%] forces upward
            // when the parent has the `data-locale-up` flag (mobile menu
            // footer, where opening downward goes off-screen).
            'absolute right-0 top-full mt-1 z-50',
            'group-data-[locale-up=true]/locale-switcher:top-auto group-data-[locale-up=true]/locale-switcher:bottom-full group-data-[locale-up=true]/locale-switcher:mt-0 group-data-[locale-up=true]/locale-switcher:mb-1',
            'min-w-28 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-lg border border-subtle bg-surface-base shadow-xs py-1',
          )}
        >
          {locales.map((loc) => (
            <button
              key={loc}
              role="option"
              aria-selected={loc === locale}
              onClick={() => switchLocale(loc)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left',
                'hover:bg-surface-raised transition-colors',
                loc === locale
                  ? 'text-action font-semibold bg-action-muted'
                  : 'text-text-secondary'
              )}
            >
              <span className="uppercase text-xs font-mono w-5">{loc}</span>
              <span>{localeLabels[loc]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
