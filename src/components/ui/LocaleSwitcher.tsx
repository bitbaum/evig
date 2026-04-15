'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { locales, localeLabels, type Locale } from '@/i18n/routing'
import { useTransition } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

export function LocaleSwitcher({ className }: Props) {
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations('nav')
  const [isPending, startTransition] = useTransition()

  function switchLocale(next: Locale) {
    if (next === locale) return
    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      role="navigation"
      aria-label={t('languageSelection')}
    >
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          disabled={isPending}
          aria-label={localeLabels[loc]}
          aria-current={loc === locale ? 'true' : undefined}
          className={cn(
            'px-2 py-1 text-xs font-medium rounded transition-colors uppercase tracking-wide',
            loc === locale
              ? 'bg-green-600 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700',
            isPending && 'opacity-50 cursor-wait'
          )}
        >
          {loc}
        </button>
      ))}
    </div>
  )
}
