import {
  Brain,
  Shield,
  Code,
  Leaf,
  Search,
  Users,
  Cpu,
  Database,
  FileText,
  Network,
  Eye,
  Scale,
  BarChart3,
  Building,
  Heart,
  Briefcase,
  AlertTriangle,
} from 'lucide-react'

export const coreValues = [
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

export const painPoints = [
  {
    pain: 'Sensible Daten dürfen die sichere Umgebung Ihres Unternehmens nicht verlassen',
    solution: '100% selbst gehosteter Open-Source-KI-Stack mit vollständiger Datensouveränität',
    benefit: 'Keine Abhängigkeiten von externen KI-Diensten \u2713 Volle DSGVO-/Compliance-Kontrolle',
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

export const technicalStack = [
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

export const pricingTiers = [
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

export const industries = [
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

export const timeline = [
  { week: 1, milestone: 'Bewertung der Infrastruktur, Sicherheitseinrichtung und Umgebungsvorbereitung' },
  { week: 2, milestone: 'Bereitstellung und Leistungsoptimierung des Open-Source-KI-Modells' },
  { week: 3, milestone: 'Einrichtung der Vektor-Datenbank und der Dokumenten-Ingestions-Pipeline' },
  { week: 4, milestone: 'Bereitstellung der sicheren Weboberfläche und Authentifizierungsintegration' },
  { week: 5, milestone: 'Einrichtung der Workflow-Automatisierung und Systemintegration' },
  { week: 6, milestone: 'Benutzerakzeptanztests, Schulung und Wissenstransfer' }
]

export const riskMitigation = [
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

export const deploymentExamples = [
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
    infrastructure: '2\u00d7 RTX 4090 oder 1\u00d7 A100 80GB',
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
    infrastructure: '2\u00d7 A100 80GB oder H100',
    model: 'Llama 3.1 70B + spezialisiertes Fine-Tuning',
    cost: 'CHF 4.200/Monat',
    deployment: 'Unternehmens-Cloud oder On-Premises'
  }
]

export const technicalImplementation = {
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
