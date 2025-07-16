import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { 
  HardDrive, 
  Server, 
  Database, 
  Archive, 
  CheckCircle2, 
  Clock, 
  Zap,
  FolderInput,
  Disc,
  Globe,
  Code,
  Palette,
  Shield,
  LucideIcon
} from 'lucide-react'
import Link from 'next/link'

interface ServiceFeature {
  title: string
  description: string
  icon: LucideIcon
}

interface ServiceProcess {
  step: number
  title: string
  description: string
}

interface ServicePricing {
  base: string
  details: string[]
  mediaPrices?: string[]
}

interface ServiceHero {
  title: string
  subtitle: string
  description: string
}

interface ServiceDefinition {
  title: string
  description: string
  icon: LucideIcon
  hero: ServiceHero
  features: ServiceFeature[]
  pricing?: ServicePricing
  process?: ServiceProcess[]
}

const services: Record<string, ServiceDefinition> = {
  'computer-repair-upgrades': {
    title: 'Computerreparatur & Aufrüstungen',
    description: 'Expertenreparaturen für alle Arten von Computern und Komponenten. Wir spezialisieren uns darauf zu reparieren, was andere nicht können, einschließlich Motherboard-Reparaturen und Bauteil-Level-Fixes.',
    icon: HardDrive,
    hero: {
      title: 'Computerreparatur & Aufrüstungen',
      subtitle: 'Vertrauensvolle Expertenreparaturen',
      description: 'Wir kombinieren technische Expertise mit nachhaltigen Praktiken, um die Lebensdauer Ihrer Geräte zu verlängern. Unsere Reparaturdienste konzentrieren sich darauf zu reparieren, was andere nicht können, und sparen Ihnen Geld und reduzieren Elektroschrott.'
    },
    features: [
      {
        title: 'Bauteil-Level-Reparaturen',
        description: 'Wir ersetzen nicht nur Teile - wir reparieren sie. Unsere Techniker können Motherboards, Netzteile und andere Komponenten auf Schaltkreisebene reparieren.',
        icon: HardDrive
      },
      {
        title: 'Hardware-Aufrüstungen',
        description: 'Verlängern Sie die Lebensdauer Ihres Computers mit strategischen Aufrüstungen. Wir helfen Ihnen bei der Auswahl und Installation der richtigen Komponenten für Ihre Bedürfnisse.',
        icon: Zap
      },
      {
        title: 'Diagnosedienste',
        description: 'Umfassende Diagnose zur schnellen Identifizierung und Behebung von Problemen. Wir verwenden professionelle Werkzeuge und jahrelange Erfahrung, um Probleme genau zu lokalisieren.',
        icon: Database
        
      },
      {
        title: 'Professionelle Bewertung',
        description: 'Alle Reparaturen beginnen mit einer gründlichen Bewertung, um die beste Vorgehensweise zu bestimmen und einen genauen Kostenvoranschlag zu erstellen.',
        icon: Clock
      }
    ],
    pricing: {
      base: 'CHF 70/Stunde + Teile',
      details: [
        'Professionelle Bewertung erforderlich',
        'Bauteil-Level-Reparaturen',
        'Hardware-Aufrüstungen verfügbar',
        'Qualitätsgarantie inbegriffen'
      ]
    },
    process: [
      {
        step: 1,
        title: 'Bewertung',
        description: 'Wir untersuchen Ihr Gerät und erstellen eine detaillierte Bewertung des Problems. Die CHF 30 Bewertungsgebühr wird in Ihre endgültigen Reparaturkosten einbezogen.'
      },
      {
        step: 2,
        title: 'Kostenvoranschlag',
        description: 'Sie erhalten einen transparenten Kostenvoranschlag für die Reparatur, einschließlich Teile- und Arbeitskosten.'
      },
      {
        step: 3,
        title: 'Reparatur',
        description: 'Unsere Techniker reparieren Ihr Gerät mit hochwertigen Teilen. Die typische Reparaturzeit beträgt einige Wochen aufgrund der Teileverfügbarkeit.'
      },
      {
        step: 4,
        title: 'Testen',
        description: 'Wir testen alle Reparaturen gründlich, um sicherzustellen, dass Ihr Gerät perfekt funktioniert, bevor es zurückgegeben wird.'
      }
    ]
  },
  'data-recovery-transfer': {
    title: 'Datenrettung & Transfer',
    description: 'Professionelle Datenübertragung und Wiederherstellungsdienste für alle Arten von Speichermedien. Wir helfen Ihnen dabei, Ihre wertvollen Daten von jedem Gerät oder Format zu erreichen und zu übertragen.',
    icon: HardDrive,
    hero: {
      title: 'Datenrettung & Transfer',
      subtitle: 'Zugang zu Ihren Daten, Bewahrung Ihrer Geschichte',
      description: 'Ob Sie Daten von einem nicht funktionierenden Gerät wiederherstellen, Daten zwischen Computern übertragen oder auf Daten von alten Speichermedien zugreifen müssen - wir haben die Expertise und Ausrüstung, um zu helfen.'
    },
    features: [
      {
        title: 'Medienunterstützung',
        description: 'Unser Dino-Server verfügt über 14 frontzugängliche Laufwerke und mehrere Schnittstellen, bereit für fast jede Datenübertragungsaufgabe.',
        icon: Server
      },
      {
        title: 'Datenübertragung',
        description: 'Übertragen Sie Daten zwischen Computern, migrieren Sie Einstellungen oder erstellen Sie Backups. Wir können große Datenmengen effizient verarbeiten.',
        icon: FolderInput
      },
      {
        title: 'Zugang zu alten Medien',
        description: 'Zugang zu Daten von jedem Speichermedium, auch wenn Sie das erforderliche Laufwerk nicht mehr haben. Wir unterstützen alle Formate einschließlich Disketten, ZIP-Laufwerke, MO-Laufwerke und mehr.',
        icon: Disc
      },
      {
        title: 'Maßgeschneiderte Lösungen',
        description: 'Benötigen Sie eine ähnliche Server-Einrichtung für Ihren Standort? Wir können eine maßgeschneiderte Lösung erstellen, die auf Ihre spezifischen Bedürfnisse zugeschnitten ist.',
        icon: Database
      }
    ],
    pricing: {
      base: 'CHF 30 pro Auftrag + Medienkosten',
      details: [
        'Grundgebühr: CHF 30 pro Auftrag',
        'Medienkosten zusätzlich, falls nicht bereitgestellt',
        'Unterstützung für alte Medien verfügbar',
        'Maßgeschneiderte Lösungen auf Anfrage'
      ],
      mediaPrices: [
        'Disketten (3.5" und 5.25"): CHF 10 pro Diskette',
        'ZIP/Syquest/EZ Drive/Jazz: CHF 20 pro Diskette',
        'MO-Laufwerke (3.5"-5.25"): CHF 30 pro Diskette',
        'Festplatten: CHF 40 pro Festplatte',
        'Bandlaufwerke: CHF 50 pro Band',
        'VHS/Schallplatten: Preis auf Anfrage'
      ]
    },
    process: [
      {
        step: 1,
        title: 'Assessment',
        description: 'Wir bewerten Ihre Speichermedien und bestimmen den besten Ansatz für Datenübertragung oder -wiederherstellung.'
      },
      {
        step: 2,
        title: 'Transfer',
        description: 'Mit unserer spezialisierten Ausrüstung übertragen wir Ihre Daten auf das Medium Ihrer Wahl.'
      },
      {
        step: 3,
        title: 'Verification',
        description: 'Wir überprüfen die Integrität der übertragenen Daten, um sicherzustellen, dass alles korrekt kopiert wurde.'
      },
      {
        step: 4,
        title: 'Lieferung',
        description: 'Ihre Daten werden Ihnen auf dem Medium Ihrer Wahl zurückgegeben, bereit zur Verwendung.'
      }
    ]
  },
  'linux-open-source': {
    title: 'Linux & Open Source',
    description: 'Professionelle Linux-Installation, Support und Schulung. Wir helfen Ihnen beim Übergang zu Open-Source-Software und bieten fortlaufenden Support.',
    icon: Server,
    hero: {
      title: 'Linux & Open Source Lösungen',
      subtitle: 'Experten Open Source Support',
      description: 'Wir helfen Ihnen beim Übergang zu und der Wartung von Linux- und Open-Source-Software-Lösungen und bieten fachkundige Unterstützung und Schulung.'
    },
    features: [
      {
        title: 'Linux Installation',
        description: 'Professional installation and setup of Linux distributions.',
        icon: Server
      },
      {
        title: 'Open Source Migration',
        description: 'Reibungsloser Übergang von proprietärer zu Open-Source-Software.',
        icon: Zap
      },
      {
        title: 'Technischer Support',
        description: 'Fachkundiger Support für alle Ihre Linux- und Open-Source-Bedürfnisse.',
        icon: Database
      },
      {
        title: 'Training & Workshops',
        description: 'Umfassende Schulungen und Workshops für Einzelpersonen und Teams.',
        icon: Clock
      }
    ],
    pricing: {
      base: 'Support from CHF 70/hour',
      details: [
        'Free initial consultation',
        'Custom training programs',
        'Ongoing support',
        'Workshop scheduling'
      ]
    }
  },
  'hardware-recycling': {
    title: 'Hardware-Recycling',
    description: 'Verantwortungsvolles Recycling und Aufarbeitung von IT-Ausrüstung. Wir geben Ihren alten Geräten ein neues Leben und sorgen gleichzeitig für sichere Datenlöschung.',
    icon: Archive,
    hero: {
      title: 'Hardware-Recycling',
      subtitle: 'Nachhaltige IT-Lösungen',
      description: 'Wir bieten verantwortungsvolle Recycling- und Aufarbeitungsdienste für IT-Ausrüstung und helfen dabei, Elektroschrott zu reduzieren, während wir sichere Datenlöschung gewährleisten.'
    },
    features: [
      {
        title: 'Sichere Datenlöschung',
        description: 'Vollständige und sichere Löschung aller Daten von Geräten.',
        icon: Archive
      },
      {
        title: 'Geräte-Aufarbeitung',
        description: 'Professionelle Aufarbeitung von IT-Ausrüstung.',
        icon: HardDrive
      },
      {
        title: 'Komponenten-Recycling',
        description: 'Verantwortungsvolles Recycling elektronischer Komponenten.',
        icon: Zap
      },
      {
        title: 'Kostenloser Abholservice',
        description: 'Bequemer Abholservice für Ihre alte Ausrüstung.',
        icon: Clock
      }
    ],
    pricing: {
      base: 'Kostenlos für die meisten Artikel',
      details: [
        'Kostenloser Abholservice',
        'Sichere Datenlöschung',
        'Umweltverantwortlich',
        'Zertifikat der Vernichtung'
      ]
    }
  },
  'web-design-development': {
    title: 'Web Design & Development',
    description: 'Professional web design and development services using open source technologies. Modern, responsive websites built with sustainability and performance in mind.',
    icon: Globe,
    hero: {
      title: 'Web Design & Development',
      subtitle: 'Sustainable Web Solutions',
      description: 'We create modern, responsive websites using open source technologies that prioritize performance, sustainability, and user experience.'
    },
    features: [
      {
        title: 'Custom Web Development',
        description: 'Tailored web applications built with modern open source technologies to meet your specific business needs.',
        icon: Code
      },
      {
        title: 'Responsive Design',
        description: 'Beautiful, user-friendly designs that work perfectly across all devices and screen sizes.',
        icon: Palette
      },
      {
        title: 'Open Source CMS',
        description: 'Modern content management systems using Strapi, Payload, Tina CMS, or WordPress that give you full control.',
        icon: Globe
      },
      {
        title: 'Ongoing Support',
        description: 'Comprehensive maintenance and support to keep your website secure, updated, and performing optimally.',
        icon: Shield
      }
    ],
    pricing: {
      base: 'CHF 70/hour',
      details: [
        'Free initial consultation',
        'Open source technologies',
        'Responsive design included',
        'SEO optimization',
        'Ongoing support available'
      ]
    }
  }
}

