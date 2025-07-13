import { Metadata } from 'next'
import { 
  Terminal, 
  Shield, 
  Users, 
  Zap, 
  Code, 
  Server, 
  Laptop, 
  Download,
  Cpu,
  HardDrive,
  Globe,
  FileCode,
  ArrowRight,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Linux & Open Source | RevampIT',
  description: 'Experten-Linux-Installation, Support und Schulungsdienstleistungen. Entdecken Sie die perfekte Linux-Distribution für Ihre Bedürfnisse.'
}

const benefits = [
  {
    title: 'Sicherheit & Stabilität',
    description: 'Linux ist bekannt für seine robusten Sicherheitsfunktionen und Systemstabilität, was es ideal für den privaten und gewerblichen Einsatz macht.',
    icon: Shield
  },
  {
    title: 'Leistung',
    description: 'Effiziente Ressourcennutzung und optimierte Leistung, auch auf älterer Hardware, mit minimalen Systemanforderungen.',
    icon: Zap
  },
  {
    title: 'Anpassung',
    description: 'Vollständige Kontrolle über Ihr System mit unendlichen Anpassungsmöglichkeiten, um Ihren Workflow und Ihre Präferenzen zu entsprechen.',
    icon: Code
  },
  {
    title: 'Community-Support',
    description: 'Zugang zu einer grossen globalen Gemeinschaft von Benutzern und Entwicklern für Unterstützung, Dokumentation und kontinuierliche Verbesserung.',
    icon: Users
  }
]

const distributions = [
  {
    name: 'Ubuntu',
    description: 'Benutzerfreundliche Distribution, perfekt für Anfänger und Profis gleichermassen. Bietet eine polierte Desktop-Umgebung und ein umfangreiches Software-Repository.',
    icon: Laptop,
    useCases: ['Desktop-Computing', 'Entwicklung', 'Server-Bereitstellung'],
    pros: ['Einfach zu verwenden', 'Grosse Community', 'Regelmässige Updates', 'Umfangreiche Dokumentation'],
    cons: ['Etwas proprietäre Software', 'Schwerer als einige Alternativen'],
    website: 'https://ubuntu.com'
  },
  {
    name: 'Linux Mint',
    description: 'Basiert auf Ubuntu, bietet aber eine traditionellere Desktop-Erfahrung. Bekannt für seine Stabilität und Benutzerfreundlichkeit.',
    icon: Laptop,
    useCases: ['Desktop-Computing', 'Büroarbeit', 'Multimedia'],
    pros: ['Windows-ähnliche Oberfläche', 'Exzellente Hardware-Unterstützung', 'Stabil und zuverlässig', 'Grossartig für Anfänger'],
    cons: ['Seltener Updates', 'Begrenzte Enterprise-Funktionen'],
    website: 'https://linuxmint.com'
  },
  {
    name: 'Fedora',
    description: 'Hochmoderne Distribution, die die neuesten Open-Source-Technologien präsentiert. Unterstützt von Red Hat.',
    icon: Cpu,
    useCases: ['Entwicklung', 'Enterprise', 'Innovation'],
    pros: ['Neueste Software', 'Starke Sicherheit', 'Enterprise-bereit', 'Exzellente Entwicklungstools'],
    cons: ['Häufige Updates', 'Kürzere Support-Zyklen'],
    website: 'https://fedoraproject.org'
  },
  {
    name: 'Debian',
    description: 'Eine der stabilsten und zuverlässigsten Distributionen, die als Grundlage für viele andere Linux-Systeme dient.',
    icon: Server,
    useCases: ['Server', 'Enterprise', 'Stabile Systeme'],
    pros: ['Extrem stabil', 'Grosses Paket-Repository', 'Lange Support-Zyklen', 'Starke Sicherheit'],
    cons: ['Ältere Software-Versionen', 'Weniger benutzerfreundlich'],
    website: 'https://www.debian.org'
  },
  {
    name: 'MX Linux',
    description: 'Leichtgewichtige Distribution basierend auf Debian, bekannt für ihre exzellente Leistung und benutzerfreundliche Oberfläche.',
    icon: HardDrive,
    useCases: ['Ältere Hardware', 'Desktop-Computing', 'Ressourceneffizienz'],
    pros: ['Leichtgewichtig', 'Schnelle Leistung', 'Benutzerfreundlich', 'Stabile Basis'],
    cons: ['Kleinere Community', 'Begrenzte Enterprise-Funktionen'],
    website: 'https://mxlinux.org'
  }
]

const services = [
  {
    title: 'Linux-Installation',
    description: 'Professionelle Installation Ihrer gewählten Linux-Distribution mit vollständiger Hardware-Kompatibilitätsprüfung und Optimierung.',
    icon: Download
  },
  {
    title: 'Systemkonfiguration',
    description: 'Individuelle Konfiguration Ihres Linux-Systems entsprechend Ihren spezifischen Anforderungen und Workflow-Bedürfnissen.',
    icon: Terminal
  },
  {
    title: 'Schulung & Support',
    description: 'Umfassende Schulungsprogramme und laufende Unterstützung, um das Beste aus Ihrem Linux-System herauszuholen.',
    icon: Users
  },
  {
    title: 'Server-Setup',
    description: 'Enterprise-taugliche Linux-Server-Konfiguration und -Optimierung für Unternehmen und Organisationen.',
    icon: Server
  }
]

