import { Metadata } from 'next'
import { 
  Brain, 
  Shield, 
  Server, 
  Database, 
  Lock, 
  Zap, 
  CheckCircle2,
  ArrowRight,
  Clock,
  Users,
  FileText,
  Search,
  BarChart3,
  Globe,
  AlertTriangle,
  Cpu,
  HardDrive,
  Network,
  Eye,
  Building,
  Scale,
  Briefcase,
  Leaf,
  Code,
  Heart
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Nachhaltige KI-Lösungen für Unternehmen | RevampIT',
  description: 'Open-Source, souveräne KI-Systeme für professionelle Firmen. Nachhaltige, private und DSGVO-konforme KI, die Ihre Daten schützt und die digitale Souveränität unterstützt.',
  openGraph: {
    title: 'Nachhaltige KI-Lösungen für Unternehmen | RevampIT',
    description: 'Open-Source, souveräne KI-Systeme für professionelle Firmen. Nachhaltige, private und DSGVO-konforme KI, die Ihre Daten schützt und die digitale Souveränität unterstützt.',
    type: 'website',
    url: 'https://revampit.org/services/enterprise-ai-solutions',
  },
}

const coreValues = [
  {
    title: 'Digitale Souveränität',
    description: 'Vollständige Kontrolle über Ihre KI-Infrastruktur und Daten. Keine Abhängigkeit von ausländischen Technologiegiganten.',
    icon: Shield,
    color: 'green'
  },
  {
    title: 'Open-Source-Grundlage',
    description: 'Aufgebaut auf transparenten, überprüfbaren Open-Source-Technologien. Kein Anbieter-Lock-in, volle Transparenz.',
    icon: Code,
    color: 'green'
  },
  {
    title: 'Nachhaltiges Computing',
    description: 'Energieeffiziente KI, die verantwortungsvoll skaliert. Optimiert für minimale Umweltbelastung.',
    icon: Leaf,
    color: 'green'
  }
]

const painPoints = [
  {
    pain: 'Sensible Daten dürfen die sichere Umgebung Ihres Unternehmens nicht verlassen',
    solution: '100% selbst gehosteter Open-Source-KI-Stack mit vollständiger Datensouveränität',
    benefit: 'Keine Abhängigkeiten von externen KI-Diensten ✓ Volle DSGVO-/Compliance-Kontrolle',
    icon: Shield
  },
  {
    pain: 'Teams verschwenden Stunden mit der Suche in institutionellem Wissen',
    solution: 'RAG-gestützte intelligente Suche über alle Ihre Dokumente und Daten',
    benefit: 'Antworten auf Expertenniveau aus Ihren eigenen Daten in Sekunden',
    icon: Search
  },
  {
    pain: 'Keine interne KI-Expertise oder Ressourcen zur Bereitstellung von Unternehmenslösungen',
    solution: 'Komplette "Done-for-you"-Bereitstellung, Schulung und laufender Support',
    benefit: 'Konzentrieren Sie sich auf Ihre Kernmission, während wir uns um die KI-Infrastruktur kümmern',
    icon: Users
  }
]

