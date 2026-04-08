import Heading from '@/components/ui/Heading'

const freedomRatings = [
  { label: 'Open-Source-Freiheit', color: 'bg-green-500', desc: 'Vollständige Code-Transparenz & Eigentum' },
  { label: 'Dezentralisierungsfreiheit', color: 'bg-blue-500', desc: 'Unabhängigkeit von Plattformkontrolle' },
  { label: 'Datenschutzfreiheit', color: 'bg-purple-500', desc: 'Datensouveränität & Schutz' },
  { label: 'Dateneigentumsfreiheit', color: 'bg-orange-500', desc: 'Vollständige Kontrolle über deine Informationen' },
  { label: 'Code-Eigentumsfreiheit', color: 'bg-teal-500', desc: 'Uneingeschränkte Änderungsrechte' },
  { label: 'Automatisierungsfreiheit', color: 'bg-rose-500', desc: 'Anstrengung in Wahl verwandelt' },
  { label: 'Benutzererfahrungsfreiheit', color: 'bg-indigo-500', desc: 'Intuitive, mühelose Interaktion' },
  { label: 'Entwicklerfreiheit', color: 'bg-cyan-500', desc: 'Wartbare, erweiterbare Systeme' },
]

export function PhilosophySection() {
  return (
    <section className="py-12 sm:py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Heading level={2} className="mb-6">Unsere Freiheits-First-Philosophie</Heading>
            <p className="text-lg text-gray-600 mb-4">
              Wir glauben an <strong>100% Engagement für Freiheit</strong> durch maximale Automatisierung.
            </p>
            <p className="text-base text-gray-500">
              Wenn Automatisierung unerwünschten Aufwand minimiert, verwandelt sie Anstrengung von Notwendigkeit in Wahl &ndash; und Wahl ist Freiheit.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Heading level={3} className="mb-6 text-gray-800">Anstrengung als Wahl, nicht als Notwendigkeit</Heading>
              <div className="space-y-6 text-gray-600">
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="font-semibold text-green-800 mb-2">Das Freiheitsprinzip</p>
                  <p>
                    <strong>100% Engagement für Freiheit</strong> bedeutet, dass jeder Aspekt deiner digitalen Präsenz deiner Autonomie dienen und sie nicht einschränken sollte.
                  </p>
                </div>

                <div className="border-l-4 border-blue-500 pl-4">
                  <p className="font-semibold text-blue-800 mb-2">Automatisierung als Befreiung</p>
                  <p>
                    Maximale Automatisierung eliminiert sich wiederholende, unerwünschte Aufgaben und gibt dir die Freiheit, sich auf das zu konzentrieren, was dir und deiner Mission wirklich wichtig ist.
                  </p>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <p className="font-semibold text-purple-800 mb-2">Wahl statt Zwang</p>
                  <p>
                    Wenn Systeme nahtlos ohne dein ständiges Eingreifen funktionieren, wird jeder Moment, den du aufwendest, beabsichtigt &ndash; eine Wahl, keine Notwendigkeit.
                  </p>
                </div>

                <p className="italic text-gray-500 text-sm mt-6">
                  &ldquo;Wahre Freiheit ist nicht nur die Fähigkeit zu wählen &ndash; es sind Systeme, die dein Recht auf Wahl bewahren, indem sie erzwungenen Aufwand beseitigen.&rdquo;
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8">
              <Heading level={4} className="mb-4 text-gray-800">Unser Freiheits-Bewertungssystem</Heading>
              <p className="text-gray-600 mb-4">
                Jede von uns erstellte Website und Web-App erhält eine umfassende Freiheitsbewertung, die darauf basiert, wie gut sie deine Autonomie unterstützt:
              </p>
              <div className="space-y-3">
                {freedomRatings.map((item, index) => (
                  <div key={index} className="group">
                    <div className="flex items-center space-x-3 mb-1">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{width: '95%'}}></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 ml-6 mb-2">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-white rounded-lg border border-green-200">
                <p className="text-sm text-green-800 font-semibold mb-1">Unser Engagement</p>
                <p className="text-xs text-green-700">
                  Wir streben nach maximalen Punktzahlen in allen Freiheitsdimensionen. Jeder Kompromiss wird transparent besprochen, wobei Alternativen immer geprüft werden.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
