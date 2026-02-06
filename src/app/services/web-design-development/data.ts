import {
  Globe,
  Code,
  Palette,
  Smartphone,
  Search,
  Shield,
  Zap,
  Heart,
  Database,
  Cloud,
  Layers,
  Rocket,
} from 'lucide-react'

export const benefits = [
  {
    title: 'Automatisierungs-First-Design',
    description: 'Wir priorisieren automatisierte Arbeitsabläufe, die den manuellen Verwaltungsaufwand minimieren und gleichzeitig alle unsere Grundprinzipien beibehalten. Maximale Effizienz ohne Kompromisse.',
    icon: Zap
  },
  {
    title: 'Open-Source-Grundlage',
    description: 'Aufgebaut auf transparenten, überprüfbaren Technologien, die Ihnen vollständige Kontrolle und Freiheit geben. Keine Anbieterbindung, keine proprietären Black Boxes.',
    icon: Code
  },
  {
    title: 'Nahtlose Benutzererfahrung',
    description: 'Intuitive Benutzeroberflächen, die von den Benutzern nur minimalen Aufwand erfordern und gleichzeitig maximale Funktionalität bieten. Jede Interaktion ist auf Einfachheit und Effektivität ausgelegt.',
    icon: Smartphone
  },
  {
    title: 'Entwicklerfreundliche Architektur',
    description: 'Sauberer, wartbarer Code mit ausgezeichneter Dokumentation und Tools. Gebaut für langfristige Nachhaltigkeit und einfache Wartung.',
    icon: Search
  }
]

export const technologies = [
  {
    name: 'Next.js & React',
    description: 'Modernes React-Framework zum Erstellen schneller, skalierbarer Webanwendungen mit hervorragender Entwicklererfahrung und integrierter Optimierung.',
    icon: Code,
    category: 'Frontend',
    benefits: ['Serverseitiges Rendering', 'Hervorragende Leistung', 'Grossartiges SEO', 'Aktive Community'],
    url: 'https://nextjs.org'
  },
  {
    name: 'Tailwind CSS',
    description: 'Utility-First-CSS-Framework zum schnellen Erstellen moderner, responsiver Benutzeroberflächen mit konsistentem Design.',
    icon: Palette,
    category: 'Frontend',
    benefits: ['Schnelle Entwicklung', 'Konsistentes Design', 'Standardmässig responsiv', 'Sehr anpassbar'],
    url: 'https://tailwindcss.com'
  },
  {
    name: 'Supabase',
    description: 'Open-Source-Firebase-Alternative, die sofortige APIs, Echtzeit-Abonnements, Authentifizierung und Edge-Funktionen bietet.',
    icon: Database,
    category: 'Backend',
    benefits: ['Sofortige APIs', 'Echtzeit-Updates', 'Integrierte Authentifizierung', 'Edge-Funktionen'],
    url: 'https://supabase.com'
  },
  {
    name: 'Strapi',
    description: 'Führendes Open-Source-Headless-CMS, das Entwicklern die Freiheit gibt, ihre bevorzugten Tools und Frameworks zu wählen.',
    icon: Layers,
    category: 'CMS',
    benefits: ['API-First-Ansatz', 'Flexible Inhaltstypen', 'Entwicklerfreundlich', 'Selbst gehostet'],
    url: 'https://strapi.io'
  },
  {
    name: 'Payload CMS',
    description: 'TypeScript-First-Headless-CMS und Anwendungsframework, das mit Node.js, React und MongoDB erstellt wurde.',
    icon: Shield,
    category: 'CMS',
    benefits: ['TypeScript nativ', 'Admin-Benutzeroberfläche enthalten', 'Sehr erweiterbar', 'Fokus auf Entwicklererfahrung'],
    url: 'https://payloadcms.com'
  },
  {
    name: 'Tina CMS',
    description: 'Git-basiertes Headless-CMS, das die Bearbeitung von Inhalten direkt auf Ihrer Website mit visueller Echtzeitbearbeitung ermöglicht.',
    icon: Code,
    category: 'CMS',
    benefits: ['Visuelle Bearbeitung', 'Git-basierter Workflow', 'Echtzeit-Vorschau', 'Entwicklerfreundlich'],
    url: 'https://tina.io'
  },
  {
    name: 'WordPress',
    description: 'Ausgereiftes Content-Management-System, das für bestimmte Anwendungsfälle immer noch beliebt ist. Wir können mit bestehenden WordPress-Websites arbeiten.',
    icon: Globe,
    category: 'CMS',
    benefits: ['Grosses Ökosystem', 'Einfache Inhaltsverwaltung', 'Umfangreiche Plugins', 'Vielen Benutzern vertraut'],
    url: 'https://wordpress.org'
  },
  {
    name: 'Joomla',
    description: 'Flexibles Content-Management-System mit robuster Benutzerverwaltung und mehrsprachigen Funktionen. Ideal für komplexe Websites.',
    icon: Globe,
    category: 'CMS',
    benefits: ['Benutzerverwaltung', 'Mehrsprachige Unterstützung', 'Flexible Vorlagen', 'Starke Community'],
    url: 'https://www.joomla.org'
  },
  {
    name: 'Medusa.js',
    description: 'Moderne, quelloffene E-Commerce-Plattform für Entwickler. Headless Commerce mit leistungsstarken APIs und Anpassungsmöglichkeiten.',
    icon: Globe,
    category: 'E-Commerce',
    benefits: ['Headless-Architektur', 'Entwicklerfreundlich', 'Sehr anpassbar', 'Moderner Tech-Stack'],
    url: 'https://medusajs.com'
  },
  {
    name: 'Shopware 6',
    description: 'Moderne, API-First-E-Commerce-Plattform mit leistungsstarken Anpassungsmöglichkeiten. Open-Source-Kern mit kommerziellen Erweiterungen.',
    icon: Globe,
    category: 'E-Commerce',
    benefits: ['API-First-Design', 'Flexible Architektur', 'Umfangreiche Admin-Oberfläche', 'Deutsche Ingenieurskunst'],
    url: 'https://www.shopware.com'
  },
  {
    name: 'Bereitstellung & Hosting',
    description: 'Flexible Hosting-Optionen von Open-Source-Lösungen auf Linux-Servern bis hin zu modernen Plattformen wie Vercel und Netlify (proprietär, aber grosszügige kostenlose Stufen).',
    icon: Cloud,
    category: 'Infrastruktur',
    benefits: ['Mehrere Hosting-Optionen', 'Globales CDN', 'Automatische Skalierung', 'Git-basierter Workflow'],
    url: 'https://vercel.com'
  }
]

