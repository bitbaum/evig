/**
 * IT-Hilfe Marketplace Configuration
 *
 * Single Source of Truth for the IT-Hilfe feature
 * This file defines ALL configuration for the unified IT marketplace
 *
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

import {
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Gamepad2,
  Headphones,
  Keyboard,
  HardDrive,
  Watch,
  Wifi,
  Wrench,
  Settings,
  HelpCircle,
  Shield,
  LucideIcon,
} from 'lucide-react'

// ============================================================================
// FEATURE IDENTITY (SSOT)
// ============================================================================

/**
 * Core feature configuration - change feature name HERE ONLY
 */
export const IT_HILFE = {
  id: 'it-hilfe',
  name: 'IT-Hilfe',
  slug: 'it-hilfe',
  description: 'Community-basierte IT-Unterstützung',
  tagline: 'Gemeinsam für digitale Nachhaltigkeit',
  routes: {
    browse: '/it-hilfe',
    create: '/it-hilfe/create',
    my: '/it-hilfe/my',
    myOffers: '/it-hilfe/my/offers',
    detail: (id: string) => `/it-hilfe/${id}`,
    helpers: '/techniker',
    register: '/profil/techniker',
  },
  api: {
    requests: '/api/it-hilfe/requests',
    myRequests: '/api/it-hilfe/my-requests',
    myOffers: '/api/it-hilfe/my-offers',
    helpers: '/api/it-hilfe/helpers',
  },
} as const

// ============================================================================
// REVAMPIT STORE (Physical location - Werkstatt & Laden)
// Derived from SSOT: @/config/org
// ============================================================================

import { ORG, LOCATIONS, CONTACT } from '@/config/org'

export const REVAMPIT_STORE = {
  name: `${ORG.name} Werkstatt`,
  address: LOCATIONS.store.street,
  postalCode: LOCATIONS.store.postalCode,
  city: LOCATIONS.store.city,
  canton: LOCATIONS.store.canton,
  lat: LOCATIONS.store.lat,
  lng: LOCATIONS.store.lng,
  googleMapsUrl: LOCATIONS.store.googleMapsUrl,
  description: 'Unser Laden und Werkstatt in Zürich Wiedikon',
} as const

export const REVAMPIT_NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || CONTACT.email

export const MATCH_SCORES = {
  PER_SKILL: 20,
  DEVICE_CATEGORY_BONUS: 10,
  SAME_CANTON: 15,
  BUDGET_COMPATIBLE: 10,
  SERVICE_TYPE_MATCH: 5,
} as const

// ============================================================================
// SERVICE CATEGORIES (Expanded beyond repairs)
// ============================================================================

export interface ServiceCategory {
  id: string
  name: string
  description: string
  icon: LucideIcon
  color: string
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: 'repair',
    name: 'Reparaturen',
    description: 'Hardware-Reparaturen und Ersatzteile',
    icon: Wrench,
    color: 'bg-primary-500',
  },
  {
    id: 'setup',
    name: 'Installation & Setup',
    description: 'Software-Installation und Geräte-Einrichtung',
    icon: Settings,
    color: 'bg-primary-500',
  },
  {
    id: 'support',
    name: 'Support & Beratung',
    description: 'Hilfe bei Problemen und Kaufberatung',
    icon: HelpCircle,
    color: 'bg-purple-500',
  },
  {
    id: 'data',
    name: 'Daten & Sicherheit',
    description: 'Datenrettung, Backup und Sicherheit',
    icon: Shield,
    color: 'bg-orange-500',
  },
  {
    id: 'network',
    name: 'Netzwerk',
    description: 'WLAN, Router und Heimnetzwerk',
    icon: Wifi,
    color: 'bg-cyan-500',
  },
]

// ============================================================================
// IT SKILLS (Grouped by service category)
// ============================================================================

export interface ITSkill {
  id: string
  name: string
  description: string
}