const technicalStack = [
  {
    component: 'KI-Modell',
    technology: 'Open Source Large Language Models',
    description: 'Modernste offene Modelle wie Llama 3, optimiert für den kommerziellen Einsatz mit voller Souveränität',
    icon: Brain,
    features: ['Keine proprietären Abhängigkeiten', 'Kommerzielle Lizenzierung inklusive', 'Effiziente Quantisierungstechniken']
  },
  {
    component: 'Recheninfrastruktur',
    technology: 'Flexible Cloud oder On-Premises',
    description: 'Skalierbare GPU-Infrastruktur, die sich an Ihre Bedürfnisse und Compliance-Anforderungen anpasst',
    icon: Cpu,
    features: ['Bedarfsgerechte Skalierung', 'Kostenoptimierte Bereitstellung', 'Vom Kunden kontrollierte Umgebung']
  },
  {
    component: 'Vektor-Datenbank',
    technology: 'Open Source Vector Store',
    description: 'Transparente, lizenzfreie Vektor-Datenbanklösungen ohne Anbieterabhängigkeiten',
    icon: Database,
    features: ['Kein Anbieter-Lock-in', 'Überprüfbarer Quellcode', 'Skalierbare Architektur']
  },
  {
    component: 'RAG-Framework',
    technology: 'Open Source Retrieval System',
    description: 'Fortschrittliche Dokumentenverarbeitung und -abruf mit transparenten, quelloffenen Frameworks',
    icon: FileText,
    features: ['Intelligente Dokumentenverarbeitung', 'Kontextuelles Verständnis', 'Vollständige Quelltransparenz']
  },
  {
    component: 'Automatisierung',
    technology: 'Open Workflow Orchestration',
    description: 'Transparente Workflow-Automatisierung mit voller Einsicht in die Verarbeitungslogik',
    icon: Network,
    features: ['Open-Source-Workflows', 'Überprüfbare Prozesse', 'Benutzerdefinierte Integrationen']
  },
  {
    component: 'Benutzeroberfläche',
    technology: 'Sicherer Open Web Stack',
    description: 'Moderne, sichere Weboberfläche, die auf offenen Standards mit vollständiger Transparenz basiert',
    icon: Eye,
    features: ['Offene Webstandards', 'Transparente Sicherheit', 'Vollständige Audit-Trails']
  }
]

const pricingTiers = [
  {
    name: 'Starter-Setup',
    duration: '2-3 Wochen',
    description: 'Perfekt für kleine Teams und Proof of Concept',
    price: 'CHF 12.000 - 18.000',
    features: [
      'RTX 4090 Workstation oder kleines Server-Setup',
      'Llama 3.1 8B-Modell mit grundlegendem Fine-Tuning',
      'Grundlegende Dokumentenverarbeitung (bis zu 5.000 Dokumente)',
      'Einfache Weboberfläche',
      'Grundschulung und Dokumentation'
    ],
    highlight: 'Toller Einstiegspunkt',
    note: 'Laufend: CHF 450-800/Monat je nach Hosting'
  },
  {
    name: 'Professionelle Bereitstellung',
    duration: '4-6 Wochen',
    description: 'Voll funktionsfähiges KI-System für wachsende Unternehmen',
    price: 'CHF 30.000 - 45.000',
    features: [
      'Professioneller Server mit RTX 4090 Ti oder zwei GPUs',
      'Llama 3.1 13B-70B Modelle',
      'Erweiterte Dokumentenverarbeitung (bis zu 25.000 Dokumente)',
      'Benutzerdefinierte Integrationen und API-Zugang',
      'Umfassende Schulung & Support'
    ],
    highlight: 'Beliebteste Option',
    popular: true,
    note: 'Laufend: CHF 1.200-2.800/Monat'
  },
  {
    name: 'Unternehmenslösung',
    duration: '6-10 Wochen',
    description: 'Gross angelegte Bereitstellung mit Unternehmensfunktionen',
    price: 'CHF 60.000 - 100.000',
    features: [
      'Unternehmensgerechte A100/H100-Infrastruktur',
      'Benutzerdefinierte, feinabgestimmte Llama 3.1 70B+ Modelle',
      'Unbegrenzte Dokumentenverarbeitung',
      'Erweiterte Sicherheits- und Compliance-Funktionen',
      'Dedizierter Support und SLA'
    ],
    highlight: 'Maximale Leistung',
    note: 'Laufend: CHF 4.200-8.000/Monat'
  }
]