export default function LinuxPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Linux & Open Source</h1>
            <p className="text-xl text-green-100">
              Professionelle Linux-Installation, Support und Schulungsdienstleistungen. Finden Sie die perfekte Distribution für Ihre Bedürfnisse.
            </p>
            <div className="mt-8">
              <p className="text-green-200">
                Linux ist ein leistungsstarkes, sicheres und flexibles Betriebssystem, das alles von Personalcomputern bis hin zu Enterprise-Servern antreibt.
                <Link href="/services/open-source-solutions" className="inline-flex items-center text-white hover:text-green-200 ml-2">
                  Mehr über Open Source erfahren <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services & Pricing Section - Immediately after hero */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Unsere Linux-Dienstleistungen</h2>
            <p className="text-lg text-gray-600 mb-4">
              Umfassende Unterstützung für alle Ihre Linux-Bedürfnisse, von der Installation bis zur laufenden Wartung.
            </p>
            <div className="text-green-600 font-semibold text-xl mb-8">
              Professioneller Linux-Support ab CHF 70/Stunde
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                    <service.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-3">{service.title}</h3>
                    <p className="text-gray-600">{service.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Value Proposition Section */}
          <div className="mt-20">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold mb-6">Ihr Linux-Vorteil</h2>
              <p className="text-lg text-gray-600">
                Erhalten Sie Expertenunterstützung und maximieren Sie die Vorteile von Linux für Ihre Bedürfnisse.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-lg border-l-4 border-green-600">
                <h3 className="text-xl font-bold mb-4">Geld sparen</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Keine teuren Lizenzen oder Abonnements</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Verlängern Sie die Lebensdauer Ihrer vorhandenen Hardware</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Reduzieren Sie Wartungs- und Upgrade-Kosten</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-lg border-l-4 border-green-600">
                <h3 className="text-xl font-bold mb-4">Leistung steigern</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Schnellere Systemleistung auf jeder Hardware</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Optimiert für Ihre spezifischen Bedürfnisse</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Zuverlässiger und stabiler Betrieb</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-xl p-8 shadow-lg border-l-4 border-green-600">
                <h3 className="text-xl font-bold mb-4">Expertenunterstützung</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Professionelle Installation und Einrichtung</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Laufende technische Unterstützung</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Schulung und Dokumentation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Quick Contact CTA */}
          <div className="mt-12 bg-green-50 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Bereit loszulegen?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Wir bieten professionelle Linux-Unterstützung und -Lösungen für Unternehmen und Privatpersonen. Kontaktieren Sie uns für eine kostenlose Beratung.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
Beratung vereinbaren
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <Link
                href="tel:+41223334455"
                className="inline-flex items-center border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
Jetzt anrufen
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Warum Linux wählen?</h2>
            <p className="text-lg text-gray-600">
              Linux bietet überlegene Leistung, Sicherheit und Flexibilität im Vergleich zu anderen Betriebssystemen.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <benefit.icon className="w-6 h-6 text-green-600 mr-3" />
                  <h3 className="text-xl font-semibold">{benefit.title}</h3>
                </div>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Distributions Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Beliebte Linux-Distributionen</h2>
            <p className="text-lg text-gray-600">
              Jede Distribution hat ihre eigenen Stärken und ist für verschiedene Anwendungsfälle geeignet.
            </p>
          </div>
          <div className="space-y-8">
            {distributions.map((distro, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start mb-6">
                  <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                    <distro.icon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{distro.name}</h3>
                    <a 
                      href={distro.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-700 text-sm mb-4 inline-flex items-center"
                    >
                      Website besuchen <ArrowRight className="w-4 h-4 ml-1" />
                    </a>
                    <p className="text-gray-600 mb-4">{distro.description}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-2">Am besten für:</h4>
                        <ul className="space-y-2">
                          {distro.useCases.map((useCase, i) => (
                            <li key={i} className="flex items-start">
                              <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-gray-600">{useCase}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Vorteile:</h4>
                        <ul className="space-y-2">
                          {distro.pros.map((pro, i) => (
                            <li key={i} className="flex items-start">
                              <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-gray-600">{pro}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {distro.cons && distro.cons.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold mb-2">Berücksichtigungen:</h4>
                        <ul className="space-y-2">
                          {distro.cons.map((con, i) => (
                            <li key={i} className="flex items-start">
                              <div className="p-1 bg-red-100 rounded-full mr-3 mt-0.5">
                                <XCircle className="w-4 h-4 text-red-600" />
                              </div>
                              <span className="text-gray-600">{con}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Bereit für den Wechsel zu Linux?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
            Lassen Sie unsere Experten Ihnen dabei helfen, die perfekte Linux-Distribution für Ihre Bedürfnisse zu finden und einzurichten.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
            >
Loslegen
            </Link>
            <Link
              href="/services"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
            >
Dienstleistungen erkunden
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
} 