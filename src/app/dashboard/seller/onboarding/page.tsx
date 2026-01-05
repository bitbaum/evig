import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ROLES } from '@/lib/constants'
import {
  Store,
  Package,
  CreditCard,
  Shield,
  CheckCircle,
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Seller Onboarding | RevampIT',
  description: 'Become a seller on the RevampIT marketplace and start selling refurbished electronics.',
}

export default async function SellerOnboardingPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login')
  }

  const userRole = session.user.role as string
  const isSeller = userRole === ROLES.SELLER || userRole === ROLES.REVAMPIT_ADMIN

  if (isSeller) {
    // User is already a seller, redirect to dashboard
    redirect('/dashboard/seller')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <Store className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Werden Sie Verkäufer bei RevampIT
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Verkaufen Sie Ihre refurbished Elektronik an eine Community, die Wert auf Nachhaltigkeit legt.
            Einfach, sicher und profitabel.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Package className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Einfache Produktverwaltung
                </h3>
                <p className="text-gray-600">
                  KI-gestützte Produktanalyse, automatische Kategorisierung und einfache Preisgestaltung.
                  Veröffentlichen Sie Produkte mit wenigen Klicks.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <CreditCard className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sichere Zahlungen
                </h3>
                <p className="text-gray-600">
                  Sichere Zahlungsabwicklung mit transparenten Gebühren. Erhalten Sie Ihr Geld schnell
                  und zuverlässig auf Ihr Konto.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Vertrauenswürdige Plattform
                </h3>
                <p className="text-gray-600">
                  Verifizierte Verkäufer, Bewertungssystem und Käuferschutz. Bauen Sie Vertrauen
                  mit transparenten Bewertungen und Rezensionen auf.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <User className="w-8 h-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Community fokussiert
                </h3>
                <p className="text-gray-600">
                  Verkaufen Sie an eine Community, die nachhaltige Technologie schätzt.
                  Erreichen Sie Käufer, die Wert auf Qualität und Umwelt legen.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Voraussetzungen</h2>

          <div className="space-y-4">
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Konto verifizieren</h3>
                <p className="text-gray-600">Bestätigen Sie Ihre E-Mail-Adresse und persönliche Informationen</p>
              </div>
            </div>

            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Produkte vorbereiten</h3>
                <p className="text-gray-600">Stellen Sie sicher, dass Ihre Produkte funktionsfähig und gut beschrieben sind</p>
              </div>
            </div>

            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Versandoptionen</h3>
                <p className="text-gray-600">Bereiten Sie sich auf den Versand Ihrer Produkte vor</p>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CreditCard className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Faire Gebühren
              </h3>
              <div className="space-y-2 text-blue-800">
                <p>• <strong>5%</strong> Verkaufsprovision pro Transaktion</p>
                <p>• <strong>Kostenlose</strong> Produkteinführung für die ersten 10 Produkte</p>
                <p>• <strong>Keine</strong> monatlichen Gebühren oder Mindestumsätze</p>
                <p>• <strong>Schnelle</strong> Auszahlungen innerhalb von 3-5 Werktagen</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/dashboard/seller/onboarding/apply"
            className="inline-flex items-center px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors"
          >
            Als Verkäufer bewerben
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>

          <p className="text-gray-600 mt-4">
            Bereits Verkäufer?{' '}
            <Link href="/auth/login" className="text-green-600 hover:text-green-700 font-medium">
              Hier anmelden
            </Link>
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Häufige Fragen</h2>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Wie lange dauert die Verifizierung?</h3>
              <p className="text-gray-600">Die Verifizierung dauert normalerweise 1-2 Werktage. Sie erhalten eine E-Mail-Bestätigung sobald Ihr Konto freigeschaltet ist.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Kann ich Produkte zurückgeben?</h3>
              <p className="text-gray-600">Als Verkäufer sind Sie für die Produktqualität verantwortlich. Rückgaben werden über unser System abgewickelt, aber Sie müssen die Versandkosten tragen.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Welche Produkte kann ich verkaufen?</h3>
              <p className="text-gray-600">Elektronik, Computer, Zubehör und refurbished Geräte. Alle Produkte müssen funktionstüchtig und korrekt beschrieben sein.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}