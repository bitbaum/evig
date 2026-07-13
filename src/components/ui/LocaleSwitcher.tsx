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
  /** Render every locale as a row of tappable pills (one tap, large touch
   * targets, no nested dropdown) instead of the chip+dropdown. For mobile. */
  inline?: boolean
}

export function LocaleSwitcher({ className, openUpward = false, inline = false }: Props) {
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
    // Persist the choice explicitly, BEFORE navigating. Bypass-intl routes
    // (/admin, /dashboard, /auth) read locale from the NEXT_LOCALE cookie, and
    // switching TO the default locale navigates to an unprefixed URL where the
    // middleware may not rewrite the cookie — leaving a stale value that keeps
    // those routes in the old language. Setting it here makes the switcher the
    // single source of truth for the cookie.
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`
    // Preserve query string + hash so switching language on a filtered/paginated
    // listing (e.g. /marketplace?category=10&page=3) or an auth page with a
    // ?callbackUrl doesn't throw the user back to the unfiltered page.
    const search = typeof window !== 'undefined' ? window.location.search : ''
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const href = `${pathname}${search}${hash}`
    startTransition(() => {
      router.replace(href, { locale: next })
      setOpen(false)
    })
  }

  // Mobile: a wrapping row of language pills. One tap switches, targets meet the
  // 44px minimum, and there's no nested dropdown to fight the menu overlay.
  if (inline) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {locales.map((loc) => {
          const active = loc === locale
          return (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              disabled={isPending}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'min-h-touch flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                'focus:outline-hidden focus-visible:ring-2 focus-visible:ring-action',
                active
                  ? 'bg-action text-white'
                  : 'bg-surface-raised text-text-secondary hover:bg-surface-base',
                isPending && 'opacity-50 cursor-wait',
              )}
            >
              <span className="uppercase font-mono text-xs opacity-70">{loc}</span>
              {localeLabels[loc]}
            </button>
          )
        })}
      </div>
    )
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
