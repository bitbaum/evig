import { Metadata } from 'next'
import { InvolvementPageLayout } from '../involvement-page-layout'
import { Users, Wrench, BookOpen, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Freiwilligenarbeit | RevampIT',
  description: 'Schliessen Sie sich unserem Team engagierter Freiwilliger an und bewirken Sie etwas in Ihrer Gemeinschaft durch Technologie und Nachhaltigkeit.'
}

const benefits = [
  {
    title: 'Praktische Erfahrung',
    description: 'Arbeiten Sie direkt mit Hardware und Software und sammeln Sie praktische Erfahrungen in Technologie und Nachhaltigkeit.',
    icon: Wrench
  },
  {
    title: 'Neue Fähigkeiten erlernen',
    description: 'Entwickeln Sie technische und soziale Fähigkeiten durch unsere Schulungsprogramme und Mentoring-Möglichkeiten.',
    icon: BookOpen
  },
  {
    title: 'Gemeinschaftswirkung',
    description: 'Bewirken Sie einen echten Unterschied in Ihrer Gemeinschaft, indem Sie dabei helfen, Technologie für alle zugänglich zu machen.',
    icon: Heart
  },
  {
    title: 'Unserem Team beitreten',
    description: 'Werden Sie Teil eines vielfältigen und leidenschaftlichen Teams, das auf ein gemeinsames Ziel hinarbeitet.',
    icon: Users
  }
]

export default function VolunteerPage() {
  return (
    <InvolvementPageLayout
      title="Freiwilliger werden"
      description="Schliessen Sie sich unserem Team engagierter Freiwilliger an und helfen Sie, Technologie nachhaltig und für alle zugänglich zu machen."
      ctaText="Freiwilligenarbeit beginnen"
      ctaHref="mailto:empfang@revamp-it.ch"
    >
      <div className="space-y-16">
        {/* Overview Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Warum Freiwilligenarbeit bei RevampIT?</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Bei RevampIT glauben wir, dass jeder Zugang zu Technologie und den Fähigkeiten haben sollte, sie zu nutzen. 
            Als Freiwilliger werden Sie Teil einer Gemeinschaft, die diese Vision verwirklicht. Ob Sie sich für 
            Technologie, Nachhaltigkeit oder Gemeindedienst begeistern - in unserem Team ist Platz für Sie.
          </p>
        </section>

        {/* Benefits Section */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold text-gray-900">Vorteile der Freiwilligenarbeit</h2>
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

        {/* Roles Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Freiwilligenrollen</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Bei der Aufarbeitung und Reparatur von Computern helfen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">In unseren Workshops und Schulungsprogrammen mithelfen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Unsere Gemeinschaftsinitiativen unterstützen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Zur Dokumentation und Wissensdatenbank beitragen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Bei administrativen Aufgaben und Veranstaltungsorganisation helfen</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Time Commitment Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Zeitaufwand</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <p className="text-gray-600 leading-relaxed mb-6">
              Wir verstehen, dass jeder unterschiedliche Zeitpläne hat. Wir bieten flexible Freiwilligentätigkeiten, 
              die sich an Ihre anderen Verpflichtungen anpassen lassen. Ob Sie ein paar Stunden pro Woche oder mehr 
              erhübrigen können - Ihr Beitrag wird einen Unterschied machen.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Flexible Terminplanungsoptionen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Regelmässige und gelegentliche Möglichkeiten</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 mr-3">•</span>
                <span className="text-gray-600">Remote- und Vor-Ort-Optionen</span>
              </li>
            </ul>
          </div>
        </section>

        {/* No Experience Required Section */}
        <section className="bg-green-50 rounded-xl p-8 space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">Keine Erfahrung erforderlich</h3>
          <p className="text-gray-600 leading-relaxed">
            Machen Sie sich keine Sorgen, wenn Sie keine technischen Erfahrungen haben. Wir bieten alle 
            Schulungen, die Sie benötigen, und es gibt viele Möglichkeiten, über die technische Arbeit hinaus 
            beizutragen. Was am wichtigsten ist, sind Ihre Begeisterung und Ihre Lernbereitschaft.
          </p>
        </section>

        {/* How to Get Started Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">Wie Sie anfangen können</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
            <ol className="space-y-4">
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">1.</span>
                <span className="text-gray-600">Kontaktieren Sie uns, um Ihr Interesse zu bekunden</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">2.</span>
                <span className="text-gray-600">Treffen Sie sich mit unserem Team, um Ihre Fähigkeiten und Interessen zu besprechen</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">3.</span>
                <span className="text-gray-600">Nehmen Sie an einer kurzen Einführungssitzung teil</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-600 font-semibold mr-3">4.</span>
                <span className="text-gray-600">Beginnen Sie, einen Unterschied zu machen!</span>
              </li>
            </ol>
          </div>
        </section>

        {/* Impact Section */}
        <section className="bg-green-50 rounded-xl p-8 space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">Ihre Wirkung</h3>
          <p className="text-gray-600 leading-relaxed">
            Als Freiwilliger werden Sie Teil einer Bewegung, die Technologie nachhaltiger und 
            zugänglicher macht. Ihr Beitrag hilft uns, Elektroschrott zu reduzieren, Technologie für 
            diejenigen bereitzustellen, die sie benötigen, und eine inklusivere digitale Zukunft für unsere Gemeinschaft aufzubauen.
          </p>
        </section>
      </div>
    </InvolvementPageLayout>
  )
} 