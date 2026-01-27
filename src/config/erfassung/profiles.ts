/**
 * Customer Profiles Configuration
 *
 * Defines target customer segments for products.
 * Used in: product erfassung, product display, filtering
 *
 * To add a new profile:
 *   1. Add entry to CUSTOMER_PROFILES array
 *   2. That's it - it will appear everywhere automatically
 *
 * To remove a profile:
 *   1. Remove from CUSTOMER_PROFILES array
 *   2. Existing products with this profile will keep it (consider migration)
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
  /** Optional description */
  description?: string
}

/**
 * Available customer profiles
 *
 * These represent target audiences for refurbished products.
 * Each product can have multiple profiles.
 */
export const CUSTOMER_PROFILES: CustomerProfile[] = [
  {
    slug: 'oma',
    name_de: 'Oma/Opa',
    icon: '❤️',
    color: '#EC4899',
    description: 'Einfache Bedienung, grosser Bildschirm, langsam ist OK',
  },
  {
    slug: 'buero',
    name_de: 'Büro',
    icon: '💼',
    color: '#3B82F6',
    description: 'Office-Anwendungen, E-Mail, Browser, Zuverlässigkeit',
  },
  {
    slug: 'chiller',
    name_de: 'Chiller',
    icon: '📺',
    color: '#8B5CF6',
    description: 'Streaming, Social Media, leichte Nutzung',
  },
  {
    slug: 'gamer',
    name_de: 'Gamer',
    icon: '🎮',
    color: '#EF4444',
    description: 'Gaming, leistungsstarke Grafik, schneller Prozessor',
  },
  {
    slug: 'kreativ',
    name_de: 'Kreativ-Kopf',
    icon: '🎨',
    color: '#F59E0B',
    description: 'Bildbearbeitung, Video, Design-Software',
  },
  {
    slug: 'dev',
    name_de: 'Entwickler',
    icon: '💻',
    color: '#10B981',
    description: 'Programmierung, viel RAM, gute Tastatur',
  },
  {
    slug: 'student',
    name_de: 'Student',
    icon: '🎓',
    color: '#06B6D4',
    description: 'Preis-Leistung, mobil, Akkulaufzeit',
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
