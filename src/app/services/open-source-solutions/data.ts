/**
 * Open Source Solutions Page Data
 * 
 * Centralized data for the open-source-solutions page
 * 
 * Created: 2025-12-17
 * Last Modified: 2025-12-17
 * Last Modified Summary: Extracted data constants from page component
 */

import {
  Code,
  Shield,
  Users,
  BookOpen,
  Database,
  Server,
  Terminal,
  Globe,
  DollarSign,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileCode,
  FileCheck,
  FileX,
  FileText,
  Chrome,
  Image,
  Video,
  Cloud,
  Paintbrush,
  Film,
  Coins,
  Wallet,
  Banknote,
  Brain,
  Network,
  Monitor,
  Box,
  GitBranch,
  MessageSquare,
  Activity,
  Share2,
  LucideIcon
} from 'lucide-react'

export interface Benefit {
  title: string
  description: string
  icon: LucideIcon
}

export interface PopularApp {
  name: string
  description: string
  icon: LucideIcon
  comparison: string
}

export interface Feature {
  title: string
  description: string
  icon: LucideIcon
}

export interface ComparisonItem {
  name: string
  icon: LucideIcon
  cost: string
  comparisons: string[]
  examples?: string[]
}

export interface Comparison {
  category: string
  openSource: ComparisonItem
  proprietary: ComparisonItem
}

export const benefits: Benefit[] = [
  {
    title: 'Kosteneffektiv',
    description: 'Keine Lizenzgebühren und niedrigere Gesamtbetriebskosten im Vergleich zu proprietären Lösungen.',
    icon: DollarSign
  },
  {
    title: 'Erhöhte Sicherheit',
    description: 'Transparenter Code, der von jedermann überprüft werden kann, was zu einer schnelleren Erkennung und Behebung von Schwachstellen führt.',
    icon: Shield
  },
  {
    title: 'Freiheit & Flexibilität',
    description: 'Kein Anbieter-Lock-in. Sie besitzen Ihre Daten und können die Software an Ihre Bedürfnisse anpassen.',
    icon: Globe
  },
  {
    title: 'Community-Unterstützung',
    description: 'Zugang zu einer globalen Gemeinschaft von Entwicklern und Benutzern für Unterstützung und Innovation.',
    icon: Users
  }
]

export const popularApps: PopularApp[] = [
  {
    name: 'LibreOffice',
    description: 'Professionelle Office-Suite, die mit Microsoft Office konkurriert, mit voller Kompatibilität und erweiterten Funktionen.',
    icon: BookOpen,
    comparison: 'Microsoft Office-Alternative'
  },
  {
    name: 'Nextcloud',
    description: 'Sichere Filesharing- und Kollaborationsplattform, die mit Dropbox und Google Drive konkurriert.',
    icon: Server,
    comparison: 'Dropbox/Google Drive-Alternative'
  },
  {
    name: 'GIMP',
    description: 'Professionelle Bildbearbeitungssoftware mit Funktionen, die Adobe Photoshop entsprechen.',
    icon: Code,
    comparison: 'Photoshop-Alternative'
  },
  {
    name: 'PostgreSQL',
    description: 'Datenbanksystem der Enterprise-Klasse, das in Leistung und Funktionen mit Oracle und SQL Server konkurriert.',
    icon: Database,
    comparison: 'Oracle/SQL Server-Alternative'
  }
]

export const features: Feature[] = [
  {
    title: 'Open-Source-Beratung',
    description: 'Strategische Anleitung zur Auswahl und Implementierung von Open-Source-Software für Ihre spezifischen Bedürfnisse.',
    icon: Code
  },
  {
    title: 'Kundenspezifische Entwicklung',
    description: 'Massgeschneiderte Open-Source-Lösungen und -Anpassungen, um Ihre einzigartigen Anforderungen zu erfüllen.',
    icon: Terminal
  },
  {
    title: 'Community-Integration',
    description: 'Hilft Ihnen, ein aktiver Teil der Open-Source-Community zu werden und deren Vorteile zu nutzen.',
    icon: Users
  },
  {
    title: 'Sicherheit & Compliance',
    description: 'Stellen Sie sicher, dass Ihre Open-Source-Lösungen die Sicherheitsstandards und Compliance-Anforderungen erfüllen.',
    icon: Shield
  }
]

