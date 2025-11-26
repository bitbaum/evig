'use client'

import { Metadata } from 'next'
import { useState } from 'react'
import { 
  Globe, 
  Code, 
  Palette, 
  Smartphone, 
  Search, 
  Shield, 
  Zap, 
  Users, 
  CheckCircle2,
  ArrowRight,
  Monitor,
  Layers,
  Rocket,
  Heart,
  Database,
  Cloud,
  Filter
} from 'lucide-react'
import Link from 'next/link'

// Remove metadata export since this is now a client component
// export const metadata: Metadata = {
//   title: 'Webdesign & Entwicklung | RevampIT',
//   description: 'Professionelle Webdesign- und Entwicklungsdienstleistungen mit Open-Source-Technologien. Moderne, responsive Websites, die auf Nachhaltigkeit und Leistung ausgelegt sind.',
//   openGraph: {
//     title: 'Webdesign & Entwicklung | RevampIT',
//     description: 'Professionelle Webdesign- und Entwicklungsdienstleistungen mit Open-Source-Technologien. Moderne, responsive Websites, die auf Nachhaltigkeit und Leistung ausgelegt sind.',
//     type: 'website',
//     url: 'https://revampit.org/services/web-design-development',
//   },
// }

const benefits = [
  {
    title: 'Automatisierungs-First-Design',
    description: 'Wir priorisieren automatisierte Arbeitsabläufe, die den manuellen Verwaltungsaufwand minimieren und gleichzeitig alle unsere Grundprinzipien beibehalten. Maximale Effizienz ohne Kompromisse.',
    icon: Zap
  },
  {
    title: 'Open-Source-Grundlage',
    description: 'Aufgebaut auf transparenten, überprüfbaren Technologien, die Ihnen vollständige Kontrolle und Freiheit geben. Keine Anbieterbindung, keine proprietären Black Boxes.',
    icon: Code
  },
  {
    title: 'Nahtlose Benutzererfahrung',
    description: 'Intuitive Benutzeroberflächen, die von den Benutzern nur minimalen Aufwand erfordern und gleichzeitig maximale Funktionalität bieten. Jede Interaktion ist auf Einfachheit und Effektivität ausgelegt.',
    icon: Smartphone
  },
  {
    title: 'Entwicklerfreundliche Architektur',
    description: 'Sauberer, wartbarer Code mit ausgezeichneter Dokumentation und Tools. Gebaut für langfristige Nachhaltigkeit und einfache Wartung.',
    icon: Search
  }
]

