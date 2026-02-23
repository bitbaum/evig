export function StatusSection() {
  return (
    <div className="py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-info-600 to-secondary-500 rounded-3xl p-6 sm:p-8 lg:p-12 text-white border-2 border-neutral-200">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-3xl font-bold mb-4">Entwicklungsstatus</h2>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              Das System befindet sich in aktiver Entwicklung. Hier sehen Sie, wie es funktionieren wird.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Geplante Benutzeroberfläche</h3>
              <ul className="space-y-4 text-white/90">
                {[
                  'Kleiner Verbesserungsbutton auf jeder Seite (konfigurierbar)',
                  'Einfaches Formular mit Seitenkontext',
                  'Strukturierte E-Mail an Entwickler-Team',
                  'Schnelle Umsetzung durch AI-Coding-Agent',
                ].map((text, i) => (
                  <li key={i} className="flex items-start">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                      <span className="text-sm font-bold">{i + 1}</span>
                    </div>
                    <span className="text-sm sm:text-base">{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl p-4 sm:p-6 border-2 border-white/20">
              <div className="bg-white/20 rounded-xl p-4 mb-4 border-2 border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-white">Erwartete Performance</div>
                  <div className="w-3 h-3 bg-info-300 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-3 text-sm">
                  {[
                    ['Durchschnittliche Vorschläge/Monat:', '5-15'],
                    ['AI-Analyse-Zeit:', 'Sekunden'],
                    ['Umsetzungszeit für einfache Änderungen:', 'Minuten'],
                    ['Manuelle Arbeit pro Vorschlag:', 'Minimal'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-white/80">{label}</span>
                      <span className="font-bold text-white">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-white/90">
                Geschätzte Werte basierend auf der geplanten Architektur.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
