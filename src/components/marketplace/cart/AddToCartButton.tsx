'use client'

import { ShoppingCart, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { useCart, type CartItem } from './CartProvider'

/**
 * Add-to-cart CTA for a RevampIT listing. Once in the cart it flips to a link
 * to the cart. Render only for is_revampit listings.
 */
export function AddToCartButton({ item, className }: { item: CartItem; className?: string }) {
  const t = useTranslations('marketplace.cart')
  const { has, add, openDrawer } = useCart()

  if (has(item.id)) {
    return (
      <Button as={Link} href="/marketplace/cart" variant="outline" size="lg" className={`w-full ${className ?? ''}`}>
        <Check className="h-5 w-5" aria-hidden="true" />
        {t('inCart')}
      </Button>
    )
  }

  return (
    <Button
      onClick={() => {
        add(item)
        openDrawer()
      }}
      variant="primary"
      size="lg"
      className={`w-full ${className ?? ''}`}
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      {t('addToCart')}
    </Button>
  )
}