export const services = [
  {
    title: 'Benutzerdefinierte Webentwicklung',
    description: 'Massgeschneiderte Webanwendungen, die mit modernen Open-Source-Technologien erstellt werden, um Ihre spezifischen Geschäftsanforderungen zu erfüllen.',
    icon: Code,
    features: [
      'Benutzerdefinierte Webanwendungen',
      'E-Commerce-Lösungen',
      'API-Entwicklung',
      'Datenbankdesign',
      'Leistungsoptimierung'
    ]
  },
  {
    title: 'Responsives Webdesign',
    description: 'Schöne, benutzerfreundliche Designs, die auf allen Geräten und Bildschirmgrössen perfekt funktionieren.',
    icon: Palette,
    features: [
      'Mobile-First-Design',
      'User Experience (UX) Design',
      'User Interface (UI) Design',
      'Integration der Markenidentität',
      'Barrierefreiheitskonformität'
    ]
  },
  {
    title: 'CMS-Entwicklung',
    description: 'Moderne Content-Management-Systeme, die Ihnen die volle Kontrolle über Ihre Website-Inhalte mit entwicklerfreundlichen APIs geben.',
    icon: Globe,
    features: [
      'Headless-CMS-Lösungen (Strapi, Payload, Tina)',
      'WordPress-Entwicklung (Legacy-Support)',
      'Benutzerdefinierte CMS-Lösungen',
      'Inhaltsmigration',
      'Schulung und Support'
    ]
  },
  {
    title: 'Website-Wartung',
    description: 'Laufender Support und Wartung, um Ihre Website sicher, aktuell und optimal leistungsfähig zu halten.',
    icon: Shield,
    features: [
      'Sicherheitsupdates',
      'Leistungsüberwachung',
      'Inhaltsaktualisierungen',
      'Backup-Management',
      'Technischer Support'
    ]
  }
]

export const whyOpenSource = [
  {
    title: 'Sie besitzen Ihren Code',
    description: 'Das vollständige Eigentum am Quellcode Ihrer Website bedeutet keine Anbieterbindung, keine Lizenzbeschränkungen und völlige Freiheit, Ihre Website jederzeit zu ändern, zu erweitern oder zu migrieren.',
    icon: Code
  },
  {
    title: 'Sie besitzen Ihre Daten',
    description: 'Ihre Daten gehören Ihnen, nicht den Tech-Giganten. Wir entwickeln Lösungen, die Ihre Informationen unter Ihrer Kontrolle halten, mit Optionen für Self-Hosting und Datenportabilität.',
    icon: Database
  },
  {
    title: 'Datenschutz durch Design',
    description: 'Wir priorisieren den Datenschutz von Grund auf und implementieren minimales Tracking, sichere Authentifizierung und transparente Datenverarbeitungspraktiken, die die Privatsphäre Ihrer Benutzer respektieren.',
    icon: Shield
  },
  {
    title: 'Dezentrale Architektur',
    description: 'Lösen Sie sich von zentralisierten Plattformen, die Ihre Online-Präsenz kontrollieren. Wir entwickeln Lösungen, die überall gehostet werden können und Ihnen Unabhängigkeit von Big Tech geben.',
    icon: Globe
  },
  {
    title: 'Open-Source-Grundlage',
    description: 'Aufgebaut auf Open-Source-Technologien, die transparent, überprüfbar und von globalen Gemeinschaften unterstützt werden. Kein versteckter Code, keine proprietären Lock-ins.',
    icon: Heart
  },
  {
    title: 'Zukunftssicher & Nachhaltig',
    description: 'Open-Source-Technologien entwickeln sich mit der Community weiter und verschwinden nicht, wenn ein Unternehmen scheitert. Ihre Investition ist langfristig geschützt.',
    icon: Rocket
  }
]

export function getUniqueCategories() {
  const categories = technologies.map(tech => tech.category)
  return ['Alle', ...Array.from(new Set(categories)).sort()]
}
