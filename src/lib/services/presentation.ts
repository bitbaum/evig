/**
 * Service Presentation Config
 *
 * Rich display data for services (icons, features, process steps).
 * This complements the operational data from the database.
 *
 * Note: Basic info (name, description, price) comes from the database.
 * This config only contains presentation-specific data that doesn't
 * belong in a database (icons, detailed feature lists, process steps).
 */

import { formatPriceCents } from '@/config/marketplace'

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
  Wrench,
} from 'lucide-react'
import type { ServicePresentation, ServicePricing } from './types'

/**
 * Presentation config for each service
 * Keyed by slug (must match database slug)
 */
export const servicePresentation: Record<string, ServicePresentation> = {
  'computer-repair-upgrades': {
    icon: HardDrive,
    hero: {
      title: 'Computerreparatur & Aufrüstungen',
      subtitle: 'Vertrauensvolle Expertenreparaturen',
      description:
        'Wir kombinieren technische Expertise mit nachhaltigen Praktiken, um die Lebensdauer Ihrer Geräte zu verlängern. Unsere Reparaturdienste konzentrieren sich darauf zu reparieren, was andere nicht können, und sparen Ihnen Geld und reduzieren Elektroschrott.',
    },
    features: [
      {
        title: 'Bauteil-Level-Reparaturen',
        description:
          'Wir ersetzen nicht nur Teile - wir reparieren sie. Unsere Techniker können Motherboards, Netzteile und andere Komponenten auf Schaltkreisebene reparieren.',
        icon: HardDrive,
      },
      {
        title: 'Hardware-Aufrüstungen',
        description:
          'Verlängern Sie die Lebensdauer Ihres Computers mit strategischen Aufrüstungen. Wir helfen Ihnen bei der Auswahl und Installation der richtigen Komponenten für Ihre Bedürfnisse.',
        icon: Zap,
      },
      {
        title: 'Diagnosedienste',
        description:
          'Umfassende Diagnose zur schnellen Identifizierung und Behebung von Problemen. Wir verwenden professionelle Werkzeuge und jahrelange Erfahrung, um Probleme genau zu lokalisieren.',
        icon: Database,
      },
      {
        title: 'Professionelle Bewertung',
        description:
          'Alle Reparaturen beginnen mit einer gründlichen Bewertung, um die beste Vorgehensweise zu bestimmen und einen genauen Kostenvoranschlag zu erstellen.',
        icon: Clock,
      },
    ],
    process: [
      {
        step: 1,
        title: 'Bewertung',
        description:
          'Wir untersuchen Ihr Gerät und erstellen eine detaillierte Bewertung des Problems. Die CHF 30 Bewertungsgebühr wird in Ihre endgültigen Reparaturkosten einbezogen.',
      },
      {
        step: 2,
        title: 'Kostenvoranschlag',
        description:
          'Sie erhalten einen transparenten Kostenvoranschlag für die Reparatur, einschliesslich Teile- und Arbeitskosten.',
      },
      {
        step: 3,
        title: 'Reparatur',
        description:
          'Unsere Techniker reparieren Ihr Gerät mit hochwertigen Teilen. Die typische Reparaturzeit beträgt einige Wochen aufgrund der Teileverfügbarkeit.',
      },
      {
        step: 4,
        title: 'Testen',
        description:
          'Wir testen alle Reparaturen gründlich, um sicherzustellen, dass Ihr Gerät perfekt funktioniert, bevor es zurückgegeben wird.',
      },
    ],
    pricingOverride: {
      base: 'CHF 70/Stunde + Teile',
      details: [
        'Professionelle Bewertung erforderlich',
        'Bauteil-Level-Reparaturen',
        'Hardware-Aufrüstungen verfügbar',
        'Qualitätsgarantie inbegriffen',
      ],
    },
  },

  'data-recovery-transfer': {
    icon: HardDrive,
    hero: {
      title: 'Datenrettung & Transfer',
      subtitle: 'Zugang zu Ihren Daten, Bewahrung Ihrer Geschichte',
      description:
        'Ob Sie Daten von einem nicht funktionierenden Gerät wiederherstellen, Daten zwischen Computern übertragen oder auf Daten von alten Speichermedien zugreifen müssen - wir haben die Expertise und Ausrüstung, um zu helfen.',
    },
    features: [
      {
        title: 'Medienunterstützung',
        description:
          'Unser Dino-Server verfügt über 14 frontzugängliche Laufwerke und mehrere Schnittstellen, bereit für fast jede Datenübertragungsaufgabe.',
        icon: Server,
      },
      {
        title: 'Datenübertragung',
        description:
          'Übertragen Sie Daten zwischen Computern, migrieren Sie Einstellungen oder erstellen Sie Backups. Wir können grosse Datenmengen effizient verarbeiten.',
        icon: FolderInput,
      },
      {
        title: 'Zugang zu alten Medien',
        description:
          'Zugang zu Daten von jedem Speichermedium, auch wenn Sie das erforderliche Laufwerk nicht mehr haben. Wir unterstützen alle Formate einschliesslich Disketten, ZIP-Laufwerke, MO-Laufwerke und mehr.',
        icon: Disc,
      },
      {
        title: 'Massgeschneiderte Lösungen',
        description:
          'Benötigen Sie eine ähnliche Server-Einrichtung für Ihren Standort? Wir können eine massgeschneiderte Lösung erstellen, die auf Ihre spezifischen Bedürfnisse zugeschnitten ist.',
        icon: Database,
      },
    ],
    process: [
      {
        step: 1,
        title: 'Assessment',
        description:
          'Wir bewerten Ihre Speichermedien und bestimmen den besten Ansatz für Datenübertragung oder -wiederherstellung.',
      },
      {
        step: 2,
        title: 'Transfer',
        description:
          'Mit unserer spezialisierten Ausrüstung übertragen wir Ihre Daten auf das Medium Ihrer Wahl.',
      },
      {
        step: 3,
        title: 'Verification',
        description:
          'Wir überprüfen die Integrität der übertragenen Daten, um sicherzustellen, dass alles korrekt kopiert wurde.',
      },
      {
        step: 4,
        title: 'Lieferung',
        description:
          'Ihre Daten werden Ihnen auf dem Medium Ihrer Wahl zurückgegeben, bereit zur Verwendung.',
      },
    ],
    pricingOverride: {
      base: 'CHF 30 pro Auftrag + Medienkosten',
      details: [
        'Grundgebühr: CHF 30 pro Auftrag',
        'Medienkosten zusätzlich, falls nicht bereitgestellt',
        'Unterstützung für alte Medien verfügbar',
        'Massgeschneiderte Lösungen auf Anfrage',
      ],
      mediaPrices: [
        'Disketten (3.5" und 5.25"): CHF 10 pro Diskette',
        'ZIP/Syquest/EZ Drive/Jazz: CHF 20 pro Diskette',
        'MO-Laufwerke (3.5"-5.25"): CHF 30 pro Diskette',
        'Festplatten: CHF 40 pro Festplatte',
        'Bandlaufwerke: CHF 50 pro Band',
        'VHS/Schallplatten: Preis auf Anfrage',
      ],
    },
  },

  'hardware-recycling': {
    icon: Archive,
    hero: {
      title: 'Hardware-Recycling',
      subtitle: 'Ein neues Leben für Ihre alte Ausrüstung',
      description:
        'Wir nehmen Ihre alte IT-Ausrüstung und geben ihr ein zweites Leben. Durch unsere verantwortungsvollen Recycling-Praktiken reduzieren wir Elektroschrott und machen Technologie für alle zugänglich.',
    },
    features: [
      {
        title: 'Verantwortungsvolle Entsorgung',
        description:
          'Wir arbeiten nur mit zertifizierten Recycling-Partnern zusammen, die strenge Umweltstandards einhalten.',
        icon: Archive,
      },
      {
        title: 'Sichere Datenlöschung',
        description:
          'Alle Geräte werden vor der Entsorgung oder dem Verkauf professionell von Daten befreit.',
        icon: Shield,
      },
      {
        title: 'Aufbereitung und Verkauf',
        description:
          'Funktionsfähige Geräte werden aufbereitet und zu erschwinglichen Preisen verkauft.',
        icon: CheckCircle2,
      },
      {
        title: 'Abholservice',
        description:
          'Für grössere Mengen bieten wir einen kostenlosen Abholservice in der Region Zürich an.',
        icon: Clock,
      },
    ],
    pricingOverride: {
      base: 'Kostenlos',
      details: [
        'Kostenlose Annahme für die meisten Artikel',
        'Für grössere Mengen Abholservice verfügbar',
        'Spezielle Geräte: Bitte kontaktieren Sie uns',
      ],
    },
  },

  'linux-open-source': {
    icon: Server,
    hero: {
      title: 'Linux & Open Source Lösungen',
      subtitle: 'Experten Open Source Support',
      description:
        'Wir helfen Ihnen beim Übergang zu und der Wartung von Linux- und Open-Source-Software-Lösungen und bieten fachkundige Unterstützung und Schulung.',
    },
    features: [
      {
        title: 'Linux-Installation',
        description:
          'Von Desktop-Umgebungen bis zu Server-Konfigurationen - wir installieren und konfigurieren Linux-Systeme für alle Anwendungsfälle.',
        icon: Server,
      },
      {
        title: 'Migration-Unterstützung',
        description:
          'Hilfe beim Übergang von Windows zu Linux, einschliesslich Datenmigration und Software-Alternativen.',
        icon: FolderInput,
      },
      {
        title: 'Schulung und Support',
        description:
          'Umfassende Schulung und laufender Support, um sicherzustellen, dass Sie das Beste aus Ihrem Linux-System herausholen.',
        icon: Clock,
      },
      {
        title: 'Open Source Software',
        description:
          'Wir empfehlen und implementieren Open-Source-Alternativen zu proprietärer Software.',
        icon: Code,
      },
    ],
    pricingOverride: {
      base: 'CHF 70/Stunde',
      details: [
        'Kostenlose Erstberatung',
        'Individuelle Linux-Distributionen',
        'Migrations-Unterstützung',
        'Laufender Support verfügbar',
      ],
    },
  },

  'web-design-development': {
    icon: Globe,
    hero: {
      title: 'Webdesign & Entwicklung',
      subtitle: 'Moderne, nachhaltige Web-Lösungen',
      description:
        'Wir erstellen schnelle, schöne und funktionale Websites mit den neuesten Open-Source-Technologien. Von Landing Pages bis zu komplexen Webanwendungen liefern wir skalierbare Lösungen, die Performance und Nachhaltigkeit priorisieren.',
    },
    features: [
      {
        title: 'Moderner Stack',
        description:
          'Next.js 14+, React 18, TypeScript, Tailwind CSS - wir verwenden modernste Technologien für optimale Performance.',
        icon: Code,
      },
      {
        title: 'Open Source CMS',
        description:
          'Headless CMS-Lösungen mit Strapi, Payload oder TinaCMS für flexibles Content-Management.',
        icon: Database,
      },
      {
        title: 'Responsive Design',
        description:
          'Mobile-first-Ansatz, der sicherstellt, dass Ihre Website auf allen Geräten grossartig aussieht.',
        icon: Palette,
      },
      {
        title: 'Laufender Support',
        description:
          'Umfassende Wartung und Support, um Ihre Website sicher, aktuell und leistungsfähig zu halten.',
        icon: Shield,
      },
    ],
    pricingOverride: {
      base: 'CHF 70/Stunde',
      details: [
        'Kostenlose Erstberatung',
        'Open-Source-Technologien',
        'Responsive Design inklusive',
        'SEO-Optimierung',
        'Laufender Support verfügbar',
      ],
    },
  },

  // Non-featured services (bookable but not on main page)
  consultation: {
    icon: Clock,
    hero: {
      title: 'Beratung',
      subtitle: 'Technische Expertise für Ihre Fragen',
      description:
        'Persönliche Beratung zu Linux, Open-Source oder Hardware-Themen.',
    },
    features: [
      {
        title: 'Individuelle Beratung',
        description: 'Persönliche Beratung zu Ihren spezifischen Fragen und Anforderungen.',
        icon: Clock,
      },
    ],
  },

  'custom-build': {
    icon: Wrench,
    hero: {
      title: 'Massgeschneiderter PC',
      subtitle: 'Ihr Traumcomputer, von Experten gebaut',
      description:
        'Wir bauen Ihren individuellen Computer nach Ihren Spezifikationen und Bedürfnissen.',
    },
    features: [
      {
        title: 'Individuelle Konfiguration',
        description: 'Wir beraten Sie bei der Auswahl der besten Komponenten für Ihre Bedürfnisse.',
        icon: Wrench,
      },
      {
        title: 'Professioneller Zusammenbau',
        description: 'Erfahrene Techniker bauen Ihren PC mit Sorgfalt und Präzision.',
        icon: HardDrive,
      },
    ],
  },
}

/**
 * Default presentation for services without custom config
 */
export const defaultPresentation: ServicePresentation = {
  icon: Wrench,
  hero: {
    title: 'Service',
    subtitle: 'Professioneller IT-Service',
    description: 'Professionelle IT-Dienstleistungen von RevampIT.',
  },
  features: [],
}

/**
 * Get presentation config for a service
 * Falls back to default if not found
 */
export function getServicePresentation(slug: string): ServicePresentation {
  return servicePresentation[slug] || defaultPresentation
}

/**
 * Get pricing info for a service
 * Uses override from presentation config if available,
 * otherwise generates from database price
 */
export function getServicePricing(
  slug: string,
  priceCents: number | null
): ServicePricing {
  const presentation = getServicePresentation(slug)

  // Use override if available
  if (presentation.pricingOverride) {
    return presentation.pricingOverride
  }

  // Generate from price
  return {
    base: formatPriceCents(priceCents),
    details: [],
  }
}