const technologies = [
  {
    name: 'Next.js & React',
    description: 'Modernes React-Framework zum Erstellen schneller, skalierbarer Webanwendungen mit hervorragender Entwicklererfahrung und integrierter Optimierung.',
    icon: Code,
    category: 'Frontend',
    benefits: ['Serverseitiges Rendering', 'Hervorragende Leistung', 'Grossartiges SEO', 'Aktive Community'],
    url: 'https://nextjs.org'
  },
  {
    name: 'Tailwind CSS',
    description: 'Utility-First-CSS-Framework zum schnellen Erstellen moderner, responsiver Benutzeroberflächen mit konsistentem Design.',
    icon: Palette,
    category: 'Frontend',
    benefits: ['Schnelle Entwicklung', 'Konsistentes Design', 'Standardmässig responsiv', 'Sehr anpassbar'],
    url: 'https://tailwindcss.com'
  },
  {
    name: 'Supabase',
    description: 'Open-Source-Firebase-Alternative, die sofortige APIs, Echtzeit-Abonnements, Authentifizierung und Edge-Funktionen bietet.',
    icon: Database,
    category: 'Backend',
    benefits: ['Sofortige APIs', 'Echtzeit-Updates', 'Integrierte Authentifizierung', 'Edge-Funktionen'],
    url: 'https://supabase.com'
  },
  {
    name: 'Strapi',
    description: 'Führendes Open-Source-Headless-CMS, das Entwicklern die Freiheit gibt, ihre bevorzugten Tools und Frameworks zu wählen.',
    icon: Layers,
    category: 'CMS',
    benefits: ['API-First-Ansatz', 'Flexible Inhaltstypen', 'Entwicklerfreundlich', 'Selbst gehostet'],
    url: 'https://strapi.io'
  },
  {
    name: 'Payload CMS',
    description: 'TypeScript-First-Headless-CMS und Anwendungsframework, das mit Node.js, React und MongoDB erstellt wurde.',
    icon: Shield,
    category: 'CMS',
    benefits: ['TypeScript nativ', 'Admin-Benutzeroberfläche enthalten', 'Sehr erweiterbar', 'Fokus auf Entwicklererfahrung'],
    url: 'https://payloadcms.com'
  },
  {
    name: 'Tina CMS',
    description: 'Git-basiertes Headless-CMS, das die Bearbeitung von Inhalten direkt auf Ihrer Website mit visueller Echtzeitbearbeitung ermöglicht.',
    icon: Code,
    category: 'CMS',
    benefits: ['Visuelle Bearbeitung', 'Git-basierter Workflow', 'Echtzeit-Vorschau', 'Entwicklerfreundlich'],
    url: 'https://tina.io'
  },
  {
    name: 'WordPress',
    description: 'Ausgereiftes Content-Management-System, das für bestimmte Anwendungsfälle immer noch beliebt ist. Wir können mit bestehenden WordPress-Websites arbeiten.',
    icon: Globe,
    category: 'CMS',
    benefits: ['Grosses Ökosystem', 'Einfache Inhaltsverwaltung', 'Umfangreiche Plugins', 'Vielen Benutzern vertraut'],
    url: 'https://wordpress.org'
  },
  {
    name: 'Joomla',
    description: 'Flexibles Content-Management-System mit robuster Benutzerverwaltung und mehrsprachigen Funktionen. Ideal für komplexe Websites.',
    icon: Globe,
    category: 'CMS',
    benefits: ['Benutzerverwaltung', 'Mehrsprachige Unterstützung', 'Flexible Vorlagen', 'Starke Community'],
    url: 'https://www.joomla.org'
  },
  {
    name: 'Medusa.js',
    description: 'Moderne, quelloffene E-Commerce-Plattform für Entwickler. Headless Commerce mit leistungsstarken APIs und Anpassungsmöglichkeiten.',
    icon: Globe,
    category: 'E-Commerce',
    benefits: ['Headless-Architektur', 'Entwicklerfreundlich', 'Sehr anpassbar', 'Moderner Tech-Stack'],
    url: 'https://medusajs.com'
  },
  {
    name: 'Shopware 6',
    description: 'Moderne, API-First-E-Commerce-Plattform mit leistungsstarken Anpassungsmöglichkeiten. Open-Source-Kern mit kommerziellen Erweiterungen.',
    icon: Globe,
    category: 'E-Commerce',
    benefits: ['API-First-Design', 'Flexible Architektur', 'Umfangreiche Admin-Oberfläche', 'Deutsche Ingenieurskunst'],
    url: 'https://www.shopware.com'
  },
  {
    name: 'Bereitstellung & Hosting',
    description: 'Flexible Hosting-Optionen von Open-Source-Lösungen auf Linux-Servern bis hin zu modernen Plattformen wie Vercel und Netlify (proprietär, aber grosszügige kostenlose Stufen).',
    icon: Cloud,
    category: 'Infrastruktur',
    benefits: ['Mehrere Hosting-Optionen', 'Globales CDN', 'Automatische Skalierung', 'Git-basierter Workflow'],
    url: 'https://vercel.com'
  }
]

