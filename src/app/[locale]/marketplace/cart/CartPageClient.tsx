'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Trash2, ShoppingCart, Loader2, MapPin, ArrowLeft, ShieldCheck, LockKeyhole, Store, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link, useRouter } from '@/i18n/navigation'
import Heading from '@/components/ui/Heading'
import { ListingImage } from '@/components/marketplace/ListingImage'
import { PaymentReturnBanner } from '@/components/payments/PaymentReturnBanner'
import { useCart } from '@/components/marketplace/cart/CartProvider'
import { apiFetch } from '@/lib/api/client'
import { formatCHF, REVAMPIT_LISTING_DELIVERY } from '@/config/marketplace'
import { LOCATIONS, OPENING_HOURS } from '@/config/org'

export function CartPageClient() {
  const t = useTranslations('marketplace.cart')
  const tCheckout = useTranslations('marketplace.checkout')
  const { items, remove, total, clear, hydrated } = useCart()
  const { status } = useSession()
  const router = useRouter()
  const [checkingOut, setCheckingOut] = useState(false)
  const [reviewing, setReviewing] = useState(false)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'shipping'>('pickup')
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    street: '',
    postal_code: '',
    city: '',
    country: 'CH',
  })

  const shippingCost = deliveryMethod === 'shipping' && REVAMPIT_LISTING_DELIVERY.shippingCostChf
    ? Number(REVAMPIT_LISTING_DELIVERY.shippingCostChf)
    : 0
  const orderTotal = total + shippingCost
  const postalCodeValid = /^\d{4}$/.test(shippingAddress.postal_code)
  const shippingFormValid = deliveryMethod !== 'shipping' || (
    shippingAddress.name.trim() !== '' &&
    shippingAddress.street.trim() !== '' &&
    shippingAddress.city.trim() !== '' &&
    postalCodeValid
  )

  if (!hydrated) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-action" aria-hidden="true" />
      </div>
    )
  }

  const handleCheckout = async () => {
    if (!reviewing) {
      setReviewing(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (status !== 'authenticated') {
      router.push('/auth/login?callbackUrl=/marketplace/cart')
      return
    }
    setCheckingOut(true)
    const res = await apiFetch<{ orderId: string; paymentUrl: string }>('/api/marketplace/cart/checkout', {
      method: 'POST',
      body: {
        listing_ids: items.map((i) => i.id),
        delivery_method: deliveryMethod,
        shipping_address: deliveryMethod === 'shipping' ? shippingAddress : null,
      },
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
      <nav aria-label={tCheckout('title')} className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-text-tertiary">
        <span className={reviewing ? 'text-text-tertiary' : 'text-action'}>1 {t('title')}</span>
        <span aria-hidden="true">/</span>
        <span className={reviewing ? 'text-action' : ''}>2 {tCheckout('summary.title')}</span>
        <span aria-hidden="true">/</span>
        <span>3 {tCheckout('title')}</span>
      </nav>

      <PaymentReturnBanner namespace="marketplace.cart" cleanPath="/marketplace/cart" />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Heading level={1} className="text-2xl font-semibold text-text-primary sm:text-3xl md:text-3xl">
            {reviewing ? tCheckout('summary.title') : t('title')}
          </Heading>
          <p className="mt-1 text-sm text-text-secondary">
            {t('itemCount', { count: items.length })} · {t('pickupNote')}
          </p>
        </div>
        {reviewing && (
          <Button variant="ghost" size="sm" onClick={() => setReviewing(false)}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('title')}
          </Button>
        )}
      </div>

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
          <div className="space-y-4">
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
                  {!reviewing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(item.id)}
                      aria-label={t('remove')}
                      className="text-text-muted hover:text-error-600"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>

          {reviewing && (
              <section className="rounded-xl border border-subtle bg-surface-base p-5" aria-labelledby="delivery-heading">
                <Heading id="delivery-heading" level={2} className="mb-4 text-base text-text-primary">
                  {tCheckout('delivery.title')}
                </Heading>
                <div className="space-y-3">
                  <label className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${
                    deliveryMethod === 'pickup' ? 'border-action bg-action-muted' : 'border-subtle hover:border-strong'
                  }`}>
                    <input
                      type="radio"
                      name="cartDelivery"
                      value="pickup"
                      checked={deliveryMethod === 'pickup'}
                      onChange={() => setDeliveryMethod('pickup')}
                      className="mt-1 text-action focus:ring-action"
                    />
                    <Store className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-text-primary">{tCheckout('delivery.pickup')}</span>
                      <span className="mt-1 block text-sm text-text-secondary">{LOCATIONS.store.full}</span>
                      <span className="mt-1 block text-xs text-text-tertiary">{OPENING_HOURS.compact}</span>
                    </span>
                    <span className="text-sm font-medium text-action">{tCheckout('delivery.free')}</span>
                  </label>

                  <label className={`flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors ${
                    deliveryMethod === 'shipping' ? 'border-action bg-action-muted' : 'border-subtle hover:border-strong'
                  }`}>
                    <input
                      type="radio"
                      name="cartDelivery"
                      value="shipping"
                      checked={deliveryMethod === 'shipping'}
                      onChange={() => setDeliveryMethod('shipping')}
                      className="mt-1 text-action focus:ring-action"
                    />
                    <Truck className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-text-primary">{tCheckout('delivery.shipping')}</span>
                      <span className="mt-1 block text-sm text-text-secondary">{tCheckout('delivery.shippingNationwide')}</span>
                    </span>
                    <span className="text-sm font-medium text-text-primary">{formatCHF(shippingCost || Number(REVAMPIT_LISTING_DELIVERY.shippingCostChf))}</span>
                  </label>
                </div>

                {deliveryMethod === 'shipping' && (
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-text-secondary">{tCheckout('address.name')}</label>
                      <Input
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, name: e.target.value }))}
                        autoComplete="name"
                        placeholder={tCheckout('address.namePlaceholder')}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-sm font-medium text-text-secondary">{tCheckout('address.street')}</label>
                      <Input
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                        autoComplete="street-address"
                        placeholder={tCheckout('address.streetPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-secondary">{tCheckout('address.postalCode')}</label>
                      <Input
                        value={shippingAddress.postal_code}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, postal_code: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        inputMode="numeric"
                        autoComplete="postal-code"
                        placeholder="8000"
                        className={shippingAddress.postal_code && !postalCodeValid ? 'border-error-500' : ''}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-text-secondary">{tCheckout('address.city')}</label>
                      <Input
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                        autoComplete="address-level2"
                        placeholder={tCheckout('address.cityPlaceholder')}
                      />
                    </div>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Summary */}
          <div className="h-fit space-y-4 rounded-xl border border-subtle bg-surface-base p-5 lg:sticky lg:top-24">
            <div className="flex justify-between text-sm">
              <span className="text-text-tertiary">{t('subtotal')}</span>
              <span className="font-medium text-text-primary">{formatCHF(total)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-text-tertiary">
                {deliveryMethod === 'shipping' ? <Truck className="h-4 w-4 shrink-0" aria-hidden="true" /> : <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />}
                {deliveryMethod === 'shipping' ? tCheckout('delivery.shipping') : tCheckout('delivery.pickup')}
              </span>
              <span className="font-medium text-text-primary">{shippingCost > 0 ? formatCHF(shippingCost) : tCheckout('delivery.free')}</span>
            </div>
            <div className="flex justify-between border-t border-subtle pt-3 text-base font-semibold text-text-primary">
              <span>{t('total')}</span>
              <span>{formatCHF(orderTotal)}</span>
            </div>
            <Button variant="primary" size="lg" className="w-full" onClick={handleCheckout} disabled={checkingOut || (reviewing && !shippingFormValid)}>
              {checkingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : reviewing ? (
                <><LockKeyhole className="h-4 w-4" aria-hidden="true" /> {tCheckout('payment.proceed')}</>
              ) : t('checkout')}
            </Button>
            {reviewing ? (
              <div className="space-y-2 border-t border-subtle pt-4 text-xs text-text-tertiary">
                <p className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden="true" />
                  {tCheckout('buyerProtection')}
                </p>
                <p className="flex items-start gap-2">
                  <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-action" aria-hidden="true" />
                  {tCheckout('title')}
                </p>
              </div>
            ) : (
              <Button as={Link} href="/marketplace" variant="ghost" size="sm" className="w-full">
                {t('continueShopping')}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
