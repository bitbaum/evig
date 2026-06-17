'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Trash2, ShoppingCart, Loader2, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Link, useRouter } from '@/i18n/navigation'
import Heading from '@/components/ui/Heading'
import { ListingImage } from '@/components/marketplace/ListingImage'
import { useCart } from '@/components/marketplace/cart/CartProvider'
import { apiFetch } from '@/lib/api/client'
import { formatCHF } from '@/config/marketplace'

export function CartPageClient() {
  const t = useTranslations('marketplace.cart')
  const { items, remove, total, clear, hydrated } = useCart()
  const { status } = useSession()
  const router = useRouter()
  const [checkingOut, setCheckingOut] = useState(false)

  if (!hydrated) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-action" aria-hidden="true" />
      </div>
    )
  }

  const handleCheckout = async () => {
    if (status !== 'authenticated') {
      router.push('/auth/login?callbackUrl=/marketplace/cart')
      return
    }
    setCheckingOut(true)
    const res = await apiFetch<{ orderId: string; paymentUrl: string }>('/api/marketplace/cart/checkout', {
      method: 'POST',
      body: { listing_ids: items.map((i) => i.id) },
    })
    if (res.success && res.data?.paymentUrl) {
      clear()
      window.location.href = res.data.paymentUrl
    } else {
      toast.error(res.error || 'Fehler bei der Bestellung')
      setCheckingOut(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Heading level={1} className="mb-6 text-2xl font-semibold text-text-primary sm:text-3xl">
        {t('title')}
      </Heading>

      {items.length === 0 ? (
        <div className="rounded-xl border border-subtle bg-surface-base py-16 text-center">
          <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-text-muted/60" aria-hidden="true" />
          <p className="mb-6 text-text-secondary">{t('empty')}</p>
          <Button as={Link} href="/marketplace" variant="primary">
            {t('emptyCta')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Items */}
          <ul className="divide-y divide-subtle rounded-xl border border-subtle bg-surface-base">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-4 p-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-subtle">
                  <ListingImage src={item.thumbnail} alt={item.title} fallbackIconSize="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/marketplace/${item.id}`}
                    className="line-clamp-2 font-medium text-text-primary hover:text-action"
                  >
                    {item.title}
                  </Link>
                </div>
                <span className="whitespace-nowrap font-semibold text-text-primary">{formatCHF(item.priceChf)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(item.id)}
                  aria-label={t('remove')}
                  className="text-text-muted hover:text-error-600"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>

          {/* Summary */}
          <div className="h-fit space-y-4 rounded-xl border border-subtle bg-surface-base p-5 lg:sticky lg:top-24">
            <div className="flex justify-between text-sm">
              <span className="text-text-tertiary">{t('subtotal')}</span>
              <span className="font-medium text-text-primary">{formatCHF(total)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-action">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t('pickupNote')}
            </div>
            <div className="flex justify-between border-t border-subtle pt-3 text-base font-semibold text-text-primary">
              <span>{t('total')}</span>
              <span>{formatCHF(total)}</span>
            </div>
            <Button variant="primary" size="lg" className="w-full" onClick={handleCheckout} disabled={checkingOut}>
              {checkingOut ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : t('checkout')}
            </Button>
            <Button as={Link} href="/marketplace" variant="ghost" size="sm" className="w-full">
              {t('continueShopping')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