const services = [
  {
    title: 'Benutzerdefinierte Webentwicklung',
    description: 'Massgeschneiderte Webanwendungen, die mit modernen Open-Source-Technologien erstellt werden, um Ihre spezifischen Geschäftsanforderungen zu erfüllen.',
    icon: Code,
    features: [
      'Benutzerdefinierte Webanwendungen',
      'E-Commerce-Lösungen',
      'API-Entwicklung',
      'Datenbankdesign',
      'Leistungsoptimierung'
    ]
  },
  {
    title: 'Responsives Webdesign',
    description: 'Schöne, benutzerfreundliche Designs, die auf allen Geräten und Bildschirmgrössen perfekt funktionieren.',
    icon: Palette,
    features: [
      'Mobile-First-Design',
      'User Experience (UX) Design',
      'User Interface (UI) Design',
      'Integration der Markenidentität',
      'Barrierefreiheitskonformität'
    ]
  },
  {
    title: 'CMS-Entwicklung',
    description: 'Moderne Content-Management-Systeme, die Ihnen die volle Kontrolle über Ihre Website-Inhalte mit entwicklerfreundlichen APIs geben.',
    icon: Globe,
    features: [
      'Headless-CMS-Lösungen (Strapi, Payload, Tina)',
      'WordPress-Entwicklung (Legacy-Support)',
      'Benutzerdefinierte CMS-Lösungen',
      'Inhaltsmigration',
      'Schulung und Support'
    ]
  },
  {
    title: 'Website-Wartung',
    description: 'Laufender Support und Wartung, um Ihre Website sicher, aktuell und optimal leistungsfähig zu halten.',
    icon: Shield,
    features: [
      'Sicherheitsupdates',
      'Leistungsüberwachung',
      'Inhaltsaktualisierungen',
      'Backup-Management',
      'Technischer Support'
    ]
  }
]

const whyOpenSource = [
  {
    title: 'Sie besitzen Ihren Code',
    description: 'Das vollständige Eigentum am Quellcode Ihrer Website bedeutet keine Anbieterbindung, keine Lizenzbeschränkungen und völlige Freiheit, Ihre Website jederzeit zu ändern, zu erweitern oder zu migrieren.',
    icon: Code
  },
  {
    title: 'Sie besitzen Ihre Daten',
    description: 'Ihre Daten gehören Ihnen, nicht den Tech-Giganten. Wir entwickeln Lösungen, die Ihre Informationen unter Ihrer Kontrolle halten, mit Optionen für Self-Hosting und Datenportabilität.',
    icon: Database
  },
  {
    title: 'Datenschutz durch Design',
    description: 'Wir priorisieren den Datenschutz von Grund auf und implementieren minimales Tracking, sichere Authentifizierung und transparente Datenverarbeitungspraktiken, die die Privatsphäre Ihrer Benutzer respektieren.',
    icon: Shield
  },
  {
    title: 'Dezentrale Architektur',
    description: 'Lösen Sie sich von zentralisierten Plattformen, die Ihre Online-Präsenz kontrollieren. Wir entwickeln Lösungen, die überall gehostet werden können und Ihnen Unabhängigkeit von Big Tech geben.',
    icon: Globe
  },
  {
    title: 'Open-Source-Grundlage',
    description: 'Aufgebaut auf Open-Source-Technologien, die transparent, überprüfbar und von globalen Gemeinschaften unterstützt werden. Kein versteckter Code, keine proprietären Lock-ins.',
    icon: Heart
  },
  {
    title: 'Zukunftssicher & Nachhaltig',
    description: 'Open-Source-Technologien entwickeln sich mit der Community weiter und verschwinden nicht, wenn ein Unternehmen scheitert. Ihre Investition ist langfristig geschützt.',
    icon: Rocket
  }
]

// Get unique categories for filtering
const getUniqueCategories = () => {
  const categories = technologies.map(tech => tech.category)
  return ['Alle', ...Array.from(new Set(categories)).sort()]
}

