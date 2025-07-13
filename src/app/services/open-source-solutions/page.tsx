import { Metadata } from 'next'
import { 
  Code, 
  Shield, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Zap,
  Database,
  Server,
  Terminal,
  Lock,
  Globe,
  Heart,
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
  Share2
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Open-Source-Lösungen | RevampIT',
  description: 'Professionelle Implementierung, Unterstützung und Schulung für Open-Source-Software für Unternehmen und Privatpersonen.',
}

const benefits = [
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

const popularApps = [
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

const features = [
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

const consumerComparisons = [
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
      name: 'Twitter/Instagram',
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

const businessComparisons = [
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

const emergingTechComparisons = [
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

export default function OpenSourceSolutionsPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-800 to-green-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">Open-Source-Lösungen</h1>
            <p className="text-xl text-green-100">
              Professionelle Implementierung von Open-Source-Software, die proprietären Alternativen entspricht oder diese übertrifft.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Warum Open Source wählen?</h2>
            <p className="text-lg text-gray-600">
              Open-Source-Software bietet einen überlegenen Wert, Sicherheit und Flexibilität im Vergleich zu proprietären Alternativen.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-green-50 rounded-xl p-8">
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

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Unsere Dienstleistungen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
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

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-700 to-green-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Bereit für Open Source?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-green-100">
            Schliessen Sie sich Tausenden von Einzelpersonen und Unternehmen an, die erfolgreich auf Open-Source-Lösungen umgestiegen sind.
            Unser Expertenteam ist bereit, Ihnen beim Wechsel zu helfen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-white text-green-800 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-300 text-lg"
            >
              Starten Sie noch heute
            </Link>
            <Link
              href="/services"
              className="inline-block border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-colors duration-300 text-lg"
            >
              Alle Dienstleistungen entdecken
            </Link>
          </div>
          <div className="mt-12">
            <h3 className="text-2xl font-bold mb-4">Warum RevampIT wählen?</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/10 rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-2">Expertenberatung</h4>
                <p className="text-green-100">Professionelle Unterstützung für Ihre Open-Source-Reise</p>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-2">Massgeschneiderte Lösungen</h4>
                <p className="text-green-100">Zugeschnitten auf Ihre spezifischen Bedürfnisse und Anforderungen</p>
              </div>
              <div className="bg-white/10 rounded-lg p-6">
                <h4 className="text-xl font-semibold mb-2">Laufender Support</h4>
                <p className="text-green-100">Kontinuierliche Unterstützung und Wartung</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verification Note */}
      <div className="bg-gray-50 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 text-sm">
            Alle bereitgestellten Informationen sind zum {new Date().toLocaleDateString('de-CH', { year: 'numeric', month: 'long' })} korrekt.
            Wir aktualisieren unsere Inhalte regelmässig, um die neuesten Entwicklungen in der Open-Source-Software widerzuspiegeln.
          </p>
        </div>
      </div>

      {/* Comparison Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold mb-6">Open-Source-Lösungen</h2>
            <p className="text-lg text-gray-600">
              Entdecken Sie leistungsstarke Open-Source-Alternativen zu teurer proprietärer Software.
              Alle diese Lösungen sind kostenlos, werden regelmässig aktualisiert und von der Community vorangetrieben.
            </p>
          </div>

          {/* Consumer Solutions */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-center">Lösungen für Verbraucher</h3>
            <div className="space-y-12">
              {consumerComparisons.map((comparison, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8 shadow-lg">
                  <h4 className="text-2xl font-bold mb-8 text-center">{comparison.category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Open Source Solution */}
                    <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                          <comparison.openSource.icon className="w-8 h-8" />
                        </div>
                        <div>
                          <h5 className="text-2xl font-bold">{comparison.openSource.name}</h5>
                          <p className="text-green-600 font-medium">Open Source • {comparison.openSource.cost}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {comparison.openSource.comparisons.map((item, i) => (
                          <div key={i} className="flex items-start">
                            <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5">
                              <FileCheck className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-gray-600">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Proprietary Solution */}
                    <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-gray-100 rounded-lg text-gray-600 mr-4">
                          <comparison.proprietary.icon className="w-8 h-8" />
                        </div>
                        <div>
                          <h5 className="text-2xl font-bold">{comparison.proprietary.name}</h5>
                          <p className="text-gray-600 font-medium">Proprietär • {comparison.proprietary.cost}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {comparison.proprietary.comparisons.map((item, i) => (
                          <div key={i} className="flex items-start">
                            <div className="p-1 bg-gray-100 rounded-full mr-3 mt-0.5">
                              <FileX className="w-4 h-4 text-gray-500" />
                            </div>
                            <span className="text-gray-600">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Business Solutions */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-center">Lösungen für Unternehmen</h3>
            <div className="space-y-12">
              {businessComparisons.map((comparison, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8 shadow-lg">
                  <h4 className="text-2xl font-bold mb-8 text-center">{comparison.category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Open Source Solution */}
                    <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                          <comparison.openSource.icon className="w-8 h-8" />
                        </div>
                        <div>
                          <h5 className="text-2xl font-bold">{comparison.openSource.name}</h5>
                          <p className="text-green-600 font-medium">Open Source • {comparison.openSource.cost}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {comparison.openSource.comparisons.map((item, i) => (
                          <div key={i} className="flex items-start">
                            <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5">
                              <FileCheck className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-gray-600">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Proprietary Solution */}
                    <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-gray-100 rounded-lg text-gray-600 mr-4">
                          <comparison.proprietary.icon className="w-8 h-8" />
                        </div>
                        <div>
                          <h5 className="text-2xl font-bold">{comparison.proprietary.name}</h5>
                          <p className="text-gray-600 font-medium">Proprietär • {comparison.proprietary.cost}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {comparison.proprietary.comparisons.map((item, i) => (
                          <div key={i} className="flex items-start">
                            <div className="p-1 bg-gray-100 rounded-full mr-3 mt-0.5">
                              <FileX className="w-4 h-4 text-gray-500" />
                            </div>
                            <span className="text-gray-600">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emerging Technologies */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-center">Aufstrebende Technologien</h3>
            <div className="space-y-12">
              {emergingTechComparisons.map((comparison, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-8 shadow-lg">
                  <h4 className="text-2xl font-bold mb-8 text-center">{comparison.category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Open Source Solution */}
                    <div className="bg-green-50 rounded-lg p-6 border-2 border-green-200">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-green-100 rounded-lg text-green-600 mr-4">
                          <comparison.openSource.icon className="w-8 h-8" />
                        </div>
                        <div>
                          <h5 className="text-2xl font-bold">{comparison.openSource.name}</h5>
                          <p className="text-green-600 font-medium">Open Source • {comparison.openSource.cost}</p>
                        </div>
                      </div>
                      {comparison.openSource.examples && (
                        <div className="mb-6">
                          <h6 className="text-lg font-semibold mb-3">Beliebte Beispiele:</h6>
                          <ul className="space-y-2">
                            {comparison.openSource.examples.map((example, i) => (
                              <li key={i} className="flex items-start">
                                <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5">
                                  <FileCheck className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="text-gray-600">{example}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="space-y-4">
                        <h6 className="text-lg font-semibold mb-3">Wichtige Vorteile:</h6>
                        {comparison.openSource.comparisons.map((item, i) => (
                          <div key={i} className="flex items-start">
                            <div className="p-1 bg-green-100 rounded-full mr-3 mt-0.5">
                              <FileCheck className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-gray-600">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Proprietary Solution */}
                    <div className="bg-gray-50 rounded-lg p-6 border-2 border-gray-200">
                      <div className="flex items-center mb-4">
                        <div className="p-3 bg-gray-100 rounded-lg text-gray-600 mr-4">
                          <comparison.proprietary.icon className="w-8 h-8" />
                        </div>
                        <div>
                          <h5 className="text-2xl font-bold">{comparison.proprietary.name}</h5>
                          <p className="text-gray-600 font-medium">Proprietär • {comparison.proprietary.cost}</p>
                        </div>
                      </div>
                      {comparison.proprietary.examples && (
                        <div className="mb-6">
                          <h6 className="text-lg font-semibold mb-3">Beliebte Beispiele:</h6>
                          <ul className="space-y-2">
                            {comparison.proprietary.examples.map((example, i) => (
                              <li key={i} className="flex items-start">
                                <div className="p-1 bg-gray-100 rounded-full mr-3 mt-0.5">
                                  <FileX className="w-4 h-4 text-gray-500" />
                                </div>
                                <span className="text-gray-600">{example}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="space-y-4">
                        <h6 className="text-lg font-semibold mb-3">Wichtige Merkmale:</h6>
                        {comparison.proprietary.comparisons.map((item, i) => (
                          <div key={i} className="flex items-start">
                            <div className="p-1 bg-gray-100 rounded-full mr-3 mt-0.5">
                              <FileX className="w-4 h-4 text-gray-500" />
                            </div>
                            <span className="text-gray-600">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}