export const IT_SKILLS: Record<string, ITSkill[]> = {
  repair: [
    { id: 'hardware_diagnosis', name: 'Hardware-Diagnose', description: 'Fehlersuche und Identifikation von Hardware-Problemen' },
    { id: 'screen_repair', name: 'Bildschirm-Reparatur', description: 'Austausch und Reparatur von Displays' },
    { id: 'battery_replacement', name: 'Akku-Wechsel', description: 'Austausch von Akkus und Batterien' },
    { id: 'ssd_upgrade', name: 'SSD/RAM-Upgrade', description: 'Einbau und Konfiguration von SSD und RAM' },
    { id: 'keyboard_repair', name: 'Tastatur-Reparatur', description: 'Reparatur und Austausch von Tastaturen' },
    { id: 'soldering', name: 'Löten', description: 'Löten von Komponenten, Kabeln und Platinen' },
    { id: 'cleaning', name: 'Reinigung & Wartung', description: 'Professionelle Reinigung und Wärmeleitpaste-Erneuerung' },
    { id: 'power_supply', name: 'Netzteil-Reparatur', description: 'Diagnose und Reparatur von Stromversorgung' },
    { id: 'motherboard_repair', name: 'Mainboard-Reparatur', description: 'Reparatur von Hauptplatinen und Komponenten' },
    { id: 'connector_repair', name: 'Anschluss-Reparatur', description: 'Reparatur von USB, Ladeanschlüssen und anderen Ports' },
  ],
  setup: [
    { id: 'os_installation', name: 'Betriebssystem-Installation', description: 'Installation von Windows, macOS, Linux' },
    { id: 'linux_install', name: 'Linux-Installation', description: 'Installation und Konfiguration von Linux-Distributionen' },
    { id: 'dual_boot', name: 'Dual-Boot Setup', description: 'Einrichtung von Multi-Boot-Systemen' },
    { id: 'software_setup', name: 'Software-Einrichtung', description: 'Installation und Konfiguration von Anwendungen' },
    { id: 'printer_setup', name: 'Drucker-Einrichtung', description: 'Installation und Konfiguration von Druckern' },
    { id: 'email_setup', name: 'E-Mail-Einrichtung', description: 'Einrichtung von E-Mail-Clients und -Konten' },
    { id: 'driver_installation', name: 'Treiber-Installation', description: 'Installation und Aktualisierung von Treibern' },
  ],
  support: [
    { id: 'troubleshooting', name: 'Fehlersuche', description: 'Diagnose und Behebung von Software-Problemen' },
    { id: 'ai_consulting', name: 'KI-Beratung', description: 'Beratung zu KI-Tools und deren Nutzung' },
    { id: 'tech_advice', name: 'Kaufberatung', description: 'Beratung bei Hardware- und Software-Kauf' },
    { id: 'training', name: 'Schulung & Einweisung', description: 'Einführung in neue Software oder Geräte' },
    { id: 'remote_support', name: 'Fernwartung', description: 'Remote-Hilfe per Video/Telefon' },
  ],
  data: [
    { id: 'data_recovery', name: 'Datenrettung', description: 'Wiederherstellung verlorener Daten' },
    { id: 'backup_setup', name: 'Backup-Einrichtung', description: 'Einrichtung von Backup-Lösungen' },
    { id: 'virus_removal', name: 'Virenentfernung', description: 'Entfernung von Malware und Systemwiederherstellung' },
    { id: 'encryption', name: 'Verschlüsselung', description: 'Einrichtung von Festplatten- und Datenverschlüsselung' },
    { id: 'data_migration', name: 'Datenmigration', description: 'Übertragung von Daten auf neue Geräte' },
  ],
  network: [
    { id: 'wifi_setup', name: 'WLAN-Einrichtung', description: 'Einrichtung und Optimierung von WLAN' },
    { id: 'router_config', name: 'Router-Konfiguration', description: 'Konfiguration von Routern und Firewalls' },
    { id: 'network_troubleshooting', name: 'Netzwerk-Fehlersuche', description: 'Diagnose und Behebung von Netzwerk-Problemen' },
    { id: 'smart_home', name: 'Smart-Home Setup', description: 'Einrichtung von Smart-Home-Geräten' },
  ],
}

// ============================================================================
// BUDGET TIERS - Solidarity Pricing Model
// ============================================================================
// Based on: /Nextcloud/Revamp-Hirn/01_Management/B_Finanzen/Preismodell_Solidaritaet.md
//
// 4 Stufen:
// 1. GRATIS - Für Personen in akuter Notlage (Geflüchtete, Sozialfälle)
// 2. KULTURLEGI - 50% Rabatt für KulturLegi-Inhaber:innen
// 3. NORMAL - Marktüblicher Preis
// 4. SUPPORTER - Freiwilliger Aufschlag zur Unterstützung anderer

