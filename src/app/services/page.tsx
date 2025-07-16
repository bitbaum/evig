'use client'

import { useState } from 'react'
import { 
  Wrench, 
  HardDrive, 
  Server, 
  Shield, 
  ArrowRight,
  CheckCircle2,
  Zap,
  Clock,
  ShieldCheck,
  Code,
  Globe,
  Brain,
  Filter,
  Monitor,
  Cloud,
  Cpu,
  Settings
} from 'lucide-react'
import Link from 'next/link'

const services = [
  // Hardware Services
  {
    title: 'Computerreparatur & Aufrüstungen',
    description: 'Expertenreparaturen für alle Arten von Computern und Komponenten. Wir spezialisieren uns darauf zu reparieren, was andere nicht koennen, einschliesslich Motherboard-Reparaturen und Bauteil-Level-Fixes.',
    icon: Wrench,
    category: 'Hardware-Dienstleistungen',
    features: [
      'Bauteil-Level-Reparaturen',
      'Hardware-Aufrüstungen',
      'Diagnosedienste',
      'Professionelle Bewertung'
    ],
    pricing: 'CHF 70/hour + parts',
    highlight: 'Professional assessment required',
    href: '/services/computer-repair-upgrades',
    available: true
  },
  {
    title: 'Datenrettung & Transfer',
    description: 'Sichere und zuverlässige Datentransferdienste für alle Arten von Speichermedien. Wir können Daten von beschädigten Geräten wiederherstellen und auf moderne Speicherlösungen übertragen.',
    icon: HardDrive,
    category: 'Hardware-Dienstleistungen',
    features: [
      'Sicherer Datentransfer',
      'Datenwiederherstellung von beschädigten Geräten',
      'Unterstützung für Legacy-Medien (Disketten, ZIP-Laufwerke, MO-Laufwerke, SCSI/IDE-Laufwerke)',
      'Komplette Datensicherheit'
    ],
    pricing: 'CHF 70/hour',
    highlight: 'Evaluation required before recovery',
    href: '/services/data-recovery-transfer',
    available: true
  },
  {
    title: 'Hardware-Recycling',
    description: 'Verantwortungsvolles Recycling und Aufbereitung von IT-Geräten. Wir geben Ihren alten Geräten ein neues Leben und sorgen für sichere Datenlöschung.',
    icon: Shield,
    category: 'Hardware-Dienstleistungen',
    features: [
      'Sichere Datenlöschung',
      'Geräteaufbereitung',
      'Komponenten-Recycling',
      'Kostenloser Abholservice'
    ],
    pricing: 'Free for most items',
    highlight: 'Free pickup service available',
    href: '/services/hardware-recycling',
    available: true
  },

  // Software Solutions
  {
    title: 'Webdesign & Entwicklung',
    description: 'Professionelle Webdesign- und Entwicklungsdienstleistungen mit modernen Open-Source-Technologien. Schnelle, responsive Websites mit Next.js, Headless CMS und nachhaltigen Praktiken.',
    icon: Globe,
    category: 'Software-Lösungen',
    features: [
      'Moderne Frameworks (Next.js, React)',
      'Headless CMS (Strapi, Payload, Tina)',
      'Responsive Design & Tailwind CSS',
      'E-Commerce-Lösungen (Medusa.js, Shopware 6)',
      'SEO-Optimierung & Performance'
    ],
    pricing: 'CHF 70/hour',
    highlight: 'Free initial consultation',
    href: '/services/web-design-development',
    available: true
  },
  {
    title: 'Linux & Open Source',
    description: 'Professionelle Linux-Installation, -Konfiguration und -Support-Dienstleistungen. Wir helfen Ihnen, das Beste aus Ihrem Linux-System mit fachkundiger Anleitung und Wartung herauszuholen.',
    icon: Server,
    category: 'Software-Lösungen',
    features: [
      'Linux-Installation & Konfiguration',
      'Systemoptimierung & Wartung',
      'Sicherheitshärtung',
      'Performance-Tuning'
    ],
    pricing: 'CHF 70/hour',
    highlight: 'Professional assessment required',
    href: '/services/linux-open-source',
    available: true
  },
  {
    title: 'Open Source Solutions',
    description: 'Fachkundige Implementierung und Support für Open-Source-Software. Wir helfen Ihnen beim Übergang zu und der Wartung von Open-Source-Lösungen für Ihre Geschäftsanforderungen.',
    icon: Code,
    category: 'Software-Lösungen',
    features: [
      'Open-Source-Beratung',
      'Maßgeschneiderte Entwicklung',
      'Community-Integration',
      'Sicherheit & Compliance'
    ],
    pricing: 'CHF 70/hour',
    highlight: 'Free initial consultation',
    href: '/services/open-source-solutions',
    available: true
  },

  // Coming Soon
  {
    title: 'Build Your Computer',
    description: 'Erhalten Sie einen maßgeschneiderten Computer für Ihre spezifischen Bedürfnisse, unterstützt durch KI-Analyse unseres umfangreichen Inventars. Wir beziehen Teile global und bieten professionelle Montage.',
    icon: Cpu,
    category: 'Bald verfügbar',
    features: [
      'KI-gestützte Build-Empfehlungen',
      'Globales Teile-Beschaffungsnetzwerk',
      'Professionelle Montage und Tests',
      'Qualitätsgarantie und Gewährleistung'
    ],
    pricing: '',
    highlight: 'Bald verfügbar',
    href: '/services/build-your-computer',
    available: false,
    badge: 'Soon'
  },
  {
    title: 'Enterprise AI Solutions',
    description: 'Private, vor-Ort KI-Systeme für professionelle Unternehmen. GPT-4-Level-Performance mit vollständigem Datenschutz und DSGVO-Compliance.',
    icon: Brain,
    category: 'Bald verfügbar',
    features: [
      'Selbstgehostete Llama 3 70B-Bereitstellung',
      'RAG-unterstützte Dokumentensuche',
      'Vollständiger Datenschutz & DSGVO-Compliance',
      'Maßgeschneiderte Schulung auf Ihren Dokumenten'
    ],
    pricing: '',
    highlight: 'Bald verfügbar',
    href: '/services/enterprise-ai-solutions',
    available: false,
    badge: 'Soon'
  },
  {
    title: 'Cloud Infrastructure',
    description: 'Nachhaltige Cloud-Hosting- und Infrastrukturlösungen. Wir bieten skalierbare, umweltfreundliche Hosting-Lösungen mit erneuerbarer Energie und Open-Source-Technologien.',
    icon: Cloud,
    category: 'Bald verfügbar',
    features: [
      'Hosting mit erneuerbarer Energie',
      'Open-Source-Infrastruktur',
      'Skalierbare Lösungen',
      'Professionelle Überwachung'
    ],
    pricing: '',
    highlight: 'Bald verfügbar',
    href: '/services/cloud-infrastructure',
    available: false,
    badge: 'Soon'
  },
  {
    title: 'Server Management',
    description: 'Professionelle Server-Setup- und Wartungsdienste. Wir verwalten Ihre Server, damit Sie sich auf Ihr Geschäft konzentrieren können.',
    icon: Monitor,
    category: 'Bald verfügbar',
    features: [
      'Server-Setup & Konfiguration',
      '24/7-Überwachung',
      'Sicherheitsverwaltung',
      'Performance-Optimierung'
    ],
    pricing: '',
    highlight: 'Bald verfügbar',
    href: '/services/server-management',
    available: false,
    badge: 'Soon'
  },
  {
    title: 'IoT Solutions',
    description: 'Internet-of-Things-Lösungen mit Open-Source-Hardware. Erstellen Sie vernetzte Geräte, die Ihre Privatsphäre und Dateneigentum respektieren.',
    icon: Settings,
    category: 'Bald verfügbar',
    features: [
      'Open-Source-Hardware',
      'Datenschutz-fokussiertes Design',
      'Maßgeschneiderte IoT-Entwicklung',
      'Dateneigentum garantiert'
    ],
    pricing: '',
    highlight: 'Bald verfügbar',
    href: '/services/iot-solutions',
    available: false,
    badge: 'Soon'
  }
]