const industries = [
  {
    name: 'Anwaltskanzleien',
    description: 'Vertragsanalyse, Präzedenzfallsuche und Zusammenfassung juristischer Dokumente',
    icon: Scale,
    useCases: [
      'Analyse von Vertragsklauseln',
      'Suche nach juristischen Präzedenzfällen',
      'Zusammenfassung von Dokumenten',
      'Compliance-Prüfung'
    ]
  },
  {
    name: 'Finanzdienstleistungen',
    description: 'Risikoanalyse, Einhaltung gesetzlicher Vorschriften und Verarbeitung von Finanzdokumenten',
    icon: BarChart3,
    useCases: [
      'Risikobewertungsberichte',
      'Einhaltung gesetzlicher Vorschriften',
      'Analyse von Finanzdokumenten',
      'Anlagerecherche'
    ]
  },
  {
    name: 'Pharma & Life Sciences',
    description: 'Beschleunigung der Forschung, Unterstützung bei der Arzneimittelentdeckung und regulatorische Dokumentation',
    icon: Building,
    useCases: [
      'Analyse wissenschaftlicher Literatur',
      'Dokumentation klinischer Studien',
      'Unterstützung bei Zulassungsanträgen',
      'Synthese und Erkenntnisse aus der Forschung'
    ]
  },
  {
    name: 'Gesundheitseinrichtungen',
    description: 'Analyse von Krankenakten, Zusammenfassung von Forschungsergebnissen und Unterstützung bei klinischen Entscheidungen',
    icon: Heart,
    useCases: [
      'Analyse von Krankenakten',
      'Zusammenfassung von Forschungsarbeiten',
      'Klinische Dokumentation',
      'Suche nach Behandlungsprotokollen'
    ]
  },
  {
    name: 'Gemeinnützige Organisationen',
    description: 'Fördermittelrecherche, Wirkungsdokumentation und Wissensmanagement',
    icon: Users,
    useCases: [
      'Recherche nach Fördermöglichkeiten',
      'Berichterstattung zur Wirkungsmessung',
      'Spenderkommunikation',
      'Politikanalyse und Interessenvertretung'
    ]
  },
  {
    name: 'Forschungseinrichtungen',
    description: 'Beschleunigung der akademischen Forschung, Literaturrecherche und Wissenssynthese',
    icon: Brain,
    useCases: [
      'Automatisierung der Literaturrecherche',
      'Entwicklung von Forschungsanträgen',
      'Akademische Zusammenarbeit',
      'Wissensentdeckung'
    ]
  },
  {
    name: 'Fertigung & Maschinenbau',
    description: 'Technische Dokumentation, Qualitätssicherung und Prozessoptimierung',
    icon: Briefcase,
    useCases: [
      'Suche in technischen Handbüchern',
      'Dokumentation der Qualitätskontrolle',
      'Erkenntnisse zur Prozessoptimierung',
      'Einhaltung gesetzlicher Vorschriften'
    ]
  },
  {
    name: 'Beratungsunternehmen',
    description: 'Wissensmanagement, Angebotserstellung und Kundenrecherche',
    icon: Briefcase,
    useCases: [
      'Suche in der Wissensdatenbank',
      'Automatisierung von Angeboten',
      'Kundenrecherche',
      'Identifizierung von Best Practices'
    ]
  }
]

const timeline = [
  { week: 1, milestone: 'Bewertung der Infrastruktur, Sicherheitseinrichtung und Umgebungsvorbereitung' },
  { week: 2, milestone: 'Bereitstellung und Leistungsoptimierung des Open-Source-KI-Modells' },
  { week: 3, milestone: 'Einrichtung der Vektor-Datenbank und der Dokumenten-Ingestions-Pipeline' },
  { week: 4, milestone: 'Bereitstellung der sicheren Weboberfläche und Authentifizierungsintegration' },
  { week: 5, milestone: 'Einrichtung der Workflow-Automatisierung und Systemintegration' },
  { week: 6, milestone: 'Benutzerakzeptanztests, Schulung und Wissenstransfer' }
]

const riskMitigation = [
  {
    risk: 'KI-Halluzinationen',
    mitigation: 'JSON-Ausgabe-Leitplanken + Referenz-Snippets, Quellen anzeigen. Benutzer überprüfen alle Ausgaben.',
    icon: AlertTriangle
  },
  {
    risk: 'Regulatorische Änderungen',
    mitigation: 'Bleiben Sie bei On-Premises/vom Kunden gewählter Cloud, unterzeichnen Sie DPA ohne Unterauftragsverarbeiter.',
    icon: Shield
  },
  {
    risk: 'Kostenüberschreitungen',
    mitigation: 'GPU-Pods nachts automatisch abschalten; vLLM KV-Cache-Wiederverwendung hält Kaltstarts günstig.',
    icon: BarChart3
  },
  {
    risk: 'Wettbewerb (intern)',
    mitigation: 'Bieten Sie Quellcode-Treuhand an; immer noch billiger als die Einstellung von 2 KI-Ingenieuren.',
    icon: Users
  }
]