export const BUDGET_TIER = {
  GRATIS: 'gratis',
  KULTURLEGI: 'kulturlegi',
  NORMAL: 'normal',
  SUPPORTER: 'supporter',
} as const

export type BudgetTierId = typeof BUDGET_TIER[keyof typeof BUDGET_TIER]

export interface BudgetTier {
  id: string
  name: string
  description: string
  icon: string
  requiresAmount: boolean
  multiplier: number
  badgeClass: string
}

export const BUDGET_TIERS: BudgetTier[] = [
  {
    id: 'gratis',
    name: 'Gratis (auf Anfrage)',
    description: 'Für Personen in akuter Notlage - einfach fragen',
    icon: '🤝',
    requiresAmount: false,
    multiplier: 0,
    badgeClass: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'kulturlegi',
    name: 'KulturLegi',
    description: '50% Rabatt mit gültiger KulturLegi-Karte',
    icon: '💳',
    requiresAmount: true,
    multiplier: 0.5,
    badgeClass: 'bg-neutral-100 text-neutral-700',
  },
  {
    id: 'normal',
    name: 'Normalpreis',
    description: 'Faire Vergütung für die Hilfe',
    icon: '💰',
    requiresAmount: true,
    multiplier: 1.0,
    badgeClass: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
  },
  {
    id: 'supporter',
    name: 'Supporter',
    description: 'Du zahlst mehr und ermöglichst Gratis-Hilfe für andere',
    icon: '💚',
    requiresAmount: true,
    multiplier: 1.5,
    badgeClass: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
  },
]

// ============================================================================
// DEVICE CATEGORIES
// ============================================================================

export interface DeviceCategory {
  id: string
  name: string
  description: string
  icon: LucideIcon
  color: string
  suggestedSkills: string[]
  defaultTitle: string
  defaultDescription: string
}