export async function generateMetadata({ params }: { params: { service: string } }): Promise<Metadata> {
  const service = services[params.service as keyof typeof services]
  
  if (!service) {
    return {
      title: 'Service Not Found | RevampIT',
      description: 'The requested service could not be found.',
    }
  }

  if (params.service === 'data-recovery-transfer') {
    return {
      title: 'Data Recovery & Transfer Services Zurich | RevampIT',
      description: 'Professional data recovery and transfer services in Zurich. Recover data from old computers, transfer files between devices, access legacy media (floppy disks, ZIP drives, MO drives). Base fee CHF 30.',
      keywords: [
        'data recovery zurich',
        'data transfer service',
        'floppy disk data recovery',
        'ZIP drive data recovery',
        'legacy data recovery',
        'old computer data recovery',
        'data migration service',
        'file transfer service',
        'MO drive data recovery',
        'SCSI IDE data recovery'
      ],
      openGraph: {
        title: 'Data Recovery & Transfer Services Zurich | RevampIT',
        description: 'Professional data recovery and transfer services in Zurich. Recover data from old computers, transfer files between devices, access legacy media.',
        type: 'website',
        url: 'https://revampit.org/services/data-recovery-transfer',
      },
    }
  }

  return {
    title: `${service.title} | RevampIT`,
    description: service.description,
    openGraph: {
      title: `${service.title} | RevampIT`,
      description: service.description,
      type: 'website',
    },
  }
}