export const consumerComparisons: Comparison[] = [
  {
    category: 'Office-Paket',
    openSource: {
      name: 'LibreOffice',
      icon: FileSpreadsheet,
      cost: 'Kostenlos, keine Abonnements',
      comparisons: [
        'Vollständiger Funktionsumfang, der Microsoft Office entspricht',
        'Export in jedes Dokumentenformat',
        'Keine erzwungenen Upgrades oder Telemetrie',
        'Community-gesteuerte Entwicklung',
        'Verfügbar in mehreren Sprachen',
        'Vollständige Kontrolle über Ihre Dokumente'
      ]
    },
    proprietary: {
      name: 'Microsoft 365',
      icon: FileText,
      cost: 'Ab CHF 69/Jahr pro Benutzer',
      comparisons: [
        'Vollständiger Funktionsumfang mit Cloud-Integration',
        'Native Unterstützung des Microsoft-Formats',
        'Regelmässige Updates und neue Funktionen',
        'Unternehmensgesteuerte Entwicklung',
        'Verfügbar in mehreren Sprachen',
        'Abonnement für volle Funktionalität erforderlich'
      ]
    }
  },
  {
    category: 'Betriebssystem',
    openSource: {
      name: 'Linux',
      icon: Terminal,
      cost: 'Kostenlos, keine Lizenzen',
      comparisons: [
        'Vollständig anpassbar und überprüfbar',
        'Keine erzwungenen Updates oder Telemetrie',
        'Tausende von kostenlosen Anwendungen',
        'Community-gesteuerte Sicherheitsupdates',
        'Verfügbar in mehreren Distributionen',
        'Vollständige Kontrolle über Ihr System'
      ]
    },
    proprietary: {
      name: 'Windows/macOS',
      icon: Monitor,
      cost: 'Lizenzgebühren und Abonnements',
      comparisons: [
        'Auf den meisten Geräten vorinstalliert',
        'Integrierte Telemetrie und Updates',
        'Offizielle App-Stores und Support',
        'Unternehmensgesteuerte Updates',
        'Begrenzte Anpassungsmöglichkeiten',
        'Regelmässige Lizenzerneuerungen erforderlich'
      ]
    }
  },
  {
    category: 'Datei-Synchronisierung & -Freigabe',
    openSource: {
      name: 'Nextcloud',
      icon: Cloud,
      cost: 'Kostenlos, selbst gehostet',
      comparisons: [
        'Vollständige Kontrolle über Ihre Daten',
        'Hunderte von integrierten Apps',
        'DSGVO- und datenschutzkonform',
        'Community-gesteuerte Entwicklung',
        'Verfügbar in mehreren Sprachen',
        'Keine Speicherbegrenzungen oder Gebühren'
      ]
    },
    proprietary: {
      name: 'Dropbox/Google Drive',
      icon: Cloud,
      cost: 'Ab CHF 10/Monat',
      comparisons: [
        'Einfach zu bedienen und einzurichten',
        'Integriert mit anderen Diensten',
        'Automatische Synchronisierung und Sicherung',
        'Unternehmensgesteuerte Entwicklung',
        'Verfügbar in mehreren Sprachen',
        'Speicherbegrenzungen und Gebühren fallen an'
      ]
    }
  },
  {
    category: 'Webbrowser',
    openSource: {
      name: 'Firefox/Brave',
      icon: Globe,
      cost: 'Kostenlos',
      comparisons: [
        'Datenschutzorientiert ohne Tracking',
        'Funktioniert mit allen Webstandards',
        'Regelmässige Sicherheitsupdates',
        'Community-gesteuerte Entwicklung',
        'Verfügbar in mehreren Sprachen',
        'Keine Datenerfassung'
      ]
    },
    proprietary: {
      name: 'Chrome/Edge',
      icon: Chrome,
      cost: 'Kostenlos mit Datenerfassung',
      comparisons: [
        'Umfangreiche Datenerfassung und Tracking',
        'Funktioniert mit allen Webstandards',
        'Regelmässige Sicherheitsupdates',
        'Unternehmensgesteuerte Entwicklung',
        'Verfügbar in mehreren Sprachen',
        'Datenerfassung erforderlich'
      ]
    }
  },
  {
    category: 'Grafikbearbeitung',
    openSource: {
      name: 'GIMP/Inkscape',
      icon: Paintbrush,
      cost: 'Kostenlos',
      comparisons: [
        'Professionelle Werkzeuge',
        'Funktioniert mit allen Bildformaten',
        'Regelmässige Sicherheitsupdates',
        'Community-gesteuerte Entwicklung',
        'Verfügbar in mehreren Sprachen',
        'Keine Wasserzeichen oder Einschränkungen'
      ]
    },
    proprietary: {
      name: 'Adobe Photoshop/Illustrator',
      icon: Image,
      cost: 'CHF 24/Monat',
      comparisons: [
        'Branchenübliche Werkzeuge',
        'Funktioniert mit allen Bildformaten',
        'Regelmässige Sicherheitsupdates',
        'Unternehmensgesteuerte Entwicklung',
        'Verfügbar in mehreren Sprachen',
        'Abonnement erforderlich'
      ]
    }
  },
  {
    category: '3D & Video',
    openSource: {
      name: 'Blender',
      icon: Film,
      cost: 'Kostenlos',
      comparisons: [
        '3D/VFX/Animation in Studioqualität',
        'Riesiges Plugin-Ökosystem',
        'Regelmässige Sicherheitsupdates',
        'Community-gesteuerte Entwicklung',
        'Verfügbar in mehreren Sprachen',
        'Keine Wasserzeichen oder Einschränkungen'
      ]
    },
    proprietary: {
      name: 'Autodesk Maya/3ds Max',
      icon: Video,
      cost: 'Komplexe Lizenzgebühren',
      comparisons: [
        'Branchenübliche Werkzeuge',
        'Funktioniert mit allen Formaten',
        'Regelmässige Sicherheitsupdates',
        'Unternehmensgesteuerte Entwicklung',
        'Verfügbar in mehreren Sprachen',
        'Lizenz und Support erforderlich'
      ]
    }
  },
  {
    category: 'Soziale Medien',
    openSource: {
      name: 'Mastodon/Pixelfed',
      icon: Users,
      cost: 'Kostenlos, selbst gehostet oder einem Server beitreten',
      comparisons: [
        'Dezentrales Netzwerk (Fediverse)',
        'Keine Algorithmus-Manipulation',
        'Keine Datenerfassung oder Werbung',
        'Community-gesteuerte Moderation',
        'Verfügbar in mehreren Sprachen',
        'Exportieren Sie Ihre Daten jederzeit'
      ]
    },
    proprietary: {
      name: 'X/Instagram',
      icon: Share2,
      cost: 'Kostenlos mit Werbung und Datenerfassung',
      comparisons: [
        'Zentralisierte Plattformkontrolle',
        'Algorithmus-gesteuerter Inhalt',
        'Umfangreiche Datenerfassung',
        'Unternehmensmoderation',
        'Verfügbar in mehreren Sprachen',
        'Begrenzte Datenportabilität'
      ]
    }
  }
]

