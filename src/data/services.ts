/**
 * Services Data Layer
 * 
 * Single source of truth for all service definitions.
 * Follows DRY principles with type-safe, modular data structure.
 * 
 * Architecture:
 * - Data layer completely separated from presentation
 * - Reusable interfaces for type safety
 * - Easy to extend without modifying components
 * - Ready for CMS integration (markdown/database)
 */

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

export interface ServiceFeature {
  title: string
  description: string
  icon: LucideIcon
}

export interface ServiceProcess {
  step: number
  title: string
  description: string
}

export interface ServicePricing {
  base: string
  details: string[]
  mediaPrices?: string[]
}

export interface ServiceHero {
  title: string
  subtitle: string
  description: string
}

export interface ServiceDefinition {
  title: string
  description: string
  icon: LucideIcon
  hero: ServiceHero
  features: ServiceFeature[]
  pricing?: ServicePricing
  process?: ServiceProcess[]
  slug: string
}

export const services: Record<string, ServiceDefinition> = {
  'computer-repair-upgrades': {
    slug: 'computer-repair-upgrades',
    title: 'Computerreparatur & Aufrüstungen',
    description: 'Expertenreparaturen für alle Arten von Computern und Komponenten. Wir spezialisieren uns darauf zu reparieren, was andere nicht koennen, einschliesslich Motherboard-Reparaturen und Bauteil-Level-Fixes.',
    icon: HardDrive,
    hero: {
      title: 'Computerreparatur & Aufrüstungen',
      subtitle: 'Vertrauensvolle Expertenreparaturen',
      description: 'Wir kombinieren technische Expertise mit nachhaltigen Praktiken, um die Lebensdauer Ihrer Geräte zu verlängern. Unsere Reparaturdienste konzentrieren sich darauf zu reparieren, was andere nicht koennen, und sparen Ihnen Geld und reduzieren Elektroschrott.'
    },
    features: [
      {
        title: 'Bauteil-Level-Reparaturen',
        description: 'Wir ersetzen nicht nur Teile - wir reparieren sie. Unsere Techniker koennen Motherboards, Netzteile und andere Komponenten auf Schaltkreisebene reparieren.',
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
        description: 'Sie erhalten einen transparenten Kostenvoranschlag für die Reparatur, einschliesslich Teile- und Arbeitskosten.'
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
    slug: 'data-recovery-transfer',
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
        description: 'Übertragen Sie Daten zwischen Computern, migrieren Sie Einstellungen oder erstellen Sie Backups. Wir koennen grosse Datenmengen effizient verarbeiten.',
        icon: FolderInput
      },
      {
        title: 'Zugang zu alten Medien',
        description: 'Zugang zu Daten von jedem Speichermedium, auch wenn Sie das erforderliche Laufwerk nicht mehr haben. Wir unterstützen alle Formate einschliesslich Disketten, ZIP-Laufwerke, MO-Laufwerke und mehr.',
        icon: Disc
      },
      {
        title: 'Massgeschneiderte Lösungen',
        description: 'Benötigen Sie eine ähnliche Server-Einrichtung für Ihren Standort? Wir koennen eine massgeschneiderte Lösung erstellen, die auf Ihre spezifischen Bedürfnisse zugeschnitten ist.',
        icon: Database
      }
    ],
    pricing: {
      base: 'CHF 30 pro Auftrag + Medienkosten',
      details: [
        'Grundgebühr: CHF 30 pro Auftrag',
        'Medienkosten zusätzlich, falls nicht bereitgestellt',
        'Unterstützung für alte Medien verfügbar',
        'Massgeschneiderte Lösungen auf Anfrage'
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
  'hardware-recycling': {
    slug: 'hardware-recycling',
    title: 'Hardware-Recycling',
    description: 'Verantwortungsvolles Recycling und Aufarbeitung von IT-Ausrüstung. Wir geben Ihren alten Geräten ein neues Leben und sorgen gleichzeitig für sichere Datenlöschung.',
    icon: Archive,
    hero: {
      title: 'Hardware-Recycling',
      subtitle: 'Ein neues Leben für Ihre alte Ausrüstung',
      description: 'Wir nehmen Ihre alte IT-Ausrüstung und geben ihr ein zweites Leben. Durch unsere verantwortungsvollen Recycling-Praktiken reduzieren wir Elektroschrott und machen Technologie für alle zugänglich.'
    },
    features: [
      {
        title: 'Verantwortungsvolle Entsorgung',
        description: 'Wir arbeiten nur mit zertifizierten Recycling-Partnern zusammen, die strenge Umweltstandards einhalten.',
        icon: Archive
      },
      {
        title: 'Sichere Datenlöschung',
        description: 'Alle Geräte werden vor der Entsorgung oder dem Verkauf professionell von Daten befreit.',
        icon: Shield
      },
      {
        title: 'Aufbereitung und Verkauf',
        description: 'Funktionsfähige Geräte werden aufbereitet und zu erschwinglichen Preisen verkauft.',
        icon: CheckCircle2
      },
      {
        title: 'Abholservice',
        description: 'Für grössere Mengen bieten wir einen kostenlosen Abholservice in der Region Zürich an.',
        icon: Clock
      }
    ],
    pricing: {
      base: 'Kostenlos',
      details: [
        'Kostenlose Annahme für die meisten Artikel',
        'Für grössere Mengen Abholservice verfügbar',
        'Spezielle Geräte: Bitte kontaktieren Sie uns'
      ]
    }
  },
  'linux-open-source': {
    slug: 'linux-open-source',
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
        title: 'Linux-Installation',
        description: 'Von Desktop-Umgebungen bis zu Server-Konfigurationen - wir installieren und konfigurieren Linux-Systeme für alle Anwendungsfälle.',
        icon: Server
      },
      {
        title: 'Migration-Unterstützung',
        description: 'Hilfe beim Übergang von Windows zu Linux, einschliesslich Datenmigration und Software-Alternativen.',
        icon: FolderInput
      },
      {
        title: 'Schulung und Support',
        description: 'Umfassende Schulung und laufender Support, um sicherzustellen, dass Sie das Beste aus Ihrem Linux-System herausholen.',
        icon: Clock
      },
      {
        title: 'Open Source Software',
        description: 'Wir empfehlen und implementieren Open-Source-Alternativen zu proprietärer Software.',
        icon: Code
      }
    ],
    pricing: {
      base: 'CHF 70/hour',
      details: [
        'Free initial consultation',
        'Custom Linux distributions',
        'Migration assistance',
        'Ongoing support available'
      ]
    }
  },
  'web-design-development': {
    slug: 'web-design-development',
    title: 'Webdesign & Entwicklung',
    description: 'Modern web design and development using open-source technologies. Fast, responsive websites built with Next.js, Headless CMS, and sustainable practices.',
    icon: Globe,
    hero: {
      title: 'Webdesign & Entwicklung',
      subtitle: 'Modern, Sustainable Web Solutions',
      description: 'We create fast, beautiful, and functional websites using the latest open-source technologies. From landing pages to complex web applications, we deliver scalable solutions that prioritize performance and sustainability.'
    },
    features: [
      {
        title: 'Modern Stack',
        description: 'Next.js 14+, React 18, TypeScript, Tailwind CSS - we use cutting-edge technologies for optimal performance.',
        icon: Code
      },
      {
        title: 'Open Source CMS',
        description: 'Headless CMS solutions with Strapi, Payload, or TinaCMS for flexible content management.',
        icon: Database
      },
      {
        title: 'Responsive Design',
        description: 'Mobile-first approach ensuring your website looks great on all devices.',
        icon: Palette
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

/**
 * Get service by slug
 */
export function getServiceBySlug(slug: string): ServiceDefinition | undefined {
  return services[slug]
}

/**
 * Get all services
 */
export function getAllServices(): ServiceDefinition[] {
  return Object.values(services)
}

/**
 * Get service slugs for static generation
 */
export function getAllServiceSlugs(): string[] {
  return Object.keys(services)
}