export default function ServicePage({ params }: { params: { service: string } }) {
  const service = services[params.service as keyof typeof services]
  
  if (!service) {
    notFound()
  }

  const isComingSoon = false

  return (
    <>
      {params.service === 'data-recovery-transfer' && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Service',
              'name': 'Data Recovery & Transfer Services',
              'description': 'Professional data recovery and transfer services for all types of storage media.',
              'provider': {
                '@type': 'Organization',
                'name': 'RevampIT',
                'url': 'https://revampit.org',
                'logo': 'https://revampit.org/logo.png',
                'address': {
                  '@type': 'PostalAddress',
                  'addressLocality': 'Zurich',
                  'addressRegion': 'ZH',
                  'addressCountry': 'CH'
                }
              },
              'serviceType': [
                'Data Recovery',
                'Data Transfer',
                'Legacy Media Access',
                'File Migration'
              ],
              'areaServed': {
                '@type': 'City',
                'name': 'Zurich'
              },
              'hasOfferCatalog': {
                '@type': 'OfferCatalog',
                'name': 'Data Recovery Services',
                'itemListElement': [
                  {
                    '@type': 'Offer',
                    'itemOffered': {
                      '@type': 'Service',
                      'name': 'Data Recovery Base Service',
                      'description': 'Base data recovery service with assessment'
                    },
                    'price': '30',
                    'priceCurrency': 'CHF'
                  }
                ]
              }
            })
          }}
        />
      )}
      <main>
        {/* Coming Soon Banner */}
        {isComingSoon && (
          <div className="bg-yellow-100 border-b border-yellow-200">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-semibold">Dieser Service kommt bald. Kontaktieren Sie uns, um Ihr Interesse zu bekunden und benachrichtigt zu werden, wenn er verfügbar ist.</span>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">{service.hero.title}</h1>
              <h2 className="text-2xl md:text-3xl font-semibold mb-8 text-green-200">{service.hero.subtitle}</h2>
              <p className="text-xl text-green-100">{service.hero.description}</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {service.features.map((feature, index) => (
                <div key={index} className="bg-white rounded-xl p-8 shadow-lg">
                  <div className="flex items-start mb-6">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                      <feature.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sustainability Focus or Pricing Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-xl p-8 shadow-lg">
              {service.pricing ? (
                <>
                  <h2 className="text-3xl font-bold mb-8 text-center">Preise</h2>
                  <div className="text-center mb-8">
                    <p className="text-2xl font-bold text-green-600">{service.pricing.base}</p>
                  </div>
                  <div className="space-y-4">
                    {service.pricing.details.map((detail, index) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-3" />
                        <span className="text-gray-600">{detail}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* Process Section */}
        {service.process && (
          <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-12 text-center">Unser Prozess</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {service.process.map((step, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">Bereit loszulegen?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
              Kontaktieren Sie uns heute, um mehr über unsere {service.title} Dienstleistungen zu erfahren.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                Kontakt
              </Link>
              <Link
                href="/services"
                className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
              >
                Zurück zu Services
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
} 