export default function WebDesignDevelopmentPage() {
  const [selectedCategory, setSelectedCategory] = useState('Alle')
  const categories = getUniqueCategories()
  
  const filteredTechnologies = selectedCategory === 'Alle' 
    ? technologies 
    : technologies.filter(tech => tech.category === selectedCategory)

  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">Webdesign & Entwicklung</h1>
            <p className="text-base sm:text-lg md:text-xl text-green-100 mb-6 sm:mb-8">
              <strong>100% Engagement für Freiheit</strong> durch Open Source, Dezentralisierung, Datenschutz, Dateneigentum, Code-Eigentum und maximale Automatisierung.
              Wir schaffen digitale Erlebnisse, bei denen <strong>Anstrengung zur Wahl und nicht zur Notwendigkeit wird</strong> – und geben Ihnen die vollständige Kontrolle über Ihre digitale Präsenz.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/contact"
                className="inline-block bg-white text-green-800 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-sm sm:text-base md:text-lg"
              >
                Starten Sie Ihr Projekt
              </Link>
              <Link
                href="#services"
                className="inline-block border-2 border-white text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-sm sm:text-base md:text-lg"
              >
                Dienstleistungen entdecken
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section - New dedicated section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-800">Unsere Grundwerte</h2>
            <p className="text-xl text-gray-600 mb-8">
              Jede von uns erstellte Website dient einem ultimativen Ziel: <strong>Ihrer Freiheit</strong>. Jedes Prinzip arbeitet zusammen, um Anstrengung von Notwendigkeit in Wahl zu verwandeln.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-xl border-l-4 border-green-500 hover:shadow-2xl transition-shadow duration-300">
              <div className="text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Code className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-green-800">Open Source</h3>
                <p className="text-gray-600 text-sm">
                  Transparenter, überprüfbarer Code, den Sie vollständig einsehen, ändern und besitzen können.
                  Keine proprietären Black Boxes oder Anbieterbindungen.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-xl border-l-4 border-blue-500 hover:shadow-2xl transition-shadow duration-300">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Globe className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-blue-800">Dezentralisierung</h3>
                <p className="text-gray-600 text-sm">
                  Befreien Sie sich von Big-Tech-Plattformen. Hosten Sie Ihre Website überall,
                  bewahren Sie Ihre Unabhängigkeit und vermeiden Sie einzelne Ausfallpunkte.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-xl border-l-4 border-purple-500 hover:shadow-2xl transition-shadow duration-300">
              <div className="text-center">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-purple-800">Datenschutz zuerst</h3>
                <p className="text-gray-600 text-sm">
                  Minimales Tracking, sichere Authentifizierung und transparente Datenverarbeitung.
                  Die Privatsphäre Ihrer Benutzer wird durch Design geschützt, nicht als nachträglicher Gedanke.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-xl border-l-4 border-orange-500 hover:shadow-2xl transition-shadow duration-300">
              <div className="text-center">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Database className="w-7 h-7 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-orange-800">Besitzen Sie Ihre Daten</h3>
                <p className="text-gray-600 text-sm">
                  Ihre Daten gehören Ihnen, nicht den Tech-Giganten. Volle Kontrolle darüber,
                  wo sie gespeichert werden, wie sie verwendet werden und wer darauf zugreift.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-xl border-l-4 border-teal-500 hover:shadow-2xl transition-shadow duration-300">
              <div className="text-center">
                <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Heart className="w-7 h-7 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-teal-800">Besitzen Sie Ihren Code</h3>
                <p className="text-gray-600 text-sm">
                  Vollständiges Eigentum am Quellcode Ihrer Website. Ändern, erweitern
                  oder migrieren Sie jederzeit ohne Einschränkungen oder Lizenzgebühren.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-xl border-l-4 border-rose-500 hover:shadow-2xl transition-shadow duration-300">
              <div className="text-center">
                <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-7 h-7 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-rose-800">Maximale Automatisierung</h3>
                <p className="text-gray-600 text-sm">
                  Nahtlose automatisierte Arbeitsabläufe, die den manuellen Aufwand minimieren und gleichzeitig
                  alle unsere Grundprinzipien beibehalten. 100% Automatisierung ist unser Ziel.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-xl border-l-4 border-indigo-500 hover:shadow-2xl transition-shadow duration-300">
              <div className="text-center">
                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-indigo-800">Benutzererfahrung</h3>
                <p className="text-gray-600 text-sm">
                  Intuitive Benutzeroberflächen, die von den Benutzern nur minimalen Aufwand erfordern und gleichzeitig
                  maximale Funktionalität und Produktivität bieten.
                </p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-xl border-l-4 border-cyan-500 hover:shadow-2xl transition-shadow duration-300">
              <div className="text-center">
                <div className="w-14 h-14 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Monitor className="w-7 h-7 text-cyan-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-cyan-800">Entwicklererfahrung</h3>
                <p className="text-gray-600 text-sm">
                  Sauberer, wartbarer Code mit ausgezeichneten Tools und Dokumentationen,
                  die die Entwicklung und Wartung zu einem Vergnügen machen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Automation Philosophy Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-6">Unsere Freiheits-First-Philosophie</h2>
              <p className="text-lg text-gray-600 mb-4">
                Wir glauben an <strong>100% Engagement für Freiheit</strong> durch maximale Automatisierung.
              </p>
              <p className="text-base text-gray-500">
                Wenn Automatisierung unerwünschten Aufwand minimiert, verwandelt sie Anstrengung von Notwendigkeit in Wahl – und Wahl ist Freiheit.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-6 text-gray-800">Anstrengung als Wahl, nicht als Notwendigkeit</h3>
                <div className="space-y-6 text-gray-600">
                  <div className="border-l-4 border-green-500 pl-4">
                    <p className="font-semibold text-green-800 mb-2">Das Freiheitsprinzip</p>
                    <p>
                      <strong>100% Engagement für Freiheit</strong> bedeutet, dass jeder Aspekt Ihrer digitalen Präsenz Ihrer Autonomie dienen und sie nicht einschränken sollte.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-blue-500 pl-4">
                    <p className="font-semibold text-blue-800 mb-2">Automatisierung als Befreiung</p>
                    <p>
                      Maximale Automatisierung eliminiert sich wiederholende, unerwünschte Aufgaben und gibt Ihnen die Freiheit, sich auf das zu konzentrieren, was Ihnen und Ihrer Mission wirklich wichtig ist.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4">
                    <p className="font-semibold text-purple-800 mb-2">Wahl statt Zwang</p>
                    <p>
                      Wenn Systeme nahtlos ohne Ihr ständiges Eingreifen funktionieren, wird jeder Moment, den Sie aufwenden, beabsichtigt – eine Wahl, keine Notwendigkeit.
                    </p>
                  </div>
                  
                  <p className="italic text-gray-500 text-sm mt-6">
                    "Wahre Freiheit ist nicht nur die Fähigkeit zu wählen – es sind Systeme, die Ihr Recht auf Wahl bewahren, indem sie erzwungenen Aufwand beseitigen."
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8">
                <h4 className="text-xl font-bold mb-4 text-gray-800">Unser Freiheits-Bewertungssystem</h4>
                <p className="text-gray-600 mb-4">
                  Jede von uns erstellte Website und Web-App erhält eine umfassende Freiheitsbewertung, die darauf basiert, wie gut sie Ihre Autonomie unterstützt:
                </p>
                <div className="space-y-3">
                  {[
                    { label: 'Open-Source-Freiheit', color: 'bg-green-500', desc: 'Vollständige Code-Transparenz & Eigentum' },
                    { label: 'Dezentralisierungsfreiheit', color: 'bg-blue-500', desc: 'Unabhängigkeit von Plattformkontrolle' },
                    { label: 'Datenschutzfreiheit', color: 'bg-purple-500', desc: 'Datensouveränität & Schutz' },
                    { label: 'Dateneigentumsfreiheit', color: 'bg-orange-500', desc: 'Vollständige Kontrolle über Ihre Informationen' },
                    { label: 'Code-Eigentumsfreiheit', color: 'bg-teal-500', desc: 'Uneingeschränkte Änderungsrechte' },
                    { label: 'Automatisierungsfreiheit', color: 'bg-rose-500', desc: 'Anstrengung in Wahl verwandelt' },
                    { label: 'Benutzererfahrungsfreiheit', color: 'bg-indigo-500', desc: 'Intuitive, mühelose Interaktion' },
                    { label: 'Entwicklerfreiheit', color: 'bg-cyan-500', desc: 'Wartbare, erweiterbare Systeme' }
                  ].map((item, index) => (
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

      {/* Services & Pricing Section */}
      <section id="services" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Unsere Webentwicklungsdienste</h2>
            <p className="text-lg text-gray-600 mb-4">
              Umfassende Weblösungen, die mit Open-Source-Technologien und nachhaltigen Praktiken erstellt werden.
            </p>
            <div className="text-green-600 font-semibold text-xl mb-8">
              Professionelle Webentwicklung ab CHF 70/Stunde
            </div>
            <div className="bg-green-50 rounded-lg p-6 text-left">
              <h3 className="font-semibold text-green-800 mb-2">Kostenlose Erstberatung</h3>
              <p className="text-green-700">
                Wir beginnen jedes Projekt mit einer umfassenden Beratung, um Ihre Bedürfnisse,
                Ziele und technischen Anforderungen zu verstehen. Dies hilft uns, genaue Schätzungen zu liefern und
                sicherzustellen, dass wir die richtige Lösung für Ihr Projekt sind.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start mb-6">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                    <service.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-4">{service.description}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {service.features.map((feature, i) => (
                    <div key={i} className="flex items-center text-gray-600">
                      <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Open Source Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Warum diese Werte wichtig sind</h2>
            <p className="text-lg text-gray-600">
              In einer Ära zunehmender digitaler Überwachung und Plattformmonopole
              sind diese Prinzipien nicht nur "nice-to-haves" – sie sind für die digitale Freiheit und Unabhängigkeit unerlässlich.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {whyOpenSource.map((reason, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                    <reason.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold">{reason.title}</h3>
                </div>
                <p className="text-gray-600">{reason.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies Section with Filtering */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-6">Technologien, die wir verwenden</h2>
            <p className="text-lg text-gray-600 mb-8">
              Wir arbeiten mit bewährten Open-Source-Technologien, die Zuverlässigkeit,
              Leistung und langfristige Nachhaltigkeit bieten.
            </p>
            
            {/* Technology Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              <div className="flex items-center text-gray-500 mr-4 mb-2">
                <Filter className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Nach Kategorie filtern:</span>
              </div>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
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

          {/* Technologies Grid with Animation */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTechnologies.map((tech, index) => (
              <a 
                key={`${tech.name}-${selectedCategory}`}
                href={tech.url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fadeIn block group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start mb-4">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4 flex-shrink-0 group-hover:bg-green-200 transition-colors duration-300">
                    <tech.icon className="w-8 h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-green-600 font-semibold mb-1 truncate">{tech.category}</div>
                    <h3 className="text-xl font-bold mb-2 line-clamp-2 group-hover:text-green-700 transition-colors duration-300">{tech.name}</h3>
                  </div>
                </div>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">{tech.description}</p>
                <div className="space-y-2">
                  {tech.benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="truncate">{benefit}</span>
                    </div>
                  ))}
                </div>
                
                {/* Link indicator */}
                <div className="mt-4 pt-3 border-t border-gray-200 flex items-center text-sm text-green-600 group-hover:text-green-700 transition-colors duration-300">
                  <ArrowRight className="w-4 h-4 mr-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                  <span>Website besuchen</span>
                </div>
              </a>
            ))}
          </div>

          {/* Results count */}
          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              Zeige {filteredTechnologies.length} von {technologies.length} Technologien
              {selectedCategory !== 'Alle' && ` in "${selectedCategory}"`}
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Warum unsere Webentwicklungsdienste wählen?</h2>
            <p className="text-lg text-gray-600">
              Wir kombinieren technisches Fachwissen mit nachhaltigen Praktiken, um Websites zu liefern,
              die hervorragend funktionieren und gleichzeitig Ihre Werte unterstützen.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                    <benefit.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Unser Entwicklungsprozess</h2>
            <p className="text-lg text-gray-600">
              Wir verfolgen einen kollaborativen, transparenten Prozess, der sicherstellt, dass Ihr Projekt
              Ihren Bedürfnissen entspricht und Ihre Erwartungen übertrifft.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Entdeckung',
                description: 'Wir beginnen mit einer umfassenden Beratung, um Ihre Ziele, Anforderungen und Zielgruppe zu verstehen.'
              },
              {
                step: '02',
                title: 'Planung',
                description: 'Wir erstellen einen detaillierten Projektplan, einschliesslich Zeitplan, Technologie-Stack und Designansatz.'
              },
              {
                step: '03',
                title: 'Entwicklung',
                description: 'Wir erstellen Ihre Website nach agiler Methodik mit regelmässigen Updates und Feedback-Sitzungen.'
              },
              {
                step: '04',
                title: 'Start & Support',
                description: 'Wir starten Ihre Website und bieten laufenden Support, Wartung und Optimierung.'
              }
            ].map((phase, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {phase.step}
                </div>
                <h3 className="text-xl font-bold mb-3">{phase.title}</h3>
                <p className="text-gray-600">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Bereit, Ihre Website zu erstellen?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
            Lassen Sie uns eine Website erstellen, die Ihre Werte widerspiegelt und Ihre Ziele erreicht.
            Kontaktieren Sie uns noch heute für eine kostenlose Beratung.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
            >
              Starten Sie Ihr Projekt
            </Link>
            <Link
              href="/services"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
            >
              Alle Dienstleistungen entdecken
            </Link>
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
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  )
}