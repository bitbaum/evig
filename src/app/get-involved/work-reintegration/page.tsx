import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { Briefcase, Users, GraduationCap, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Arbeitsreintegration | RevampIT',
  description: 'Nehmen Sie an unserem Arbeitsreintegrationsprogramm teil, um wertvolle Fähigkeiten und Erfahrungen in der Technologie zu sammeln und dabei Ihre Karriere wieder aufzubauen.'
}

const benefits = [
  {
    title: 'Fähigkeitsentwicklung',
    description: 'Lernen Sie praktische Fähigkeiten in Technologie und Nachhaltigkeit.',
    icon: GraduationCap
  },
  {
    title: 'Berufliches Wachstum',
    description: 'Erweitern Sie Ihren Lebenslauf mit realer Erfahrung.',
    icon: Briefcase
  },
  {
    title: 'Unterstützendes Umfeld',
    description: 'Arbeiten Sie in einem unterstützenden und verständnisvollen Team.',
    icon: Users
  },
  {
    title: 'Sinnvolle Arbeit',
    description: 'Tragen Sie zu Projekten bei, die einen Unterschied machen.',
    icon: Heart
  }
]

export default function WorkReintegrationPage() {
  return (
    <InvolvementPageLayout
      title="Arbeitsreintegrationsprogramm"
      description="Schliessen Sie sich unserem unterstützenden Programm an, um Ihre Karriere in Technologie und Nachhaltigkeit wieder aufzubauen."
      ctaText="Ihre Reise beginnen"
      ctaHref="mailto:empfang@revamp-it.ch"
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Über unser Programm</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Unser Arbeitsreintegrationsprogramm ist darauf ausgelegt, Menschen dabei zu helfen, ihre Karriere in einem 
            unterstützenden und verständnisvollen Umfeld wieder aufzubauen. Wir konzentrieren uns darauf, praktische Erfahrungen in 
            Technologie und Nachhaltigkeit zu vermitteln und Ihnen dabei zu helfen, die Fähigkeiten und das Selbstvertrauen zu entwickeln, 
            die für eine langfristige Beschäftigung erforderlich sind.
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

        {/* Features Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Programmmerkmale</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Strukturierte Arbeitserfahrung in der Technologie</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Berufliche Entwicklung und Ausbildung</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Individuelle Unterstützung und Betreuung</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Flexible Terminplanungsoptionen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Schrittweise Arbeitsbelastungserhöhung</span>
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
                <span className="text-gray-600">Computer-Hardware und -Software</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Technische Fehlerbehebung</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Kundenservice</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Teamzusammenarbeit</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Projektmanagement</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Support Services Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Unterstützungsdienstleistungen</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Regelmässige Check-ins und Fortschrittsüberprüfungen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Zugang zu Beratungsdienstleistungen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Arbeitsplatzanpassungen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Karriereführung und -planung</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Networking-Möglichkeiten</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Individualized Approach Section */}
        <section className="bg-green-50 rounded-xl p-8 space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">Individualisierter Ansatz</h3>
          <p className="text-gray-600 leading-relaxed">
            Wir verstehen, dass jeder Weg einzigartig ist. Unser Programm ist flexibel und kann 
            auf Ihre spezifischen Bedürfnisse und Ziele zugeschnitten werden. Wir arbeiten mit Ihnen zusammen, um einen Plan zu erstellen, 
            der Ihre erfolgreiche Wiedereingliederung in das Arbeitsleben unterstützt.
          </p>
        </section>

        {/* Success Stories Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Erfolgsgeschichten</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Viele unserer Teilnehmer sind erfolgreich in eine Vollzeitbeschäftigung in 
            der Technologie und verwandten Bereichen übergegangen. Ihr Erfolg ist ein Zeugnis für die Wirksamkeit 
            unseres Programms und das Engagement unseres Teams.
          </p>
        </section>

        {/* How to Get Started Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Wie Sie anfangen können</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">1.</span>
                <span className="text-gray-600">Kontaktieren Sie uns, um Ihre Situation zu besprechen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">2.</span>
                <span className="text-gray-600">Treffen Sie sich mit unserem Team für eine Bewertung</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">3.</span>
                <span className="text-gray-600">Entwickeln Sie Ihren personalisierten Plan</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">4.</span>
                <span className="text-gray-600">Beginnen Sie Ihre Arbeitsreintegrationsreise</span>
              </li>
            </ol>
          </div>
        </section>

        {/* Confidentiality Section */}
        <section className="bg-green-50 rounded-xl p-8 space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">Vertraulichkeit</h3>
          <p className="text-gray-600 leading-relaxed">
            Wir wahren während des gesamten Programms strenge Vertraulichkeit. Ihre Privatsphäre und Würde sind 
            unsere obersten Prioritäten, und wir stellen sicher, dass alle Informationen mit äusserster Sorgfalt 
            und Respekt behandelt werden.
          </p>
        </section>
      </div>
    </InvolvementPageLayout>
  )
} 