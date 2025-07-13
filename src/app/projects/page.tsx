import { Metadata } from 'next'
import { HeroBanner } from '@/components/ui/hero-banner'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Unsere Projekte',
  description: 'Entdecken Sie unser vielfältiges Spektrum an Projekten, von Open-Source-Beiträgen bis hin zu Gemeinschaftsinitiativen und Hardware-Entwicklung.'
}

const projects = [
  {
    title: 'Kivitendo Modus CH',
    description: 'Seit Juli 2015 ist revamp-it Premium-Partner des Kivitendo-Projekts. Ab 2005 suchten wir - zunächst für unsere eigenen Zwecke, aber bald darauf zur Befriedigung der Bedürfnisse unserer Kunden - nach einer Software-Lösung für Buchhaltung, Ressourcen- und Kundenverwaltung.',
    readMoreLink: '/projects/kivitendo',
    icon: '📊'
  },
  {
    title: 'Verein Linuxola',
    description: 'Der Verein Linuxola wurde am 2. Dezember 2005 von acht Personen aus verschiedenen Regionen der Schweiz gegründet. Der Zweck der Organisation ist es, unseren Partnern in Afrika Zugang zu Informationstechnologie und eine Verbindung zu den globalen digitalen Gemeingütern zu bieten.',
    readMoreLink: '/projects/linuxola',
    icon: '🌍'
  },
  {
    title: 'FreieComputer.ch',
    description: 'Das Schweizer Label für Computer mit vorinstallierter freier Software und garantiertem Support! revamp-it hat zusammen mit der Unterstützung der engagierten Open-Source-Gemeinschaft zur Entstehung dieses Labels beigetragen.',
    readMoreLink: '/projects/freiecomputer',
    icon: '💻'
  },
  {
    title: 'Compirat',
    description: 'Compirat ist eine Zusammenarbeit zwischen Caritas Zürich und revamp-it. Dank der Unterstützung von Compirat erhalten Menschen mit begrenzten Mitteln im Kanton Zürich die Möglichkeit, das Arbeiten mit Computern in der Nähe ihres Wohnorts zu erlernen.',
    readMoreLink: '/projects/compirat',
    icon: '👥'
  },
  {
    title: 'Hardware-Entwicklung',
    description: 'Die Hardware-Entwicklungsarbeit bei revamp-it konzentriert sich darauf, neue Möglichkeiten stillgelegter Computer-Hardware zu entdecken, Energie- und Ressourcenverbrauch zu optimieren und Anleitungen für den Zusammenbau von Open-Source-Hardware zu erstellen.',
    readMoreLink: '/projects/hardware',
    icon: '🔧'
  },
  {
    title: 'LTSP - Linux Terminal Server Project',
    description: 'Das Linux Terminal Server Project konzentriert sich darauf, die Leistung eines schnellen, leistungsstarken Servers zu nutzen, der über ein Netzwerk mit älteren, langsameren Computern verbunden ist. Dies ermöglicht es mehreren Benutzern, gleichzeitig an ihren Clients zu arbeiten, die mit demselben Server verbunden sind.',
    readMoreLink: '/projects/ltsp',
    icon: '🖥️'
  }
]

export default function ProjectsPage() {
  return (
    <main className="min-h-screen">
      <HeroBanner
        title="Unsere Projekte"
        description="Entdecken Sie unser vielfältiges Spektrum an Projekten, von Open-Source-Beiträgen bis hin zu Gemeinschaftsinitiativen und Hardware-Entwicklung."
      />

      {/* Projects Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-4xl mb-4">{project.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{project.title}</h3>
                <p className="text-gray-600 mb-4">{project.description}</p>
                <Link 
                  href={project.readMoreLink}
                  className="text-green-600 hover:text-green-800 font-semibold inline-flex items-center"
                >
                  Mehr lesen
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
} 