export const DEVICE_CATEGORIES: DeviceCategory[] = [
  {
    id: 'laptop',
    name: 'Laptop',
    description: 'Notebooks, MacBooks, Ultrabooks',
    icon: Laptop,
    color: 'bg-primary-500',
    suggestedSkills: ['hardware_diagnosis', 'screen_repair', 'battery_replacement', 'keyboard_repair', 'ssd_upgrade', 'os_installation'],
    defaultTitle: 'Laptop-Hilfe benötigt',
    defaultDescription: 'Mein Laptop hat folgendes Problem:\n\n- \n\nMarke/Modell: \nAlter: ca. ',
  },
  {
    id: 'smartphone',
    name: 'Smartphone',
    description: 'iPhones, Android-Handys',
    icon: Smartphone,
    color: 'bg-purple-500',
    suggestedSkills: ['hardware_diagnosis', 'screen_repair', 'battery_replacement', 'troubleshooting'],
    defaultTitle: 'Smartphone-Hilfe benötigt',
    defaultDescription: 'Mein Smartphone hat folgendes Problem:\n\n- \n\nMarke/Modell: \nAlter: ca. ',
  },
  {
    id: 'tablet',
    name: 'Tablet',
    description: 'iPads, Android-Tablets, E-Reader',
    icon: Tablet,
    color: 'bg-indigo-500',
    suggestedSkills: ['hardware_diagnosis', 'screen_repair', 'battery_replacement', 'troubleshooting'],
    defaultTitle: 'Tablet-Hilfe benötigt',
    defaultDescription: 'Mein Tablet hat folgendes Problem:\n\n- \n\nMarke/Modell: \nAlter: ca. ',
  },
  {
    id: 'desktop',
    name: 'Desktop-PC',
    description: 'Tower-PCs, Workstations, All-in-Ones',
    icon: Monitor,
    color: 'bg-neutral-600',
    suggestedSkills: ['hardware_diagnosis', 'ssd_upgrade', 'os_installation', 'cleaning', 'virus_removal'],
    defaultTitle: 'PC-Hilfe benötigt',
    defaultDescription: 'Mein PC hat folgendes Problem:\n\n- \n\nKonfiguration: \nAlter: ca. ',
  },
  {
    id: 'console',
    name: 'Spielkonsole',
    description: 'PlayStation, Xbox, Nintendo, Retro-Konsolen',
    icon: Gamepad2,
    color: 'bg-primary-500',
    suggestedSkills: ['hardware_diagnosis', 'soldering', 'cleaning'],
    defaultTitle: 'Konsolen-Hilfe benötigt',
    defaultDescription: 'Meine Spielkonsole hat folgendes Problem:\n\n- \n\nKonsole: \nAlter: ca. ',
  },
  {
    id: 'audio',
    name: 'Audio-Geräte',
    description: 'Kopfhörer, Lautsprecher, Verstärker',
    icon: Headphones,
    color: 'bg-pink-500',
    suggestedSkills: ['hardware_diagnosis', 'soldering'],
    defaultTitle: 'Audio-Hilfe benötigt',
    defaultDescription: 'Mein Audio-Gerät hat folgendes Problem:\n\n- \n\nGerät: \nAlter: ca. ',
  },
  {
    id: 'peripheral',
    name: 'Peripherie',
    description: 'Tastaturen, Mäuse, Webcams, Drucker',
    icon: Keyboard,
    color: 'bg-orange-500',
    suggestedSkills: ['hardware_diagnosis', 'cleaning', 'soldering', 'printer_setup'],
    defaultTitle: 'Peripherie-Hilfe benötigt',
    defaultDescription: 'Mein Gerät hat folgendes Problem:\n\n- \n\nGerät: \nAlter: ca. ',
  },
  {
    id: 'storage',
    name: 'Speicher',
    description: 'Externe Festplatten, SSDs, NAS, USB-Sticks',
    icon: HardDrive,
    color: 'bg-error-500',
    suggestedSkills: ['hardware_diagnosis', 'data_recovery', 'ssd_upgrade', 'backup_setup'],
    defaultTitle: 'Speicher-Hilfe / Datenrettung',
    defaultDescription: 'Problem mit meinem Speichermedium:\n\n- \n\nGerät: \nKapazität: ',
  },
  {
    id: 'wearable',
    name: 'Wearables',
    description: 'Smartwatches, Fitness-Tracker',
    icon: Watch,
    color: 'bg-teal-500',
    suggestedSkills: ['hardware_diagnosis', 'battery_replacement'],
    defaultTitle: 'Smartwatch/Wearable-Hilfe',
    defaultDescription: 'Mein Wearable hat folgendes Problem:\n\n- \n\nGerät: \nAlter: ca. ',
  },
  {
    id: 'network',
    name: 'Netzwerk',
    description: 'Router, Switches, Access Points, Modems',
    icon: Wifi,
    color: 'bg-cyan-500',
    suggestedSkills: ['wifi_setup', 'router_config', 'network_troubleshooting', 'hardware_diagnosis'],
    defaultTitle: 'Netzwerk-Hilfe benötigt',
    defaultDescription: 'Ich brauche Hilfe mit meinem Netzwerk:\n\n- \n\nRouter/Gerät: \nProvider: ',
  },
]

// ============================================================================
// URGENCY LEVELS
// ============================================================================

export interface UrgencyLevel {
  id: string
  name: string
  description: string
  badgeClass: string
}

export const URGENCY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const

export const URGENCY_DEFAULT = URGENCY.NORMAL
export type UrgencyValue = typeof URGENCY[keyof typeof URGENCY]
export const URGENCY_VALUES = Object.values(URGENCY) as [UrgencyValue, ...UrgencyValue[]]

export const URGENCY_LEVELS: UrgencyLevel[] = [
  { id: URGENCY.LOW, name: 'Niedrig', description: 'Keine Eile, kann warten', badgeClass: 'bg-neutral-100 text-neutral-700' },
  { id: URGENCY.NORMAL, name: 'Normal', description: 'Zeitnah, aber nicht dringend', badgeClass: 'bg-neutral-100 text-neutral-700' },
  { id: URGENCY.HIGH, name: 'Hoch', description: 'Möglichst bald benötigt', badgeClass: 'bg-orange-100 text-orange-700' },
  { id: URGENCY.URGENT, name: 'Dringend', description: 'Wird dringend für Arbeit/Studium benötigt', badgeClass: 'bg-error-100 text-error-700' },
]

