import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { GraduationCap, Briefcase, Users, BookOpen } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Praktika | RevampIT',
  description: 'Sammeln Sie praktische Erfahrungen in Technologie und Nachhaltigkeit durch unser Praktikumsprogramm.'
}

const benefits = [
  {
    title: 'Praktische Erfahrung',
    description: 'Arbeiten Sie an echten Projekten, die einen Unterschied in der Gemeinschaft machen.',
    icon: Briefcase
  },
  {
    title: 'Berufliche Entwicklung',
    description: 'Lernen Sie von erfahrenen Mentoren und entwickeln Sie wertvolle Fähigkeiten.',
    icon: GraduationCap
  },
  {
    title: 'Teamzusammenarbeit',
    description: 'Arbeiten Sie mit einem vielfältigen Team von Fachleuten und Freiwilligen.',
    icon: Users
  },
  {
    title: 'Lernmöglichkeiten',
    description: 'Zugang zu Schulungsressourcen und Workshops.',
    icon: BookOpen
  }
]

export default function InternshipsPage() {
  return (
    <InvolvementPageLayout
      title="Praktikumsmöglichkeiten"
      description="Sammeln Sie wertvolle Erfahrungen in Technologie und Nachhaltigkeit und bewirken Sie echte Veränderungen."
      ctaText="Für Praktikum bewerben"
      ctaHref="mailto:empfang@revamp-it.ch"
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Über unser Praktikumsprogramm</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Unser Praktikumsprogramm bietet eine einzigartige Gelegenheit, praktische Erfahrungen in nachhaltiger 
            Technologie zu sammeln und gleichzeitig zu sinnvollen Projekten beizutragen. Ob Sie ein Student sind, der 
            sein Studium ergänzen möchte, oder jemand, der in die Technologiebranche wechseln möchte - unser Programm 
            bietet wertvolle Lern- und Wachstumsmöglichkeiten.
          </p>
        </section>

        {/* Benefits Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-gray-900">Programmvorteile</h2>
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

        {/* Available Positions Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Verfügbare Positionen</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Hardware-Aufarbeitung und -Reparatur</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Softwareentwicklung</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Systemadministration</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Projektmanagement</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Gemeinschaftsarbeit</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Technische Dokumentation</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Skills Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Was Sie lernen werden</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Hardware- und Software-Fehlerbehebung</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Projektmanagement und Zusammenarbeit</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Technische Dokumentation und Kommunikation</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Gemeinschaftsengagement und Öffentlichkeitsarbeit</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Nachhaltige Technologiepraktiken</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Requirements Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Anforderungen</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">In relevanten Studien eingeschrieben sein oder diese abgeschlossen haben</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Leidenschaft für Technologie und Nachhaltigkeit haben</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Sich für die Programmdauer verpflichten können</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Grundlegende Computerfähigkeiten haben</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Bereit sein zu lernen und beizutragen</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Flexible Arrangements Section */}
        <section className="bg-green-50 rounded-xl p-8 space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">Flexible Vereinbarungen</h3>
          <p className="text-gray-600 leading-relaxed">
            Wir verstehen, dass Studenten und Berufstätige unterschiedliche Zeitpläne haben. Wir bieten flexible 
            Vereinbarungen, um Ihren akademischen oder beruflichen Verpflichtungen gerecht zu werden und 
            gleichzeitig sicherzustellen, dass Sie das Beste aus Ihrer Praktikumserfahrung herausholen.
          </p>
        </section>

        {/* How to Apply Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Wie Sie sich bewerben</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">1.</span>
                <span className="text-gray-600">Senden Sie uns Ihren Lebenslauf und ein Anschreiben</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">2.</span>
                <span className="text-gray-600">Geben Sie Ihren Interessensbereich und Ihre Verfügbarkeit an</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">3.</span>
                <span className="text-gray-600">Führen Sie ein kurzes Gespräch</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">4.</span>
                <span className="text-gray-600">Beginnen Sie Ihre Praktikumsreise!</span>
              </li>
            </ol>
          </div>
        </section>
      </div>
    </InvolvementPageLayout>
  )
} 