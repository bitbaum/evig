'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CreditCard,
  Truck,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import StripeCheckout from '@/components/shop/StripeCheckout'
import type { StripePaymentIntent } from '@/types/common'
import { logger } from '@/lib/logger'

interface CartItem {
  id: string
  title: string
  quantity: number
  unit_price: number
  total_price: number
  thumbnail?: string
}

interface Cart {
  id: string
  items: CartItem[]
  subtotal: number
  tax_total: number
  total: number
  shipping_address?: {
    first_name: string
    last_name: string
    address_1: string
    city: string
    postal_code: string
    country_code: string
  }
}

function CheckoutContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const cartId = searchParams.get('cartId')

  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [paymentError, setPaymentError] = useState<string>('')

  useEffect(() => {
    const getOrCreateCart = async () => {
      // This would integrate with MedusaJS cart API
      // For now, we'll simulate with sample data
      setCart({
        id: 'sample-cart-id',
        items: [
          {
            id: 'item-1',
            title: 'Refurbished MacBook Air M1',
            quantity: 1,
            unit_price: 89900, // in cents
            total_price: 89900,
            thumbnail: '/api/placeholder/100/100'
          }
        ],
        subtotal: 89900,
        tax_total: 7192, // 8% VAT
        total: 97092
      })
      setLoading(false)
    }

    const fetchCart = async () => {
      try {
        // This would fetch cart from MedusaJS
        // For now, simulate with sample data
        await getOrCreateCart()
      } catch (error) {
        logger.error('Error fetching cart', { error })
        setLoading(false)
      }
    }

    if (cartId) {
      fetchCart()
    } else {
      // Try to get cart from localStorage or create new one
      getOrCreateCart()
    }
  }, [cartId])

  const handlePaymentSuccess = async (paymentIntent: StripePaymentIntent) => {
    setPaymentStatus('success')

    try {
      // Create order in MedusaJS
      const orderResponse = await fetch('/api/shop/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartId: cart?.id,
          paymentIntentId: paymentIntent.id,
          shippingAddress: cart?.shipping_address
        })
      })

      if (orderResponse.ok) {
        const orderData = await orderResponse.json()
        // Redirect to success page
        router.push(`/shop/checkout/success?orderId=${orderData.orderId}`)
      } else {
        logger.error('Order creation failed')
        // Still show success since payment went through
        router.push('/shop/checkout/success')
      }
    } catch (error) {
      logger.error('Error creating order', { error })
      // Still redirect to success since payment succeeded
      router.push('/shop/checkout/success')
    }
  }

  const handlePaymentError = (error: string) => {
    setPaymentStatus('error')
    setPaymentError(error)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Warenkorb ist leer</h1>
            <p className="text-gray-600 mb-6">
              Fügen Sie Produkte zu Ihrem Warenkorb hinzu, um fortzufahren.
            </p>
            <Link
              href="/shop/medusa"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Zum Shop
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/shop/medusa/cart"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Warenkorb
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">
            Zahlungsabwicklung kommt bald - Kontaktieren Sie uns für Bestellungen
          </p>
        </div>

        {/* Coming Soon Banner */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Zahlungsabwicklung in Entwicklung
            </h3>
            <p className="text-yellow-700 mb-4">
              Die Online-Zahlungsabwicklung ist noch nicht verfügbar. Für Bestellungen kontaktieren Sie uns bitte direkt.
            </p>
            <div className="flex justify-center gap-3">
              <Link
                href="/contact"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Kontakt aufnehmen
              </Link>
              <Link
                href="/shop/medusa"
                className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Weiter einkaufen
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bestellübersicht</h2>

              <div className="space-y-4">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                      {item.thumbnail && (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-600">Menge: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        CHF {(item.total_price / 100).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 mt-6 pt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Zwischensumme</span>
                  <span className="font-medium">CHF {(cart.subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">MwSt. (8%)</span>
                  <span className="font-medium">CHF {(cart.tax_total / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Versand</span>
                  <span className="font-medium">Gratis</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Gesamt</span>
                    <span className="text-green-600">CHF {(cart.total / 100).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Lieferadresse</h2>

              {cart.shipping_address ? (
                <div className="text-gray-700">
                  <p className="font-medium">
                    {cart.shipping_address.first_name} {cart.shipping_address.last_name}
                  </p>
                  <p>{cart.shipping_address.address_1}</p>
                  <p>
                    {cart.shipping_address.postal_code} {cart.shipping_address.city}
                  </p>
                  <p>{cart.shipping_address.country_code?.toUpperCase()}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Truck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">
                    Lieferadresse wird bei der Zahlung abgefragt
                  </p>
                  <p className="text-sm text-gray-500">
                    Stripe sammelt Ihre Versandinformationen sicher
                  </p>
                </div>
              )}
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Sicher</p>
                  <p className="text-xs text-gray-600">SSL-verschlüsselt</p>
                </div>
                <div>
                  <Truck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Schnell</p>
                  <p className="text-xs text-gray-600">1-3 Tage Lieferung</p>
                </div>
                <div>
                  <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Zuverlässig</p>
                  <p className="text-xs text-gray-600">30 Tage Rückgabe</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Zahlung
              </h2>

              {paymentStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center text-green-800">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Zahlung erfolgreich!</span>
                  </div>
                  <p className="text-green-700 text-sm mt-1">
                    Ihre Bestellung wird bearbeitet...
                  </p>
                </div>
              )}

              {paymentStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center text-red-800">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Zahlungsfehler</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">{paymentError}</p>
                </div>
              )}

              {paymentStatus !== 'success' && (
                <StripeCheckout
                  cartId={cart.id}
                  total={cart.total / 100} // Convert from cents to CHF
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentError={handlePaymentError}
                />
              )}
            </div>

            {/* Terms */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                Mit Ihrer Bestellung akzeptieren Sie unsere{' '}
                <Link href="/terms" className="text-green-600 hover:text-green-700 underline">
                  Allgemeinen Geschäftsbedingungen
                </Link>{' '}
                und{' '}
                <Link href="/privacy" className="text-green-600 hover:text-green-700 underline">
                  Datenschutzerklärung
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckoutFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutContent />
    </Suspense>
  )
}