// Force runtime rendering — lucide imports land in the shared SSR bundle where
// Next.js 16 Turbopack leaves React null during parallel static-generation workers.
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { Home } from 'lucide-react'
import { buttonClass } from '@/components/ui/button-class'

/**
 * Global 404 fallback — fires for routes outside any `[locale]` segment
 * (e.g. admin pages that aren't locale-aware) where next-intl provider
 * isn't available, so we can't call useTranslations.
 *
 * Kept locale-neutral on purpose: a giant numeric "404" + one home link.
 * No prose, no decorative text — works for every visitor regardless of
 * their browser language.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-raised px-4">
      <div className="max-w-md w-full text-center">
        <p className="font-mono text-8xl font-bold text-text-tertiary mb-6 tabular-nums" aria-hidden="true">
          404
        </p>
        <Link href="/" className={buttonClass({ variant: 'primary', className: 'gap-2 inline-flex' })}>
          <Home className="w-4 h-4" />
          revamp-it.ch
        </Link>
      </div>
    </div>
  )
}
