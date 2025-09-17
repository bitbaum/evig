/**
 * Development Roadmap Section
 * @fileoverview Marketing-focused roadmap showing future benefits
 */

export function DevelopmentRoadmap() {
  const roadmap = [
    {
      phase: 'Jetzt verfügbar',
      items: [
        'Direktes Nutzer-Feedback',
        'Automatische Kategorisierung',
        'E-Mail-Integration'
      ]
    },
    {
      phase: 'Demnächst',
      items: [
        'Screenshot-Unterstützung',
        'Visuelle Markierung',
        'Rechtsklick-Menüs'
      ]
    },
    {
      phase: 'In Planung',
      items: [
        'KI-gestützte Vorschläge',
        'Automatische Umsetzung',
        'Performance-Analyse'
      ]
    }
  ]

  return (
    <div className="py-16 sm:py-24 bg-gradient-to-r from-blue-600 to-purple-600">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Die Zukunft des Feedback-Managements
          </h2>
          <p className="mt-6 text-xl text-blue-100 max-w-2xl mx-auto">
            Wir entwickeln kontinuierlich weiter, um Ihnen die bestmögliche Erfahrung zu bieten.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roadmap.map((phase, index) => (
            <div key={index} className="bg-white/10 backdrop-blur rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                {phase.phase}
              </h3>
              <ul className="space-y-3 text-blue-100">
                {phase.items.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <div className="w-2 h-2 bg-white rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="bg-white/10 backdrop-blur rounded-xl p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-white mb-2">
              Bereits heute profitieren
            </h3>
            <p className="text-blue-100 text-sm">
              Während wir an der Zukunft arbeiten, profitieren Sie bereits heute von der revolutionären Feedback-Lösung.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
