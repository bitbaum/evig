import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { Globe, Users, Share2, Target } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Partnerschaften | RevampIT',
  description: 'Schliessen Sie sich mit RevampIT zusammen, um nachhaltige Technologielösungen zu schaffen und eine dauerhafte Wirkung zu erzielen.'
}

const benefits = [
  {
    title: 'Geteilte Wirkung',
    description: 'Verstärken Sie die Wirkung Ihrer Organisation durch gemeinsame Initiativen.',
    icon: Target
  },
  {
    title: 'Globales Netzwerk',
    description: 'Verbinden Sie sich mit gleichgesinnten Organisationen und erweitern Sie Ihre Reichweite.',
    icon: Globe
  },
  {
    title: 'Ressourcenteilung',
    description: 'Zugang zu geteilten Ressourcen und Expertise für grössere Effizienz.',
    icon: Share2
  },
  {
    title: 'Strategische Zusammenarbeit',
    description: 'Entwickeln Sie innovative Lösungen durch gemeinsame Anstrengungen.',
    icon: Users
  }
]

export default function PartnershipsPage() {
  return (
    <InvolvementPageLayout
      title="Partnerschaftsmöglichkeiten"
      description="Schliessen Sie sich mit RevampIT zusammen, um nachhaltige Technologielösungen zu schaffen und eine dauerhafte Wirkung zu erzielen."
      ctaText="Partner werden"
      ctaHref="mailto:empfang@revamp-it.ch"
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Warum mit uns zusammenarbeiten?</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Bei RevampIT glauben wir an die Kraft der Zusammenarbeit, um sinnvolle Veränderungen zu bewirken. Unsere 
            Partnerschaften kombinieren Expertise, Ressourcen und gemeinsame Werte, um nachhaltige 
            Technologielösungen zu schaffen, die Gemeinschaften und der Umwelt zugutekommen.
          </p>
        </section>

        {/* Benefits Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-gray-900">Partnerschaftsvorteile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 hover:border-green-200 transition-colors duration-300">
                <div className="text-green-600 mb-4">
                  <benefit.icon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Partnership Models Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Partnerschaftsmodelle</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Unternehmenspartnerschaften</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Zusammenarbeit mit Bildungseinrichtungen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Allianzen mit gemeinnützigen Organisationen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Technologieanbieter-Partnerschaften</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Zusammenarbeit mit Gemeinschaftsorganisationen</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Collaboration Areas Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Zusammenarbeitsbereiche</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Technologie-Aufarbeitungsprogramme</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Bildungsinitiativen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Forschung und Entwicklung</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Gemeinschafts-Öffentlichkeitsprogramme</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Nachhaltigkeitsprojekte</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Partnership Process Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Wie wir zusammenarbeiten</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">1.</span>
                <span className="text-gray-600">Erste Beratung zum Verständnis von Zielen und Möglichkeiten</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">2.</span>
                <span className="text-gray-600">Entwicklung von Partnerschaftsrahmen und -zielen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">3.</span>
                <span className="text-gray-600">Umsetzung von kooperativen Initiativen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">4.</span>
                <span className="text-gray-600">Regelmässige Fortschrittsüberprüfungen und Wirkungsbewertung</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">5.</span>
                <span className="text-gray-600">Kontinuierliche Verbesserung und Erweiterung der Partnerschaft</span>
              </li>
            </ol>
          </div>
        </section>

        {/* Customized Programs Section */}
        <section className="bg-green-50 rounded-xl p-8 space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">Massgeschneiderte Partnerschaftsprogramme</h3>
          <p className="text-gray-600 leading-relaxed">
            Wir verstehen, dass jede Organisation einzigartige Bedürfnisse und Ziele hat. Unsere Partnerschaftsprogramme 
            sind darauf zugeschnitten, sich an den Zielen Ihrer Organisation auszurichten und gleichzeitig die Wirkung 
            unserer gemeinsamen Bemühungen zu maximieren.
          </p>
        </section>

        {/* How to Get Started Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Wie Sie anfangen können</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">1.</span>
                <span className="text-gray-600">Kontaktieren Sie uns, um Partnerschaftsmöglichkeiten zu besprechen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">2.</span>
                <span className="text-gray-600">Teilen Sie die Ziele und Interessen Ihrer Organisation mit</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">3.</span>
                <span className="text-gray-600">Erkunden Sie potenzielle Zusammenarbeitsbereiche</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">4.</span>
                <span className="text-gray-600">Entwickeln Sie eine Partnerschaftsvereinbarung</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">5.</span>
                <span className="text-gray-600">Beginnen Sie Ihre Partnerschaftsreise</span>
              </li>
            </ol>
          </div>
        </section>
      </div>
    </InvolvementPageLayout>
  )
} 