// Get unique categories for filtering
const getUniqueCategories = () => {
  // Define the order we want: All, Hardware Services, Software Solutions, Coming Soon
  const categoryOrder = ['Alle', 'Hardware-Dienstleistungen', 'Software-Lösungen', 'Bald verfügbar']
  const categories = services.map(service => service.category)
  const uniqueCategories = Array.from(new Set(categories))
  
  // Return categories in the specified order
  return categoryOrder.filter(cat => cat === 'Alle' || uniqueCategories.includes(cat))
}

export default function ServicesPage() {
  const [selectedCategory, setSelectedCategory] = useState('Alle')
  const categories = getUniqueCategories()
  
  const filteredServices = selectedCategory === 'Alle' 
    ? services 
    : services.filter(service => service.category === selectedCategory)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Computer Repair & IT Services',
            'description': 'Professional computer repair, web development, data recovery, Linux support, and hardware recycling services.',
            'provider': {
              '@type': 'Organization',
              'name': 'RevampIT',
              'url': 'https://revampit.org',
              'logo': 'https://revampit.org/logo.png'
            },
            'serviceType': [
              'Computer Repair',
              'Web Design & Development',
              'Data Recovery',
              'Linux Support',
              'Hardware Recycling',
              'Open Source Solutions',
              'Enterprise AI Solutions'
            ],
            'areaServed': {
              '@type': 'City',
              'name': 'Your City'
            }
          })
        }}
      />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Experten-IT-Dienstleistungen</h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-green-200">Nachhaltige Lösungen für Ihre Technologiebedürfnisse</h2>
              <p className="text-xl text-green-100">Wir kombinieren technische Expertise mit Umweltverantwortung, um umfassende IT-Lösungen zu bieten, die Ihnen Geld sparen und Elektroschrott reduzieren.</p>
            </div>
          </div>
        </section>

        {/* Services Section with Filtering */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl font-bold mb-6">Unsere Dienstleistungen</h2>
              <p className="text-lg text-gray-600 mb-8">
                Die Reparaturdauer variiert je nach Teileverfügbarkeit und dauert in der Regel einige Wochen.
              </p>
              
              {/* Service Filter */}
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

            {/* Services Grid with Animation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredServices.map((service, index) => (
                <div 
                  key={`${service.title}-${selectedCategory}`}
                  className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full animate-fadeIn"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="p-8 flex flex-col h-full">
                    <div className="flex items-start mb-6">
                      <div className={`p-3 rounded-lg mr-4 transition-colors duration-300 ${
                        service.available 
                          ? 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <service.icon className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-2xl font-bold">{service.title}</h3>
                          {service.badge && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              {service.badge}
                            </span>
                          )}
                        </div>
                        <div className={`flex items-center font-semibold mb-4 ${
                          service.available ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          <Zap className="w-4 h-4 mr-2" />
                          <span>{service.highlight}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-6 flex-grow">{service.description}</p>
                    <div className="space-y-3 mb-6">
                      {service.features.map((feature, i) => (
                        <div key={i} className="flex items-center text-gray-600">
                          <CheckCircle2 className={`w-5 h-5 mr-3 flex-shrink-0 ${
                            service.available ? 'text-green-500' : 'text-gray-400'
                          }`} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto pt-6 border-t border-gray-200 flex items-center justify-between">
                      {service.pricing ? (
                        <span className={`text-lg font-semibold ${
                          service.available ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {service.pricing}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Pricing TBD</span>
                      )}
                      <Link
                        href={service.href}
                        className={`inline-flex items-center font-medium transition-colors duration-300 group ${
                          service.available 
                            ? 'text-green-600 hover:text-green-700' 
                            : 'text-gray-400 hover:text-gray-500'
                        }`}
                      >
                        <span>{service.available ? 'Details anzeigen' : 'Mehr erfahren'}</span>
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
                {filteredServices.length} von {services.length} Dienstleistungen
                {selectedCategory !== 'Alle' && ` in "${selectedCategory}"`}
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Bereit, Ihre Technologie zu erneuern?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">Kontaktieren Sie uns heute für eine kostenlose Beratung und entdecken Sie, wie wir Ihnen helfen können, das Beste aus Ihren Geräten herauszuholen.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                Kontaktieren Sie uns
              </Link>
              <Link
                href="https://www.revamp-it.ch/index.php/de/shop-de"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
              >
                Inventar durchsuchen
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
        `}</style>
      </main>
    </>
  )
} 