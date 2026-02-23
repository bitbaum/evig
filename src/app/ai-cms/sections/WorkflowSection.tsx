import { Brain, Users, CheckCircle, Zap, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTextColor } from '@/lib/design-system'

export function WorkflowSection() {
  return (
    <div className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className={cn('text-3xl font-bold tracking-tight sm:text-4xl', getTextColor('white', 'primary'))}>
            Wie unser System tatsächlich funktioniert
          </h2>
          <p className={cn('mt-6 text-lg leading-8', getTextColor('white', 'muted'))}>
            Warum dieses System so schnell und effizient ist: Minimale manuelle Arbeit auf allen Seiten.
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 relative">
            <div className="hidden lg:block absolute top-24 left-1/5 w-4/5 h-0.5 bg-gradient-to-r from-blue-300 via-green-300 via-purple-300 to-orange-300 to-red-300"></div>

            <div className="relative bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-3">1. Vorschlag</h3>
              <p className="text-sm text-gray-700 text-center">
                Nutzer oder Team-Mitglied schlägt Verbesserung vor. Wenige Sekunden Aufwand.
              </p>
            </div>

            <div className="relative bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl border border-green-200">
              <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-3">2. AI-Analyse</h3>
              <p className="text-sm text-gray-700 text-center">
                AI vergleicht Vorschlag mit Codebase und erstellt technische Bewertung. Vollautomatisch.
              </p>
            </div>

            <div className="relative bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-3">3. Strukturierte Info</h3>
              <p className="text-sm text-gray-700 text-center">
                Entwickler erhält sofort strukturierte Informationen zur Entscheidungsfindung.
              </p>
            </div>

            <div className="relative bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-2xl border border-orange-200">
              <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-3">4. Umsetzung</h3>
              <p className="text-sm text-gray-700 text-center">
                Copy-Paste zur AI-Coding-Agent. Änderungen in Sekunden bis Minuten.
              </p>
            </div>

            <div className="relative bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200">
              <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <GitBranch className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-center mb-3">5. Git-Versionierung</h3>
              <p className="text-sm text-gray-700 text-center">
                Automatische Versionierung. Vollständige Nachverfolgbarkeit.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 bg-gradient-to-r from-info-50 to-success-50 rounded-3xl p-6 sm:p-8 border-2 border-neutral-200">
          <div className="text-center mb-8">
            <h3 className={cn('text-2xl font-bold mb-4', getTextColor('white', 'primary'))}>Warum das System so schnell ist</h3>
            <p className={cn('text-lg max-w-3xl mx-auto', getTextColor('white', 'muted'))}>
              Der wahre Wert liegt in der Effizienz: Minimale manuelle Arbeit für alle Beteiligten.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-info-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-info-600" />
              </div>
              <h4 className={cn('text-lg font-semibold mb-2', getTextColor('white', 'primary'))}>Für Nutzer</h4>
              <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                Ein Klick, kurze Beschreibung. Kein technisches Wissen oder Registrierung nötig.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-success-600" />
              </div>
              <h4 className={cn('text-lg font-semibold mb-2', getTextColor('white', 'primary'))}>Für Entwickler</h4>
              <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                Strukturierte Informationen statt vager Beschreibungen. Schnelle Entscheidungsfindung.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-secondary-600" />
              </div>
              <h4 className={cn('text-lg font-semibold mb-2', getTextColor('white', 'primary'))}>Für das Team</h4>
              <p className={cn('text-sm sm:text-base', getTextColor('white', 'muted'))}>
                Wenige Minuten statt Tage für typische Änderungen. Mehr Zeit für wichtige Features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