export const businessComparisons: Comparison[] = [
  {
    category: 'Datenbank',
    openSource: {
      name: 'PostgreSQL/MariaDB',
      icon: Database,
      cost: 'Kostenlos, keine Platzgebühren',
      comparisons: [
        'Leistung auf Unternehmensebene',
        'Unbegrenzte Erweiterungen und Plugins',
        'Starke ACID-Konformität',
        'Community-gesteuerte Sicherheit',
        'Verfügbar für alle Plattformen',
        'Vollständige Kontrolle über die Daten'
      ]
    },
    proprietary: {
      name: 'Oracle DB',
      icon: Database,
      cost: 'Komplexe Lizenzgebühren',
      comparisons: [
        'Funktionen auf Unternehmensebene',
        'Offizieller Support und Schulungen',
        'Starke Sicherheitsfunktionen',
        'Unternehmensgesteuerte Updates',
        'Verfügbar für alle Plattformen',
        'Lizenz und Support erforderlich'
      ]
    }
  },
  {
    category: 'Virtualisierung',
    openSource: {
      name: 'KVM/QEMU',
      icon: Server,
      cost: 'Kostenlos, keine Lizenzen',
      comparisons: [
        'Vollständig offener Hypervisor',
        'Integriert sich in jede Toolchain',
        'Funktionen auf Unternehmensebene',
        'Community-gesteuerte Sicherheit',
        'Verfügbar für alle Plattformen',
        'Vollständige Kontrolle über VMs'
      ]
    },
    proprietary: {
      name: 'VMware vSphere',
      icon: Server,
      cost: 'Lizenzen pro CPU/Sockel',
      comparisons: [
        'Funktionen auf Unternehmensebene',
        'Offizieller Support und Schulungen',
        'Starke Sicherheitsfunktionen',
        'Unternehmensgesteuerte Updates',
        'Verfügbar für alle Plattformen',
        'Lizenz und Support erforderlich'
      ]
    }
  },
  {
    category: 'Container-Plattform',
    openSource: {
      name: 'Kubernetes',
      icon: Box,
      cost: 'Kostenlos, kein Lock-in',
      comparisons: [
        'Überall lauffähig, kein Cloud-Lock',
        'Nach Bedarf forken und anpassen',
        'Funktionen auf Unternehmensebene',
        'Community-gesteuerte Sicherheit',
        'Verfügbar für alle Plattformen',
        'Vollständige Kontrolle über Container'
      ]
    },
    proprietary: {
      name: 'AWS ECS/EKS',
      icon: Cloud,
      cost: 'Komplexes Preismodell',
      comparisons: [
        'Verwalteter Dienst mit Support',
        'Integriert in das AWS-Ökosystem',
        'Funktionen auf Unternehmensebene',
        'Unternehmensgesteuerte Updates',
        'Verfügbar auf der AWS-Plattform',
        'Potenzial für Anbieter-Lock-in'
      ]
    }
  },
  {
    category: 'CI/CD',
    openSource: {
      name: 'Jenkins/GitLab CI',
      icon: GitBranch,
      cost: 'Kostenlos, selbst gehostet',
      comparisons: [
        'Unendliche Plugins und Erweiterungen',
        'Selbst-Hosting oder Cloud-Bereitstellung',
        'Funktionen auf Unternehmensebene',
        'Community-gesteuerte Sicherheit',
        'Verfügbar für alle Plattformen',
        'Vollständige Kontrolle über die Pipeline'
      ]
    },
    proprietary: {
      name: 'TeamCity/CircleCI',
      icon: GitBranch,
      cost: 'Gebühren pro Benutzer oder pro Build',
      comparisons: [
        'Verwalteter Dienst mit Support',
        'Integriert mit anderen Tools',
        'Funktionen auf Unternehmensebene',
        'Unternehmensgesteuerte Updates',
        'Verfügbar für alle Plattformen',
        'Nutzungsabhängige Preise'
      ]
    }
  },
  {
    category: 'Überwachung',
    openSource: {
      name: 'Prometheus + Grafana',
      icon: Activity,
      cost: 'Kostenlos, selbst gehostet',
      comparisons: [
        'Pull-Modell-Metrikerfassung',
        'Flexible Abfragesprache',
        'Umfangreiches Plugin-Ökosystem',
        'Community-gesteuerte Sicherheit',
        'Verfügbar für alle Plattformen',
        'Vollständige Kontrolle über die Überwachung'
      ]
    },
    proprietary: {
      name: 'Datadog/New Relic',
      icon: Activity,
      cost: 'Gebühren pro Host/pro Metrik',
      comparisons: [
        'Verwalteter Dienst mit Support',
        'Integriert mit anderen Tools',
        'Funktionen auf Unternehmensebene',
        'Unternehmensgesteuerte Updates',
        'Verfügbar für alle Plattformen',
        'Nutzungsabhängige Preise'
      ]
    }
  },
  {
    category: 'Zusammenarbeit',
    openSource: {
      name: 'Mattermost/Rocket.Chat',
      icon: MessageSquare,
      cost: 'Kostenlos, selbst gehostet',
      comparisons: [
        'Selbst gehostete Slack-Alternative',
        'Keine Datenerfassung',
        'Daten jederzeit exportieren',
        'Community-gesteuerte Sicherheit',
        'Verfügbar für alle Plattformen',
        'Vollständige Kontrolle über die Daten'
      ]
    },
    proprietary: {
      name: 'Slack/Teams',
      icon: MessageSquare,
      cost: 'Abonnement pro Benutzer',
      comparisons: [
        'Einfach zu bedienen und einzurichten',
        'Integriert mit anderen Diensten',
        'Funktionen auf Unternehmensebene',
        'Unternehmensgesteuerte Updates',
        'Verfügbar für alle Plattformen',
        'Es gelten Datenaufbewahrungsrichtlinien'
      ]
    }
  }
]