// ============================================================================
// SORT OPTIONS
// ============================================================================

export interface SortOption {
  value: string
  label: string
}

export const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Neueste zuerst' },
  { value: 'urgent', label: 'Dringlichste zuerst' },
  { value: 'budget_high', label: 'Höchstes Budget' },
  { value: 'offers', label: 'Meiste Angebote' },
]

// ============================================================================
// SERVICE TYPES (How help is delivered)
// ============================================================================

export interface ServiceType {
  id: string
  name: string
  description: string
}

export const SERVICE_TYPE = {
  FLEXIBLE: 'flexible',
  REMOTE: 'remote',
  ONSITE: 'onsite',
  PICKUP: 'pickup',
  DROPOFF: 'dropoff',
} as const

export const SERVICE_TYPE_DEFAULT = SERVICE_TYPE.FLEXIBLE

export const SERVICE_TYPES: ServiceType[] = [
  { id: SERVICE_TYPE.FLEXIBLE, name: 'Flexibel', description: 'Offen für verschiedene Optionen' },
  { id: SERVICE_TYPE.REMOTE, name: 'Remote', description: 'Fernhilfe per Video/Telefon' },
  { id: SERVICE_TYPE.ONSITE, name: 'Vor Ort', description: 'Hilfe vor Ort beim Kunden' },
  { id: SERVICE_TYPE.PICKUP, name: 'Abholung', description: 'Gerät wird abgeholt' },
  { id: SERVICE_TYPE.DROPOFF, name: 'Bringen', description: 'Gerät wird vorbeigebracht' },
]

// ============================================================================
// REQUEST STATUSES
// ============================================================================

export interface RequestStatus {
  id: string
  name: string
  description: string
  badgeClass: string
}

