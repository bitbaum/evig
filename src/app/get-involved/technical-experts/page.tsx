import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { Code, Cpu, Users, Lightbulb } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Technische Experten | RevampIT',
  description: 'Teilen Sie Ihre technische Expertise und helfen Sie uns, innovative Lösungen für nachhaltige Technologie zu entwickeln.'
}

const opportunities = [
  {
    title: 'Open-Source-Entwicklung',
    description: 'Tragen Sie zu unseren Open-Source-Projekten bei und helfen Sie, unsere Software-Lösungen zu verbessern.',
    icon: Code
  },
  {
    title: 'Hardware-Innovation',
    description: 'Arbeiten Sie an Hardware-Projekten, die Technologie nachhaltiger und zugänglicher machen.',
    icon: Cpu
  },
  {
    title: 'Wissensaustausch',
    description: 'Teilen Sie Ihr Fachwissen durch Workshops, Dokumentation und Mentoring.',
    icon: Users
  },
  {
    title: 'Projektleitung',
    description: 'Leiten Sie technische Initiativen und helfen Sie, die Zukunft nachhaltiger Technologie zu gestalten.',
    icon: Lightbulb
  }
]

export default function TechnicalExpertsPage() {
  return (
    <InvolvementPageLayout
      title="Technische Experten"
      description="Teilen Sie Ihre Expertise und helfen Sie uns, innovative Lösungen für nachhaltige Technologie zu entwickeln."
      ctaText="Ihre Expertise teilen"
      ctaHref="mailto:empfang@revamp-it.ch"
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Treten Sie unserem technischen Team bei</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Wir suchen immer technische Experten, die unsere Leidenschaft für nachhaltige Technologie 
            und Open-Source-Lösungen teilen. Ob Sie Softwareentwickler, Hardware-Ingenieur oder Systemadministrator 
            sind - Ihre Expertise kann uns dabei helfen, eine grössere Wirkung zu erzielen.
          </p>
        </section>

        {/* Opportunities Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-gray-900">Möglichkeiten für technische Experten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {opportunities.map((opportunity, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 hover:border-green-200 transition-colors duration-300">
                <div className="text-green-600 mb-4">
                  <opportunity.icon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{opportunity.title}</h3>
                <p className="text-gray-600 leading-relaxed">{opportunity.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Areas of Expertise Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Fachbereiche</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Softwareentwicklung (Python, JavaScript, Linux)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Hardware-Entwicklung und -Reparatur</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Systemadministration</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Netzwerk-Engineering</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Datenbankmanagement</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Sicherheit und Datenschutz</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Technische Dokumentation</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Current Projects Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Aktuelle Projekte</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Entwicklung von Open-Source-Buchhaltungssoftware</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Automatisierung der Hardware-Aufarbeitung</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Entwicklung von Bildungsplattformen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Systemadministrations-Tools</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Dokumentation und Wissensdatenbank</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Vorteile der Mitgliedschaft</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Arbeiten Sie an sinnvollen Projekten, die eine echte Wirkung haben</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Zusammenarbeit mit einem vielfältigen Expertenteam</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Zugang zu unserer Werkstatt und unseren Testeinrichtungen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Möglichkeiten zur Führung und Betreuung anderer</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Flexible Beitragsmöglichkeiten</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Open Source Focus Section */}
        <section className="bg-green-50 rounded-xl p-8 space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">Open-Source-Fokus</h3>
          <p className="text-gray-600 leading-relaxed">
            Wir glauben an die Kraft von Open-Source-Software und -Hardware. Als technischer Experte 
            haben Sie die Möglichkeit, zu Open-Source-Projekten beizutragen und dabei zu helfen, 
            Technologie für alle zugänglicher zu machen.
          </p>
        </section>

        {/* How to Get Started Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Wie Sie anfangen können</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">1.</span>
                <span className="text-gray-600">Kontaktieren Sie uns mit Ihrem Fachbereich und Ihren Interessen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">2.</span>
                <span className="text-gray-600">Besprechen Sie mögliche Projekte und Beiträge</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">3.</span>
                <span className="text-gray-600">Überprüfen Sie unsere Entwicklungsrichtlinien und -prozesse</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">4.</span>
                <span className="text-gray-600">Beginnen Sie, zu unseren Projekten beizutragen</span>
              </li>
            </ol>
          </div>
        </section>
      </div>
    </InvolvementPageLayout>
  )
} 