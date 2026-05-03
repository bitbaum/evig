'use client'

import { useLocale } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { locales, localeLabels, type Locale } from '@/i18n/routing'
import { useTransition, useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

export function LocaleSwitcher({ className }: Props) {
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
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium uppercase tracking-wide',
          'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
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
            'absolute right-0 top-full mt-1 z-50',
            'min-w-[7rem] rounded-lg border border-neutral-200 bg-white shadow-lg py-1',
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
                'hover:bg-neutral-50 transition-colors',
                loc === locale
                  ? 'text-emerald-700 font-semibold bg-emerald-50'
                  : 'text-neutral-700'
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
