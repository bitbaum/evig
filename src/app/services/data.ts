import {
  Wrench,
  HardDrive,
  Server,
  Shield,
  Code,
  Globe,
  Brain,
  Cloud,
  Cpu,
  Settings,
} from 'lucide-react'
import type { FilterConfig } from '@/hooks/useFiltering'

export interface Service {
  title: string
  slug?: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  category: string
  features: string[]
  pricing: string
  highlight: string
  href: string
  available: boolean
  badge?: string
  [key: string]: unknown  // Allow index access for FilterableItem compatibility
}

export const services: Service[] = [
  // Hardware Services
  {
    slug: 'computer-repair',
    title: 'Computerreparatur & Aufrüstungen',
    description: 'Expertenreparaturen für alle Arten von Computern und Komponenten. Wir spezialisieren uns darauf zu reparieren, was andere nicht können, einschliesslich Motherboard-Reparaturen und Bauteil-Level-Fixes.',
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
    slug: 'data-recovery',
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
    slug: 'linux-installation',
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
      'Massgeschneiderte Entwicklung',
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
    description: 'Erhalten Sie einen massgeschneiderten Computer für Ihre spezifischen Bedürfnisse, unterstützt durch KI-Analyse unseres umfangreichen Inventars. Wir beziehen Teile global und bieten professionelle Montage.',
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
      'Massgeschneiderte Schulung auf Ihren Dokumenten'
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
    icon: Server,
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
      'Massgeschneiderte IoT-Entwicklung',
      'Dateneigentum garantiert'
    ],
    pricing: '',
    highlight: 'Bald verfügbar',
    href: '/services/iot-solutions',
    available: false,
    badge: 'Soon'
  }
]

export const serviceFilters: FilterConfig[] = [
  {
    key: 'category',
    label: 'Nach Kategorie filtern',
    options: ['Hardware-Dienstleistungen', 'Software-Lösungen', 'Bald verfügbar'],
    color: 'green'
  }
]