export const emergingTechComparisons: Comparison[] = [
  {
    category: 'Digitale Währung',
    openSource: {
      name: 'Bitcoin',
      icon: Coins,
      cost: 'Transparente Netzwerkgebühren',
      comparisons: [
        'Open-Source-Protokoll mit öffentlichem Prüfpfad',
        'Vorhersehbares Angebot mit 21 Millionen Obergrenze',
        'Selbstverwahrung: volle Kontrolle über die Gelder',
        'Globales Netzwerk mit 24/7-Verfügbarkeit',
        'Genehmigungsfreie Transaktionen',
        'Keine zentrale Behörde'
      ]
    },
    proprietary: {
      name: 'Traditionelles Bankwesen',
      icon: Banknote,
      cost: 'Mehrere Gebühren und Entgelte',
      comparisons: [
        'Zentralisierte Kontrolle und Regulierung',
        'Unbegrenztes Angebot durch Zentralbanken',
        'Verwahrung: Banken kontrollieren die Gelder',
        'Begrenzt durch Banköffnungszeiten',
        'Genehmigungspflichtige Transaktionen',
        'Zentrale Behörde erforderlich'
      ]
    }
  },
  {
    category: 'Künstliche Intelligenz',
    openSource: {
      name: 'Open-Source-KI',
      icon: Brain,
      cost: 'Kostenlos nutzbar, Bezahlung für Rechenleistung',
      examples: [
        'LLaMA 2 (Meta) - Leistungsstarkes Sprachmodell',
        'Stable Diffusion - Bilderzeugung',
        'Whisper - Spracherkennung',
        'BERT - Verarbeitung natürlicher Sprache',
        'TensorFlow/PyTorch - ML-Frameworks'
      ],
      comparisons: [
        'Vollständig überprüfbarer Code und Modelle',
        'Keine erzwungene Telemetrie oder Tracking',
        'Läuft auf jeder kompatiblen Hardware',
        'Community-gesteuerte Sicherheit',
        'Demokratisierte Entwicklung',
        'Vollständige Anpassung möglich'
      ]
    },
    proprietary: {
      name: 'Proprietäre KI',
      icon: Network,
      cost: 'Pay-per-Use oder Abonnement',
      examples: [
        'ChatGPT (OpenAI)',
        'DALL-E (OpenAI)',
        'Claude (Anthropic)',
        'Midjourney',
        'Google Bard'
      ],
      comparisons: [
        'Closed-Source mit Einschränkungen',
        'Integriertes Nutzungs-Tracking',
        'Nur Cloud-Bereitstellung',
        'Unternehmensgesteuerte Updates',
        'Roadmap eines einzelnen Unternehmens',
        'Begrenzte Anpassungsmöglichkeiten'
      ]
    }
  }
]



