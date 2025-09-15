import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { Leaf, Heart, GraduationCap, Globe } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Spenden | RevampIT',
  description: 'Unterstützen Sie unsere Mission, Technologie nachhaltig und für alle zugänglich zu machen.'
}

const impactAreas = [
  {
    title: 'Umweltauswirkungen',
    description: 'Helfen Sie, Elektroschrott zu reduzieren und nachhaltige Technologiepraktiken zu fördern.',
    icon: Leaf
  },
  {
    title: 'Gemeinschaftsunterstützung',
    description: 'Ermöglichen Sie Zugang zu Technologie für diejenigen, die sie am meisten benötigen.',
    icon: Heart
  },
  {
    title: 'Bildung & Ausbildung',
    description: 'Unterstützen Sie unsere Bildungsprogramme und Fähigkeitsentwicklungsinitiativen.',
    icon: GraduationCap
  },
  {
    title: 'Nachhaltige Zukunft',
    description: 'Tragen Sie zum Aufbau eines nachhaltigeren Technologie-Ökosystems bei.',
    icon: Globe
  }
]

export default function DonatePage() {
  return (
    <InvolvementPageLayout
      title="Unterstützen Sie unsere Mission"
      description="Ihre Spende hilft uns, Technologie nachhaltig und für alle zugänglich zu machen."
      ctaText="Spende tätigen"
      ctaHref="mailto:empfang@revamp-it.ch"
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Warum spenden?</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Ihre Unterstützung ermöglicht es uns, unsere Mission fortzusetzen, Technologie nachhaltig und 
            zugänglich zu machen. Jede Spende, unabhängig von der Grösse, hilft uns, mehr Geräte aufzuarbeiten, 
            mehr Gemeinschaften zu unterstützen und eine nachhaltigere Zukunft zu schaffen.
          </p>
        </section>

        {/* Impact Areas Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-gray-900">Wie Ihre Spende hilft</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {impactAreas.map((area, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg border border-gray-100 hover:border-green-200 transition-colors duration-300">
                <div className="text-green-600 mb-4">
                  <area.icon className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">{area.title}</h3>
                <p className="text-gray-600 leading-relaxed">{area.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Donation Options Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Spendmöglichkeiten</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Einmalige Spenden</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Monatliche wiederkehrende Spenden</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Unternehmens-Matching-Programme</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Sachspenden von Technologie</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Vermächtnisspenden</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Impact Details Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Ihre Spendenwirkung</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Technologie-Aufarbeitung und -Verteilung</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Bildungsprogramme und Workshops</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Öffentlichkeitsarbeit in der Gemeinschaft</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Forschung und Entwicklung</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Operative Unterstützung</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Transparency Section */}
        <section className="bg-green-50 rounded-xl p-8 space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">Transparenz und Verantwortlichkeit</h3>
          <p className="text-gray-600 leading-relaxed">
            Wir verpflichten uns, Ihre Spenden effektiv und transparent zu verwenden. Sie erhalten 
            regelmässige Updates darüber, wie Ihr Beitrag eine Wirkung erzielt, und wir führen klare 
            Finanzunterlagen, die zur Überprüfung zur Verfügung stehen.
          </p>
        </section>

        {/* How to Donate Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Wie Sie spenden können</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">1.</span>
                <span className="text-gray-600">Kontaktieren Sie uns, um Ihre Spende zu besprechen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">2.</span>
                <span className="text-gray-600">Wählen Sie Ihre bevorzugte Spendmethode</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">3.</span>
                <span className="text-gray-600">Schliessen Sie Ihre Spende ab</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">4.</span>
                <span className="text-gray-600">Erhalten Sie Bestätigung und Wirkungsupdates</span>
              </li>
            </ol>
          </div>
        </section>

        {/* Corporate Giving Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Unternehmensspenden</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <p className="text-gray-600 leading-relaxed mb-4">
              Wir bieten spezielle Programme für Unternehmensspender, einschliesslich:
            </p>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Mitarbeiter-Matching-Programme</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Unternehmens-Sponsoring-Möglichkeiten</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Technologie-Spendenprogramme</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Freiwilligen-Engagement-Initiativen</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Thank You Section */}
        <section className="bg-green-50 rounded-xl p-8 space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">Vielen Dank</h3>
          <p className="text-gray-600 leading-relaxed">
            Ihre Grosszügigkeit macht unsere Arbeit möglich. Gemeinsam können wir eine nachhaltigere und 
            zugänglichere Technologiezukunft für alle schaffen.
          </p>
        </section>
      </div>
    </InvolvementPageLayout>
  )
} 