// Add case study section
const deploymentExamples = [
  {
    title: 'Kleine Beratungsfirma',
    description: 'Dokumentensuche und Basisanalyse',
    scale: '2-5 Mitarbeiter',
    documents: '1.000-5.000',
    responseTime: '8-15 Sekunden',
    infrastructure: 'RTX 4090 24GB Workstation',
    model: 'Llama 3.1 8B (4-Bit-Quantisierung)',
    cost: 'CHF 450/Monat',
    deployment: 'Lokales Workstation-Setup'
  },
  {
    title: 'Mittelgrosse Anwaltskanzlei',
    description: 'Vertragsanalyse und Rechtsrecherche',
    scale: '10-25 Mitarbeiter',
    documents: '10.000-25.000',
    responseTime: '5-10 Sekunden',
    infrastructure: 'RTX 4090 Ti 24GB Server',
    model: 'Llama 3.1 13B (INT8-Quantisierung)',
    cost: 'CHF 1.200/Monat',
    deployment: 'Dedizierter Server vor Ort'
  },
  {
    title: 'Forschungseinrichtung',
    description: 'Analyse wissenschaftlicher Literatur',
    scale: '50+ Mitarbeiter',
    documents: '25.000+',
    responseTime: '3-8 Sekunden',
    infrastructure: '2× RTX 4090 oder 1× A100 80GB',
    model: 'Llama 3.1 70B (INT8-Quantisierung)',
    cost: 'CHF 2.800/Monat',
    deployment: 'Hochleistungsserver oder Cloud'
  },
  {
    title: 'Grossunternehmen',
    description: 'Komplexe Dokumentenverarbeitung und -analyse',
    scale: '100+ Mitarbeiter',
    documents: '50.000+',
    responseTime: '2-5 Sekunden',
    infrastructure: '2× A100 80GB oder H100',
    model: 'Llama 3.1 70B + spezialisiertes Fine-Tuning',
    cost: 'CHF 4.200/Monat',
    deployment: 'Unternehmens-Cloud oder On-Premises'
  }
]

const technicalImplementation = {
  title: 'Wie unsere nachhaltige KI-Infrastruktur funktioniert',
  description: 'Ein vollständiger technischer Überblick über unseren souveränen KI-Bereitstellungsprozess und unsere Technologieentscheidungen',
  steps: [
    {
      phase: 'Infrastruktur-Setup',
      duration: '2-3 Wochen',
      description: 'Wir stellen die GPU-Infrastruktur in Ihrer gewählten Umgebung mit entsprechender Sicherheits- und Netzwerkkonfiguration bereit',
      technical: 'NVIDIA A100/H100 GPUs, containerisierte Bereitstellung über Docker/Kubernetes, Netzwerksicherheits-Setup',
      sustainability: 'Effiziente Quantisierung und optimierte Inferenz reduzieren den Rechenaufwand im Vergleich zu unoptimierten Bereitstellungen'
    },
    {
      phase: 'Open-Source-KI-Stack',
      duration: '1-2 Wochen',
      description: 'Bereitstellung und Optimierung von Open-Source-Large-Language-Modellen ohne proprietäre Abhängigkeiten',
      technical: 'Llama 3.1 (8B-70B), vLLM-Inferenz-Engine, INT8-Quantisierung, Modelloptimierung',
      sustainability: 'Open Source gewährleistet Langlebigkeit, Transparenz und keinen Anbieter-Lock-in'
    },
    {
      phase: 'Datenverarbeitungspipeline',
      duration: '2-3 Wochen',
      description: 'Implementierung einer sicheren Dokumentenverarbeitung und Vektorspeicherung mit vollständiger Datenkontrolle',
      technical: 'ChromaDB-Vektor-Datenbank, LlamaIndex-RAG-Pipeline, Dokumentenvorverarbeitung, Embedding-Generierung',
      sustainability: 'Self-Hosting stellt sicher, dass die Daten die Schweiz nie verlassen, was die Komplexität der Einhaltung gesetzlicher Vorschriften reduziert'
    },
    {
      phase: 'Integration & Schulung',
      duration: '3-4 Wochen',
      description: 'Benutzerdefinierte Integrationen mit Ihren bestehenden Systemen und umfassende Teamschulung',
      technical: 'RESTful-APIs, Authentifizierungsintegration, Einrichten der Überwachung, umfassende Dokumentation',
      sustainability: 'Offene Standards gewährleisten zukünftige Flexibilität und verhindern einen Anbieter-Lock-in'
    }
  ]
}

