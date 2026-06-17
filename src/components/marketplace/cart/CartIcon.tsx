'use client'

import { ShoppingCart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useCart } from './CartProvider'

/** Cart link with item-count badge. Shows nothing-special when empty. */
export function CartIcon({ className }: { className?: string }) {
  const t = useTranslations('marketplace.cart')
  const { count, hydrated } = useCart()
  const shown = hydrated ? count : 0

  return (
    <Link
      href="/marketplace/cart"
      aria-label={t('cartAriaLabel', { count: shown })}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-raised hover:text-text-primary focus:outline-hidden focus:ring-2 focus:ring-action focus:ring-offset-2 ${className ?? ''}`}
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      {shown > 0 && (
        <span className="absolute right-0 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-action px-1 text-[10px] font-semibold leading-none text-action-text">
          {shown}
        </span>
      )}
    </Link>
  )
}
