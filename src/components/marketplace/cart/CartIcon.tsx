'use client'

import { ShoppingCart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useCart } from './CartProvider'

/** Cart trigger with item-count badge — opens the slide-in drawer. */
export function CartIcon({ className }: { className?: string }) {
  const t = useTranslations('marketplace.cart')
  const { count, hydrated, openDrawer } = useCart()
  const shown = hydrated ? count : 0

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={openDrawer}
      aria-label={t('cartAriaLabel', { count: shown })}
      className={`relative text-text-secondary hover:text-text-primary ${className ?? ''}`}
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      {shown > 0 && (
        <span className="absolute right-0 top-0 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-action px-1 text-[10px] font-semibold leading-none text-action-text">
          {shown}
        </span>
      )}
    </Button>
  )
}
