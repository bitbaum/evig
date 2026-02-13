import { Metadata } from 'next'
import Link from 'next/link'
import { Heart, Coffee, Users, Shield } from 'lucide-react'
import { PageHero } from '@/components/layout/PageHero'

export const metadata: Metadata = {
  title: 'RevampIt unterstützen | Community-gestützte Inhalte',
  description: 'Unterstützen Sie qualitativ hochwertige, werbefreie Inhalte über nachhaltige Technologie'
}

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-white">
      <PageHero
        theme="getInvolved"
        icon={Heart}
        title="Unterstützen Sie RevampIt"
        subtitle="Helfen Sie uns, qualitativ hochwertige, werbefreie Inhalte über nachhaltige Technologie, Open Source und die Zukunft des Computing zu erstellen."
      />

      {/* Why Support */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-3 sm:mb-4">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Keine Werbung</h3>
            <p className="text-gray-600">
              Wir werden niemals Werbung schalten oder Ihre Daten verkaufen
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Community-getrieben</h3>
            <p className="text-gray-600">
              Von der Community, für die Community – ohne kommerzielle Interessen
            </p>
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Heart className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Qualität zuerst</h3>
            <p className="text-gray-600">
              Fokus auf wahrheitsgetreue, gut recherchierte Inhalte
            </p>
          </div>
        </div>

        {/* Our Promise */}
        <div className="bg-gray-50 rounded-lg p-6 sm:p-8 mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Unser Versprechen</h2>
          <div className="prose prose-lg text-gray-700">
            <p>
              RevampIt ist kein Unternehmen – es ist eine Bewegung. Wir glauben daran, dass
              qualitativ hochwertige Informationen über nachhaltige Technologie für alle
              zugänglich sein sollten, ohne Bezahlschranken oder aufdringliche Werbung.
            </p>
            <p>
              Ihre Unterstützung ermöglicht es uns:
            </p>
            <ul className="space-y-2">
              <li>✅ Tiefgreifende Recherchen und Analysen durchzuführen</li>
              <li>✅ Unsere Server und Infrastruktur zu betreiben</li>
              <li>✅ Open-Source-Tools und -Ressourcen zu entwickeln</li>
              <li>✅ Community-Events und Workshops zu veranstalten</li>
              <li>✅ 100% werbefrei und unabhängig zu bleiben</li>
            </ul>
          </div>
        </div>

        {/* Support Options */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* One-time */}
          <div className="border-2 border-gray-200 rounded-lg p-6 sm:p-8 hover:border-green-500 transition-colors">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <Coffee className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Einmalige Spende</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Kaufen Sie uns einen Kaffee oder unterstützen Sie uns mit einem beliebigen Betrag
            </p>
            <a
              href="https://ko-fi.com/revampit"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-6 py-3 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Jetzt spenden
            </a>
          </div>

          {/* Monthly */}
          <div className="border-2 border-green-500 rounded-lg p-6 sm:p-8 bg-green-50">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Monatlicher Support</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Werden Sie Unterstützer und helfen Sie uns nachhaltig zu wachsen
            </p>
            <a
              href="https://github.com/sponsors/revampit"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-6 py-3 bg-green-600 text-white text-center rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Sponsor werden
            </a>
          </div>
        </div>

        {/* Alternative Ways */}
        <div className="text-center py-8 border-t border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Andere Wege zu helfen
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/blog/submit"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Beitrag einreichen
            </Link>
            <a
              href="https://github.com/revampit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Code beitragen
            </a>
            <Link
              href="/blog"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Artikel teilen
            </Link>
          </div>
        </div>

        {/* Thank You */}
        <div className="text-center py-8">
          <p className="text-lg text-gray-600">
            <strong>Vielen Dank</strong> für Ihre Unterstützung unserer Mission für
            nachhaltige, qualitativ hochwertige Technologie-Inhalte.
          </p>
        </div>
      </div>
    </main>
  )
}
