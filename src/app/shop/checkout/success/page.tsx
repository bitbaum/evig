import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Package, Truck, Mail, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Bestellung erfolgreich | RevampIT',
  description: 'Ihre Bestellung wurde erfolgreich aufgegeben. Vielen Dank für Ihren Einkauf!',
}

export default function CheckoutSuccessPage() {
  // In a real implementation, you'd fetch order details based on the order ID
  // For now, we'll show a generic success message

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bestellung erfolgreich!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Vielen Dank für Ihren Einkauf bei RevampIT. Ihre Bestellung wurde erfolgreich aufgegeben
            und wird schnellstmöglich bearbeitet.
          </p>
        </div>

        {/* Order Summary Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Bestellübersicht</h2>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Bezahlt
            </span>
          </div>

          {/* Order Items */}
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Bestellte Artikel</h3>

            <div className="space-y-4">
              {/* Sample order item - in real implementation, fetch from database */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                  {/* Product image would go here */}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Refurbished MacBook Air M1</h4>
                  <p className="text-sm text-gray-600">Zustand: Wie neu • Verkäufer: RevampIT</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">CHF 899.00</p>
                  <p className="text-sm text-gray-600">Menge: 1</p>
                </div>
              </div>
            </div>

            {/* Order Totals */}
            <div className="border-t border-gray-200 mt-6 pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Zwischensumme</span>
                  <span className="font-medium">CHF 899.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">MwSt. (8%)</span>
                  <span className="font-medium">CHF 71.92</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Versand</span>
                  <span className="font-medium">Gratis</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Gesamt</span>
                    <span className="text-green-600">CHF 970.92</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Lieferadresse</h3>
              <div className="text-gray-700">
                <p>Max Mustermann</p>
                <p>Musterstrasse 123</p>
                <p>8000 Zürich</p>
                <p>Schweiz</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Zahlungsmethode</h3>
              <div className="flex items-center text-gray-700">
                <Package className="w-5 h-5 mr-2" />
                <span>Stripe (Kreditkarte)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Was passiert als nächstes?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Bearbeitung</h3>
              <p className="text-sm text-gray-600">
                Ihre Bestellung wird innerhalb von 1-2 Werktagen bearbeitet.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Versand</h3>
              <p className="text-sm text-gray-600">
                Versand erfolgt innerhalb von 1-3 Werktagen nach Bearbeitung.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <Mail className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">E-Mail-Benachrichtigung</h3>
              <p className="text-sm text-gray-600">
                Sie erhalten Updates per E-Mail über den Bestellstatus.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="text-center space-y-4">
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors mr-4"
          >
            Bestellungen ansehen
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>

          <Link
            href="/marketplace"
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Weiter einkaufen
          </Link>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 mb-2">Brauchen Sie Hilfe?</h3>
            <p className="text-gray-600 mb-4">
              Bei Fragen zu Ihrer Bestellung kontaktieren Sie uns gerne.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                Kontakt
              </Link>
              <Link
                href="/help/shipping"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Versand-Info
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}