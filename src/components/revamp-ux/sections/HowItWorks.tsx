/**
 * How It Works Section
 * @fileoverview Simplified workflow showing key benefits
 */

export function HowItWorks() {
  return (
    <div className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            So einfach funktioniert's
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Drei Schritte zur besseren Website - für alle Beteiligten.
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Feedback geben</h3>
              <p className="text-gray-600">
                Nutzer klicken einfach auf "Verbessern" und beschreiben das Problem in eigenen Worten.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Automatische Analyse</h3>
              <p className="text-gray-600">
                KI analysiert das Feedback und erstellt einen technischen Lösungsvorschlag.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Schnelle Umsetzung</h3>
              <p className="text-gray-600">
                Entwickler setzen die Verbesserung in Minuten statt Tagen um.
              </p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-16 bg-gradient-to-r from-green-50 to-blue-50 rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Das Ergebnis</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">95%</div>
              <div className="text-sm text-gray-600">weniger Zeitaufwand</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 mb-2">10x</div>
              <div className="text-sm text-gray-600">mehr Feedback</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600 mb-2">100%</div>
              <div className="text-sm text-gray-600">Nutzer-Zufriedenheit</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