export const REQUEST_STATUS = {
  OPEN: 'open',
  IN_DISCUSSION: 'in_discussion',
  MATCHED: 'matched',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type RequestStatusId = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

/** Valid status transitions (SSOT) — used in user + admin routes */
export const VALID_REQUEST_TRANSITIONS: Record<string, string[]> = {
  [REQUEST_STATUS.OPEN]: [REQUEST_STATUS.CANCELLED],
  [REQUEST_STATUS.IN_DISCUSSION]: [REQUEST_STATUS.CANCELLED],
  [REQUEST_STATUS.MATCHED]: [REQUEST_STATUS.COMPLETED, REQUEST_STATUS.CANCELLED],
}

/** Derive budgetType from amount — used in request creation and updates */
export function deriveBudgetType(amountCents: number | null | undefined): 'free' | 'fixed' {
  return (amountCents && amountCents > 0) ? 'fixed' : 'free'
}

export const REQUEST_STATUSES: RequestStatus[] = [
  { id: REQUEST_STATUS.OPEN, name: 'Offen', description: 'Anfrage ist offen für Angebote', badgeClass: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' },
  { id: REQUEST_STATUS.IN_DISCUSSION, name: 'In Gespräch', description: 'In Verhandlung mit Technikern', badgeClass: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-200' },
  { id: REQUEST_STATUS.MATCHED, name: 'Vergeben', description: 'Angebot akzeptiert, Hilfe läuft', badgeClass: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' },
  { id: REQUEST_STATUS.COMPLETED, name: 'Abgeschlossen', description: 'Erfolgreich abgeschlossen', badgeClass: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' },
  { id: REQUEST_STATUS.CANCELLED, name: 'Abgebrochen', description: 'Anfrage wurde abgebrochen', badgeClass: 'bg-neutral-100 text-neutral-500' },
]

// ============================================================================
// OFFER STATUSES
// ============================================================================

export interface OfferStatus {
  id: string
  name: string
  badgeClass: string
}

export const OFFER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

export type OfferStatusId = typeof OFFER_STATUS[keyof typeof OFFER_STATUS];

export const OFFER_STATUSES: OfferStatus[] = [
  { id: OFFER_STATUS.PENDING, name: 'Ausstehend', badgeClass: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-200' },
  { id: OFFER_STATUS.ACCEPTED, name: 'Akzeptiert', badgeClass: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' },
  { id: OFFER_STATUS.REJECTED, name: 'Abgelehnt', badgeClass: 'bg-error-100 text-error-700' },
  { id: OFFER_STATUS.WITHDRAWN, name: 'Zurückgezogen', badgeClass: 'bg-neutral-100 text-neutral-500' },
]

// ============================================================================
// SWISS CANTONS — re-exported from SSOT
// ============================================================================

export { SWISS_CANTONS, type SwissCanton } from '@/config/swiss-cantons'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Get all skills as flat array */
export function getAllSkills(): ITSkill[] {
  return Object.values(IT_SKILLS).flat()
}

/** Get skills by category ID */
export function getSkillsByCategory(categoryId: string): ITSkill[] {
  return IT_SKILLS[categoryId] || []
}

/** Get skill by ID */
export function getSkillById(id: string): ITSkill | undefined {
  return getAllSkills().find(s => s.id === id)
}

/** Get all skill IDs */
export function getSkillIds(): string[] {
  return getAllSkills().map(s => s.id)
}

/** Get service category by ID */
export function getServiceCategoryById(id: string): ServiceCategory | undefined {
  return SERVICE_CATEGORIES.find(c => c.id === id)
}

/** Get device category by ID */
export function getCategoryById(id: string): DeviceCategory | undefined {
  return DEVICE_CATEGORIES.find(cat => cat.id === id)
}

/** Get all category IDs */
export function getCategoryIds(): string[] {
  return DEVICE_CATEGORIES.map(cat => cat.id)
}

/** Get skills suggested for a device category */
export function getSkillsForCategory(categoryId: string): ITSkill[] {
  const category = getCategoryById(categoryId)
  if (!category) return []
  return category.suggestedSkills
    .map(skillId => getSkillById(skillId))
    .filter((skill): skill is ITSkill => skill !== undefined)
}

/** Get budget tier by ID */
export function getBudgetTierById(id: string): BudgetTier | undefined {
  return BUDGET_TIERS.find(t => t.id === id)
}

/** Get urgency level by ID */
export function getUrgencyById(id: string): UrgencyLevel | undefined {
  return URGENCY_LEVELS.find(u => u.id === id)
}

/** Get service type by ID */
export function getServiceTypeById(id: string): ServiceType | undefined {
  return SERVICE_TYPES.find(st => st.id === id)
}

/** Get request status by ID */
export function getRequestStatusById(id: string): RequestStatus | undefined {
  return REQUEST_STATUSES.find(s => s.id === id)
}

/** Get offer status by ID */
export function getOfferStatusById(id: string): OfferStatus | undefined {
  return OFFER_STATUSES.find(s => s.id === id)
}

/** Check if a request status allows new offers */
export function isRequestAcceptingOffers(status: string): boolean {
  return status === REQUEST_STATUS.OPEN
}

/**
 * Format budget for display
 * @param maxBudgetCents - Maximum budget in cents, null means free
 * @param budgetTier - Optional budget tier (gratis, kulturlegi, normal, supporter)
 */
export function formatBudget(maxBudgetCents: number | null, budgetTier?: string): string {
  if (budgetTier) {
    const tier = getBudgetTierById(budgetTier)
    if (tier) {
      if (tier.id === 'gratis') {
        return 'Gratis (Community-Hilfe)'
      }
      if (tier.id === 'kulturlegi' && maxBudgetCents) {
        return `bis CHF ${(maxBudgetCents / 100).toFixed(0)} (KulturLegi)`
      }
      if (tier.id === 'supporter' && maxBudgetCents) {
        return `ab CHF ${(maxBudgetCents / 100).toFixed(0)} (Supporter 💚)`
      }
    }
  }

  if (maxBudgetCents === null || maxBudgetCents === 0) {
    return 'Community-Hilfe (gratis)'
  }
  return `bis CHF ${(maxBudgetCents / 100).toFixed(0)}`
}

/** Get skills grouped by their categories (for UI display) */
export function getSkillsGroupedByCategory(): Array<{ category: ServiceCategory; skills: ITSkill[] }> {
  return SERVICE_CATEGORIES.map(category => ({
    category,
    skills: IT_SKILLS[category.id] || [],
  }))
}
