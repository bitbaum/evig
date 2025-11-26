'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import { HeroBanner } from '@/components/ui/hero-banner'
import Link from 'next/link'
import { ArrowRight, Filter, CheckCircle2, Calendar, Users, Code, Globe, Wrench } from 'lucide-react'

// Note: metadata export removed since this is now a client component
// const metadata: Metadata = {
//   title: 'Unsere Projekte',
//   description: 'Entdecken Sie unser vielfältiges Spektrum an Projekten, von Open-Source-Beiträgen bis hin zu Gemeinschaftsinitiativen und Hardware-Entwicklung.'
// }

const projects = [
  {
    title: 'Kivitendo Modus CH',
    description: 'Seit Juli 2015 ist revamp-it Premium-Partner des Kivitendo-Projekts. Ab 2005 suchten wir - zunächst für unsere eigenen Zwecke, aber bald darauf zur Befriedigung der Bedürfnisse unserer Kunden - nach einer Software-Lösung für Buchhaltung, Ressourcen- und Kundenverwaltung.',
    readMoreLink: '/projects/kivitendo',
    icon: Code,
    category: 'Software-Projekte',
    status: 'Aktiv',
    year: '2015',
    features: [
      'Premium-Partnerschaft seit 2015',
      'Buchhaltung und Ressourcenverwaltung',
      'Kundenverwaltung',
      'Open-Source ERP-System'
    ]
  },
  {
    title: 'Verein Linuxola',
    description: 'Der Verein Linuxola wurde am 2. Dezember 2005 von acht Personen aus verschiedenen Regionen der Schweiz gegründet. Der Zweck der Organisation ist es, unseren Partnern in Afrika Zugang zu Informationstechnologie und eine Verbindung zu den globalen digitalen Gemeingütern zu bieten.',
    readMoreLink: '/projects/linuxola',
    icon: Globe,
    category: 'Community-Projekte',
    status: 'Aktiv',
    year: '2005',
    features: [
      'Schweizer Gründung mit 8 Personen',
      'Fokus auf Afrika-Partnerschaften',
      'Zugang zu Informationstechnologie',
      'Verbindung zu digitalen Gemeingütern'
    ]
  },
  {
    title: 'FreieComputer.ch',
    description: 'Das Schweizer Label für Computer mit vorinstallierter freier Software und garantiertem Support! revamp-it hat zusammen mit der Unterstützung der engagierten Open-Source-Gemeinschaft zur Entstehung dieses Labels beigetragen.',
    readMoreLink: '/projects/freiecomputer',
    icon: CheckCircle2,
    category: 'Community-Projekte',
    status: 'Aktiv',
    year: '2010',
    features: [
      'Schweizer Label für freie Software',
      'Vorinstallierte Open-Source-Software',
      'Garantierter Support',
      'Community-Unterstützung'
    ]
  },
  {
    title: 'Compirat',
    description: 'Compirat ist eine Zusammenarbeit zwischen Caritas Zürich und revamp-it. Dank der Unterstützung von Compirat erhalten Menschen mit begrenzten Mitteln im Kanton Zürich die Möglichkeit, das Arbeiten mit Computern in der Nähe ihres Wohnorts zu erlernen.',
    readMoreLink: '/projects/compirat',
    icon: Users,
    category: 'Community-Projekte',
    status: 'Aktiv',
    year: '2018',
    features: [
      'Partnerschaft mit Caritas Zürich',
      'Unterstützung für Menschen mit begrenzten Mitteln',
      'Computer-Schulungen im Kanton Zürich',
      'Wohnortnahe Lernmöglichkeiten'
    ]
  },
  {
    title: 'Hardware-Entwicklung',
    description: 'Die Hardware-Entwicklungsarbeit bei revamp-it konzentriert sich darauf, neue Möglichkeiten stillgelegter Computer-Hardware zu entdecken, Energie- und Ressourcenverbrauch zu optimieren und Anleitungen für den Zusammenbau von Open-Source-Hardware zu erstellen.',
    readMoreLink: '/projects/hardware',
    icon: Wrench,
    category: 'Hardware-Projekte',
    status: 'Laufend',
    year: '2020',
    features: [
      'Upcycling stillgelegter Hardware',
      'Energie- und Ressourcenoptimierung',
      'Open-Source-Hardware-Anleitungen',
      'Nachhaltige Entwicklung'
    ]
  },
  {
    title: 'LTSP - Linux Terminal Server Project',
    description: 'Das Linux Terminal Server Project konzentriert sich darauf, die Leistung eines schnellen, leistungsstarken Servers zu nutzen, der über ein Netzwerk mit älteren, langsameren Computern verbunden ist. Dies ermöglicht es mehreren Benutzern, gleichzeitig an ihren Clients zu arbeiten, die mit demselben Server verbunden sind.',
    readMoreLink: '/projects/ltsp',
    icon: Code,
    category: 'Software-Projekte',
    status: 'Aktiv',
    year: '2016',
    features: [
      'Netzwerk-basierte Serverlösung',
      'Effiziente Nutzung älterer Hardware',
      'Multi-User-Computing',
      'Ressourcenoptimierung'
    ]
  }
]