export default function EnterpriseAIPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Service',
            'name': 'Nachhaltige KI-Lösungen für Unternehmen',
            'description': 'Open-Source, souveräne KI-Systeme für professionelle Firmen mit vollständiger Datenprivatsphäre, digitaler Souveränität und nachhaltigen Computing-Praktiken.',
            'provider': {
              '@type': 'Organization',
              'name': 'RevampIT',
              'url': 'https://revampit.org'
            },
            'serviceType': 'Nachhaltige KI-Lösungen für Unternehmen',
            'areaServed': {
              '@type': 'Country',
              'name': 'Switzerland'
            }
          })
        }}
      />
      <main className="min-h-screen bg-gray-50">
        {/* Coming Soon Banner */}
        <div className="bg-yellow-100 border-b border-yellow-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 font-semibold">Dieser Service ist bald verfügbar. Kontaktieren Sie uns, um Interesse zu bekunden und benachrichtigt zu werden, wenn er verfügbar ist.</span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="container mx-auto px-4 sm:px-6 relative">
            <div className="max-w-4xl">
              <div className="flex items-center mb-4 sm:mb-6">
                <Brain className="w-12 h-12 sm:w-16 sm:h-16 mr-3 sm:mr-4 text-green-300" />
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 leading-tight">Nachhaltige Unternehmens-KI</h1>
                  <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-green-200">Souverän • Open Source • Nachhaltig</p>
                </div>
              </div>
              <p className="text-base sm:text-lg md:text-xl text-green-100 mb-6 sm:mb-8">
                Die Zukunft der KI ist nachhaltiges, souveränes Computing. Setzen Sie fortschrittliche KI-Systeme ein, die Ihre Datensouveränität respektieren, auf Open-Source-Transparenz setzen und die Umweltbelastung minimieren.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link
                  href="/contact"
                  className="inline-block bg-white text-green-800 px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-sm sm:text-base md:text-lg text-center"
                >
                  Interesse bekunden
                </Link>
                <Link
                  href="#case-study"
                  className="inline-block border-2 border-white text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-sm sm:text-base md:text-lg text-center"
                >
                  Zukünftige Pläne ansehen
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-12 sm:py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Unser Ethos: Die Zukunft des Computing</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Nachhaltiges, souveränes Computing stellt einen grundlegenden Wandel hin zu einer verantwortungsvollen KI dar, die die Datensouveränität respektiert, Transparenz begrüsst und die Umweltbelastung minimiert.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {coreValues.map((value, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300 text-center">
                  <div className={`w-20 h-20 mx-auto mb-6 bg-${value.color}-100 rounded-full flex items-center justify-center`}>
                    <value.icon className={`w-10 h-10 text-${value.color}-600`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Warum nachhaltige, souveräne KI?</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Transformieren Sie Ihre Dokumenten-Workflows mit einer KI, die den Schweizer Werten von Datenschutz, Nachhaltigkeit und Unabhängigkeit entspricht.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {painPoints.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                      <item.icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold">Herausforderung</h3>
                  </div>
                  <p className="text-gray-600 mb-4 font-medium">{item.pain}</p>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-green-600 mb-2">Souveräne Lösung</h4>
                    <p className="text-gray-700 mb-3">{item.solution}</p>
                    <div className="flex items-center text-green-600 font-medium">
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      <span>{item.benefit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Architecture */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Technische Grundlage: Open Source</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Vollständig auf transparenten, überprüfbaren Open-Source-Technologien aufgebaut. Keine proprietären Abhängigkeiten, kein Anbieter-Lock-in, vollständige digitale Souveränität.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {technicalStack.map((component, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                      <component.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{component.component}</h3>
                      <p className="text-green-600 font-medium">{component.technology}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{component.description}</p>
                  <ul className="space-y-2">
                    {component.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Case Study */}
        <section id="case-study" className="py-20 bg-green-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Bereitstellungsbeispiele nach Unternehmensgrösse</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Skalierbare KI-Lösungen von kleinen Start-ups bis hin zu grossen Unternehmen - wir haben Optionen für jedes Budget und jeden Umfang.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {deploymentExamples.map((example, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-green-600 mb-2">{example.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">{example.scale}</p>
                  <p className="text-gray-600 mb-4">{example.description}</p>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-semibold">Dokumente:</span> {example.documents}</div>
                    <div><span className="font-semibold">Antwortzeit:</span> {example.responseTime}</div>
                    <div><span className="font-semibold">Hardware:</span> {example.infrastructure}</div>
                    <div><span className="font-semibold">Modell:</span> {example.model}</div>
                    <div><span className="font-semibold">Bereitstellung:</span> {example.deployment}</div>
                    <div className="text-lg font-bold text-green-600 mt-3">{example.cost}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-6 text-center">Hardware-Optionen & Technologie-Stack</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-green-600 mb-3">Hardware-Stufen</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Einstiegslevel:</strong> RTX 4090 24GB (hervorragendes Preis-Leistungs-Verhältnis)</li>
                    <li>• <strong>Professionell:</strong> RTX 4090 Ti oder duale RTX 4090-Setups</li>
                    <li>• <strong>Unternehmen:</strong> NVIDIA A100 80GB (maximale Leistung)</li>
                    <li>• <strong>Spitzentechnologie:</strong> NVIDIA H100 (neueste Generation)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600 mb-3">Software & KI-Modelle</h4>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Klein:</strong> Llama 3.1 8B (schnell, effizient, budgetfreundlich)</li>
                    <li>• <strong>Mittel:</strong> Llama 3.1 13B (ausgewogene Leistung)</li>
                    <li>• <strong>Gross:</strong> Llama 3.1 70B (maximale Fähigkeit)</li>
                    <li>• <strong>Bereitstellung:</strong> vLLM, ChromaDB, LlamaIndex</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-8 bg-green-50 rounded-lg p-6">
                <h4 className="font-semibold text-green-800 mb-3">Klein anfangen, intelligent skalieren</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="font-semibold text-green-700">Einstiegspunkt</h5>
                    <p className="text-sm text-gray-700">Beginnen Sie mit einem RTX 4090-Setup für CHF 450/Monat. Perfekt für kleine Teams zum Testen und Lernen.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-green-700">Allmähliche Skalierung</h5>
                    <p className="text-sm text-gray-700">Aktualisieren Sie Hardware und Modelle, wenn Ihre Anforderungen wachsen. Sie müssen nicht mit unternehmenstauglicher Ausrüstung beginnen.</p>
                  </div>
                  <div>
                    <h5 className="font-semibold text-green-700">Zukunftssicher</h5>
                    <p className="text-sm text-gray-700">Die offene Architektur ermöglicht nahtlose Upgrades ohne Anbieter-Lock-in oder Datenmigration.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Industry Applications */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Branchenanwendungen</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Unsere souveränen KI-Lösungen passen sich den spezifischen Bedürfnissen Ihrer Branche an und gewährleisten gleichzeitig vollständige Datensouveränität und Compliance.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {industries.map((industry, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                      <industry.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{industry.name}</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{industry.description}</p>
                  <div className="space-y-2">
                    {industry.useCases.map((useCase, i) => (
                      <div key={i} className="flex items-center text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">{useCase}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Nachhaltige Investition in die digitale Souveränität</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Transparente Preise, die unser Engagement für nachhaltige, souveräne KI widerspiegeln. Skalieren Sie vom Proof-of-Concept bis zur vollen Produktion mit vollständiger Kostentransparenz.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {pricingTiers.map((tier, index) => (
                <div key={index} className={`rounded-xl shadow-lg overflow-hidden ${tier.popular ? 'ring-2 ring-green-500 bg-green-50' : 'bg-white'}`}>
                  <div className="p-8">
                    {tier.popular && (
                      <div className="bg-green-500 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                        Beliebteste Option
                      </div>
                    )}
                    <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                    <p className="text-gray-600 mb-4">{tier.description}</p>
                    <div className="mb-6">
                      <span className="text-3xl font-bold text-green-600">{tier.price}</span>
                      <span className="text-gray-500 ml-2">({tier.duration})</span>
                    </div>
                    <div className="space-y-3 mb-8">
                      {tier.features.map((feature, i) => (
                        <div key={i} className="flex items-center">
                          <CheckCircle2 className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-center">
                      <div className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full inline-block">
                        {tier.highlight}
                      </div>
                      {tier.note && (
                        <p className="text-xs text-gray-500 mt-2">{tier.note}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-16 text-center">
              <div className="bg-green-50 rounded-xl p-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-center mb-4">
                  <Leaf className="w-8 h-8 text-green-600 mr-3" />
                  <h3 className="text-2xl font-bold text-green-800">Nachhaltigkeitsverpflichtung</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  Unsere Preisgestaltung spiegelt die wahren Kosten nachhaltiger KI wider. Durch die Wahl energieeffizienter Modelle, optimierter Infrastruktur und transparenter Open-Source-Technologien liefern wir einen überlegenen Wert und minimieren gleichzeitig die Umweltbelastung. Jede Bereitstellung trägt zu einer nachhaltigeren digitalen Zukunft bei.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Implementation Timeline */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">8-12 Wochen Implementierungszeitplan</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Strukturierter Bereitstellungsprozess mit klaren Meilensteinen und Ergebnissen. Der Zeitplan variiert je nach Komplexität und Anforderungen.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {timeline.map((item, index) => (
                  <div key={index} className="flex items-center bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex-shrink-0 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mr-6">
                      <span className="text-2xl font-bold text-green-600">W{item.week}</span>
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold mb-2">Woche {item.week}</h3>
                      <p className="text-gray-600">{item.milestone}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Risk Mitigation */}
        <section className="py-12 sm:py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Risikomanagement</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Wir haben die Hauptrisiken bei der Bereitstellung von Unternehmens-KI identifiziert und gemindert.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {riskMitigation.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-start mb-4">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600 mr-4 flex-shrink-0">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-red-700">Risiko: {item.risk}</h3>
                      <p className="text-gray-700">{item.mitigation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Implementation */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">Technischer Implementierungsüberblick</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Ein vollständiger technischer Überblick über unseren souveränen KI-Bereitstellungsprozess und unsere Technologieentscheidungen.
              </p>
            </div>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {technicalImplementation.steps.map((step, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center mb-4">
                      <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{step.phase}</h3>
                        <p className="text-green-600 font-medium">{step.duration}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4">{step.description}</p>
                    <div className="flex items-center text-green-600 font-medium">
                      <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                      <span>{step.technical}</span>
                    </div>
                    <div className="mt-4">
                      <span className="text-green-600 font-semibold">Nachhaltigkeitsauswirkungen:</span>
                      <p className="text-gray-700">{step.sustainability}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center mb-6">
              <Brain className="w-12 h-12 mr-4 text-green-300" />
              <Heart className="w-8 h-8 mr-4 text-green-300" />
              <Leaf className="w-10 h-10 text-green-300" />
            </div>
            <h2 className="text-4xl font-bold mb-6">Bereit für nachhaltige, souveräne KI?</h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto text-green-100">
              Schliessen Sie sich der Bewegung zur digitalen Souveränität an. Setzen Sie eine KI ein, die Ihre Daten respektiert, Transparenz begrüsst und eine nachhaltige digitale Zukunft für die Schweiz und darüber hinaus schafft.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
              >
                Starten Sie Ihre souveräne KI-Reise
              </Link>
              <Link
                href="/services"
                className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
              >
                Alle Dienstleistungen entdecken
              </Link>
            </div>
            
            <div className="mt-12 max-w-2xl mx-auto">
              <p className="text-green-200 text-lg italic">
                "Nachhaltiges, souveränes Computing ist nicht nur die Zukunft – es ist die verantwortungsvolle Wahl für heute."
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}