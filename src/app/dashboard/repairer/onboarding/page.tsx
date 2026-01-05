import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ROLES } from '@/lib/constants'
import {
  Wrench,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Users,
  Award,
  Shield,
  ArrowRight,
  TrendingUp
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Repairer Onboarding | RevampIT',
  description: 'Become a certified repair person on the RevampIT platform and connect with customers in need of repair services.',
}

export default async function RepairerOnboardingPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/login')
  }

  const userRole = session.user.role as string
  const isRepairer = userRole === ROLES.REPAIRER

  if (isRepairer) {
    // User is already a repairer, redirect to dashboard
    redirect('/dashboard/repairer')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Wrench className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Werden Sie Reparatur-Experte bei RevampIT
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Bieten Sie Ihre Reparaturdienste an und verbinden Sie sich mit Kunden,
            die Ihre Fachkenntnisse brauchen.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Direkt mit Kunden verbinden
                </h3>
                <p className="text-gray-600">
                  Erhalten Sie direkte Anfragen von Kunden in Ihrem Einzugsgebiet.
                  Keine Zwischenhändler, volle Kontrolle über Ihre Dienstleistungen.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Erhöhen Sie Ihre Sichtbarkeit
                </h3>
                <p className="text-gray-600">
                  Zeigen Sie Ihr Fachwissen, Bewertungen und Zertifizierungen.
                  Bauen Sie Vertrauen mit einem professionellen Profil auf.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Bewertungssystem
                </h3>
                <p className="text-gray-600">
                  Sammeln Sie Bewertungen und bauen Sie eine Reputation auf.
                  Hervorragende Bewertungen helfen Ihnen, mehr Kunden zu gewinnen.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Flexible Arbeitszeiten
                </h3>
                <p className="text-gray-600">
                  Legen Sie Ihre eigenen Verfügbarkeiten fest. Arbeiten Sie wann
                  und wo Sie möchten, solange es zu Ihren Kunden passt.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Anforderungen</h2>

          <div className="space-y-4">
            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Fachkenntnisse nachweisen</h3>
                <p className="text-gray-600">Mindestens 2 Jahre Erfahrung in der Reparatur von Elektronikgeräten</p>
              </div>
            </div>

            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Verifizierung</h3>
                <p className="text-gray-600">Ausweis, Zertifizierungen und Referenzen werden überprüft</p>
              </div>
            </div>

            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Versicherung</h3>
                <p className="text-gray-600">Berufshaftpflichtversicherung für Reparaturdienste</p>
              </div>
            </div>

            <div className="flex items-start">
              <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Qualitätssicherung</h3>
                <p className="text-gray-600">Einhaltung unserer Qualitätsstandards und Garantiebedingungen</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Award className="w-8 h-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Faire Gebühren
              </h3>
              <div className="space-y-2 text-blue-800">
                <p>• <strong>Keine</strong> monatlichen Mitgliedsgebühren</p>
                <p>• <strong>5%</strong> Serviceprovision auf jede erfolgreiche Buchung</p>
                <p>• <strong>Kostenlose</strong> Verifizierung und Profilerstellung</p>
                <p>• <strong>Premium</strong> Sichtbarkeit für verifizierte Experten</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Verifiziert</p>
              <p className="text-xs text-gray-600">Qualitätsgeprüft</p>
            </div>
            <div>
              <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Bewertet</p>
              <p className="text-xs text-gray-600">Kundenfeedback</p>
            </div>
            <div>
              <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Versichert</p>
              <p className="text-xs text-gray-600">Haftpflicht</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/dashboard/repairer/onboarding/apply"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Als Reparateur bewerben
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>

          <p className="text-gray-600 mt-4">
            Bereits Reparateur?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Hier anmelden
            </Link>
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Häufige Fragen</h2>

          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Wie funktioniert die Bezahlung?</h3>
              <p className="text-gray-600">Kunden bezahlen direkt über die Plattform. Sie erhalten Ihr Geld abzüglich der Servicegebühr innerhalb von 3-5 Werktagen nach erfolgreichem Abschluss der Reparatur.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Was passiert bei Streitigkeiten?</h3>
              <p className="text-gray-600">Unser Team vermittelt bei Meinungsverschiedenheiten. Wir prüfen alle Fälle individuell und stellen sicher, dass beide Parteien fair behandelt werden.</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Kann ich meine Preise selbst festlegen?</h3>
              <p className="text-gray-600">Ja, Sie legen Ihre Stundensätze und Servicepreise selbst fest. Wir empfehlen wettbewerbsfähige Preise basierend auf Marktstandards in Ihrer Region.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}