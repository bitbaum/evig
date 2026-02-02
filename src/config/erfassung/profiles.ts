/**
 * Customer Profiles Configuration
 *
 * Defines target customer segments for products.
 * Used in: product erfassung, product display, filtering
 *
 * SSOT: This is the single source of truth for customer profiles.
 * Adding/removing a profile here automatically updates the entire app.
 *
 * To add a new profile:
 *   1. Add entry to CUSTOMER_PROFILES array below
 *   2. That's it - it will appear everywhere automatically
 *
 * To remove a profile:
 *   1. Remove from CUSTOMER_PROFILES array
 *   2. Existing products with this profile will keep it (consider migration)
 *
 * Profile Guidelines:
 *   - slug: lowercase, no spaces, used in database
 *   - name_de: Swiss German display name
 *   - icon: Single emoji representing the profile
 *   - color: Brand color for UI badges/chips
 *   - description: What this profile needs (helps staff match products)
 *   - requirements: Specific hardware/software requirements (optional)
 */

export interface CustomerProfile {
  /** Unique identifier (used in database) */
  slug: string
  /** German display name */
  name_de: string
  /** Emoji icon */
  icon: string
  /** Brand color (hex) */
  color: string
  /** Short description of use case */
  description: string
  /** Specific requirements (helps staff understand what fits) */
  requirements?: string[]
}

/**
 * Available customer profiles
 *
 * These represent target audiences for refurbished products.
 * Each product can have multiple profiles.
 *
 * Categories:
 * - Basic users (Oma/Opa, Büro, Chiller, Student)
 * - Power users (Gamer, Entwickler, Kreativ, Musik-Producer)
 * - Professional (Grafiker, Video-Editor)
 */
export const CUSTOMER_PROFILES: CustomerProfile[] = [
  // === Basic Users ===
  {
    slug: 'oma',
    name_de: 'Oma/Opa',
    icon: '❤️',
    color: '#EC4899',
    description: 'Einfache Bedienung, grosser Bildschirm, langsam ist OK',
    requirements: [
      'Grosser Bildschirm (mind. 15")',
      'Gut lesbare Tastatur',
      'Einfaches Betriebssystem',
      'Zuverlässig, wenig Wartung',
    ],
  },
  {
    slug: 'buero',
    name_de: 'Büro',
    icon: '💼',
    color: '#3B82F6',
    description: 'Office-Anwendungen, E-Mail, Browser, Zuverlässigkeit',
    requirements: [
      'Microsoft Office oder LibreOffice',
      'Gute Tastatur',
      'Stabiler Bildschirm',
      'Mindestens 8GB RAM',
    ],
  },
  {
    slug: 'chiller',
    name_de: 'Chiller',
    icon: '📺',
    color: '#8B5CF6',
    description: 'Streaming, Social Media, leichte Nutzung',
    requirements: [
      'Guter Bildschirm für Videos',
      'Akzeptable Lautsprecher',
      'WLAN',
      'Browser-fokussiert',
    ],
  },
  {
    slug: 'student',
    name_de: 'Student',
    icon: '🎓',
    color: '#06B6D4',
    description: 'Preis-Leistung, mobil, Akkulaufzeit',
    requirements: [
      'Leicht und tragbar',
      'Gute Akkulaufzeit',
      'Günstig',
      'Office-tauglich',
    ],
  },

  // === Power Users ===
  {
    slug: 'gamer',
    name_de: 'Gamer',
    icon: '🎮',
    color: '#EF4444',
    description: 'Gaming, leistungsstarke Grafik, schneller Prozessor',
    requirements: [
      'Dedizierte Grafikkarte (GTX 1060+ oder besser)',
      'Mindestens 16GB RAM',
      'SSD für schnelle Ladezeiten',
      'Gutes Display (144Hz+)',
    ],
  },
  {
    slug: 'dev',
    name_de: 'Entwickler',
    icon: '💻',
    color: '#10B981',
    description: 'Programmierung, viel RAM, gute Tastatur',
    requirements: [
      'Mindestens 16GB RAM (32GB ideal)',
      'Schnelle SSD (512GB+)',
      'Gute Tastatur',
      'Linux-kompatibel',
    ],
  },
  {
    slug: 'kreativ',
    name_de: 'Kreativ-Kopf',
    icon: '🎨',
    color: '#F59E0B',
    description: 'Bildbearbeitung, Illustration, Design-Software',
    requirements: [
      'Farbgenauer Bildschirm (IPS)',
      'Mindestens 16GB RAM',
      'Grafik-Software-tauglich',
      'Optional: Stift-Unterstützung',
    ],
  },
  {
    slug: 'musik',
    name_de: 'Musik-Producer',
    icon: '🎵',
    color: '#7C3AED',
    description: 'Audio-Produktion, DAW, niedrige Latenz',
    requirements: [
      'Leiser Betrieb (wichtig für Aufnahmen)',
      'Mindestens 16GB RAM (32GB für grosse Projekte)',
      'Schnelle SSD',
      'Gute Audio-Schnittstellen (USB-C/Thunderbolt)',
      'DAW-kompatibel (Ableton, Logic, FL Studio)',
    ],
  },

  // === Professional ===
  {
    slug: 'grafiker',
    name_de: 'Grafiker/Designer',
    icon: '🖌️',
    color: '#D946EF',
    description: 'Professionelle Grafik, Adobe Suite, farbkritisch',
    requirements: [
      'Farbkalibrierter Monitor (100% sRGB)',
      'Mindestens 32GB RAM',
      'Dedizierte Grafikkarte',
      'Adobe Creative Cloud kompatibel',
    ],
  },
  {
    slug: 'video',
    name_de: 'Video-Editor',
    icon: '🎬',
    color: '#DC2626',
    description: 'Videoschnitt, Rendering, grosse Dateien',
    requirements: [
      'Starke CPU (mind. 6 Kerne)',
      'Dedizierte Grafikkarte mit Encoder',
      'Mindestens 32GB RAM (64GB ideal)',
      'Schnelle SSD + grosse HDD für Projekte',
    ],
  },
]

/**
 * Get profile by slug
 */
export function getProfileBySlug(slug: string): CustomerProfile | undefined {
  return CUSTOMER_PROFILES.find(p => p.slug === slug)
}

/**
 * Get multiple profiles by slugs
 */
export function getProfilesBySlugs(slugs: string[]): CustomerProfile[] {
  return slugs
    .map(slug => getProfileBySlug(slug))
    .filter((p): p is CustomerProfile => p !== undefined)
}

/**
 * Validate profile slugs (filter out invalid ones)
 */
export function validateProfileSlugs(slugs: string[]): string[] {
  const validSlugs = new Set(CUSTOMER_PROFILES.map(p => p.slug))
  return slugs.filter(slug => validSlugs.has(slug))
}

/**
 * Group profiles by category for UI display
 */
export function getProfilesByCategory(): Record<string, CustomerProfile[]> {
  const basicSlugs = ['oma', 'buero', 'chiller', 'student']
  const powerSlugs = ['gamer', 'dev', 'kreativ', 'musik']
  const proSlugs = ['grafiker', 'video']

  return {
    'Basis-Nutzer': CUSTOMER_PROFILES.filter(p => basicSlugs.includes(p.slug)),
    'Power-Nutzer': CUSTOMER_PROFILES.filter(p => powerSlugs.includes(p.slug)),
    'Professionell': CUSTOMER_PROFILES.filter(p => proSlugs.includes(p.slug)),
  }
}
