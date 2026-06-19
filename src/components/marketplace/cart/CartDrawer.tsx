'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X, ShoppingCart, Package, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import { formatCHF } from '@/config/marketplace'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { useCart } from './CartProvider'

/**
 * Slide-in cart drawer from the right. Opened by CartIcon, lets the buyer
 * review/remove items and proceed to the cart page without leaving the
 * marketplace. RevampIT-only stock (see CartProvider).
 */
export function CartDrawer() {
  const t = useTranslations('marketplace.cart')
  const { items, total, count, drawerOpen, closeDrawer, remove } = useCart()

  // Escape-to-close, initial focus, focus restore and the Tab trap all live in
  // the shared hook; attach its ref to the panel below.
  const panelRef = useFocusTrap<HTMLDivElement>(drawerOpen, closeDrawer)

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [drawerOpen])

  if (!drawerOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true" aria-label={t('title')}>
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/50" onClick={closeDrawer} aria-hidden="true" />

      {/* Panel — tabIndex=-1 so the trap can focus it when no child is focusable. */}
      <div ref={panelRef} tabIndex={-1} className="relative flex h-full w-full max-w-sm flex-col border-l border-strong bg-surface-base focus:outline-none">
        <header className="flex items-center justify-between border-b border-subtle px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary">
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {t('title')}
            {count > 0 && <span className="text-text-tertiary">({count})</span>}
          </h2>
          <Button variant="ghost" size="icon" onClick={closeDrawer} aria-label={t('closeAriaLabel')}>
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <ShoppingCart className="h-12 w-12 text-text-muted" aria-hidden="true" />
            <p className="text-text-secondary">{t('empty')}</p>
            <Button as={Link} href="/marketplace" variant="outline" onClick={closeDrawer}>
              {t('emptyCta')}
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-subtle overflow-y-auto px-5">
              {items.map(item => (
                <li key={item.id} className="flex gap-3 py-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-raised">
                    {item.thumbnail ? (
                      <Image src={item.thumbnail} alt={item.title} width={56} height={56} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-6 w-6 text-text-muted" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link href={`/marketplace/${item.id}`} onClick={closeDrawer} className="line-clamp-2 text-sm font-medium text-text-primary hover:text-action">
                      {item.title}
                    </Link>
                    <p className="mt-1 font-mono text-sm tabular-nums text-text-secondary">{formatCHF(Number(item.priceChf))}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(item.id)}
                    aria-label={t('remove')}
                    className="shrink-0 text-text-tertiary hover:text-error-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>

            <footer className="border-t border-subtle px-5 py-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm text-text-secondary">{t('total')}</span>
                <span className="font-mono text-lg font-bold tabular-nums text-text-primary">{formatCHF(total)}</span>
              </div>
              <p className="mb-3 text-xs text-text-tertiary">{t('pickupNote')}</p>
              <div className="flex flex-col gap-2">
                <Button as={Link} href="/marketplace/cart" variant="primary" className="w-full" onClick={closeDrawer}>
                  {t('checkout')}
                </Button>
                <Button variant="ghost" className="w-full" onClick={closeDrawer}>
                  {t('continueShopping')}
                </Button>
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}