// Get unique categories for filtering
const getUniqueCategories = () => {
  const categoryOrder = ['Alle', 'Software-Projekte', 'Hardware-Projekte', 'Community-Projekte']
  const categories = projects.map(project => project.category)
  const uniqueCategories = Array.from(new Set(categories))
  
  return categoryOrder.filter(cat => cat === 'Alle' || uniqueCategories.includes(cat))
}

export default function ProjectsPage() {
  const [selectedCategory, setSelectedCategory] = useState('Alle')
  const categories = getUniqueCategories()
  
  const filteredProjects = selectedCategory === 'Alle' 
    ? projects 
    : projects.filter(project => project.category === selectedCategory)

  const handleCategoryToggle = (category: string) => {
    setSelectedCategory(prev => prev === category ? 'Alle' : category)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <HeroBanner
        title="Unsere Projekte"
        description="Entdecken Sie unser vielfältiges Spektrum an Projekten, von Open-Source-Beiträgen bis hin zu Gemeinschaftsinitiativen und Hardware-Entwicklung."
      />

      {/* Projects Section with Filtering */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Unsere Projekte</h2>
            <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
              Von Open-Source-Software bis hin zu Community-Initiativen - entdecken Sie unsere vielfältigen Projekte.
            </p>
            
            {/* Project Filter */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12">
              <div className="flex items-center text-gray-500 mr-2 sm:mr-4 mb-2 w-full sm:w-auto justify-center sm:justify-start">
                <Filter className="w-4 h-4 mr-2" />
                <span className="text-xs sm:text-sm font-medium">Nach Kategorie filtern:</span>
              </div>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => category === 'Alle' ? setSelectedCategory(category) : handleCategoryToggle(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    selectedCategory === category
                      ? 'bg-green-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Grid with Animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProjects.map((project, index) => (
              <div 
                key={`${project.title}-${selectedCategory}`}
                className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full animate-fadeIn"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-6 sm:p-8 flex flex-col h-full">
                  <div className="flex items-start mb-4 sm:mb-6">
                    <div className="p-2 sm:p-3 bg-green-100 rounded-lg text-green-600 mr-3 sm:mr-4 transition-colors duration-300 group-hover:bg-green-600 group-hover:text-white flex-shrink-0">
                      <project.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-xl sm:text-2xl font-bold">{project.title}</h3>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {project.status}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-500 mb-3 sm:mb-4">
                        <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">Seit {project.year}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 flex-grow">{project.description}</p>
                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    {project.features.map((feature, i) => (
                      <div key={i} className="flex items-start text-gray-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0 text-green-500 mt-0.5" />
                        <span className="text-xs sm:text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-6 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-500">{project.category}</span>
                    <Link
                      href={project.readMoreLink}
                      className="inline-flex items-center text-green-600 hover:text-green-700 font-medium transition-colors duration-300 group"
                    >
                      <span>Mehr erfahren</span>
                      <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Results count */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              {filteredProjects.length} von {projects.length} Projekten
              {selectedCategory !== 'Alle' && ` in "${selectedCategory}"`}
            </p>
          </div>
        </div>
      </section>

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
      `}</style>
    </main>
  )
} 