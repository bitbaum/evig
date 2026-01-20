/**
 * Peer Repair Marketplace Configuration
 *
 * Single Source of Truth for device categories, repair skills, and related config
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
  LucideIcon,
} from 'lucide-react';

/**
 * Device category for peer repair requests
 */
export interface DeviceCategory {
  /** Unique identifier/slug */
  id: string;
  /** Display name (German) */
  name: string;
  /** Description for the category */
  description: string;
  /** Icon component */
  icon: LucideIcon;
  /** Tailwind color classes for the icon background */
  color: string;
  /** Suggested skills for this device type */
  suggestedSkills: string[];
}

/**
 * Repair skill definition
 */
export interface RepairSkill {
  /** Unique identifier */
  id: string;
  /** Display name (German) */
  name: string;
  /** Skill category for grouping */
  category: 'hardware' | 'software' | 'network';
  /** Description of the skill */
  description: string;
}

/**
 * Budget type for compensation
 */
export interface BudgetType {
  id: string;
  name: string;
  description: string;
  requiresAmount: boolean;
}

/**
 * Urgency level
 */
export interface UrgencyLevel {
  id: string;
  name: string;
  description: string;
  /** Tailwind classes for badge styling */
  badgeClass: string;
}

/**
 * Service type for delivery/meeting
 */
export interface ServiceType {
  id: string;
  name: string;
  description: string;
}

/**
 * Request status
 */
export interface RequestStatus {
  id: string;
  name: string;
  description: string;
  badgeClass: string;
}

/**
 * Offer status
 */
export interface OfferStatus {
  id: string;
  name: string;
  badgeClass: string;
}

// ============================================================================
// Device Categories (10 types)
// ============================================================================

export const DEVICE_CATEGORIES: DeviceCategory[] = [
  {
    id: 'laptop',
    name: 'Laptop',
    description: 'Notebooks, MacBooks, Ultrabooks',
    icon: Laptop,
    color: 'bg-blue-500',
    suggestedSkills: ['hardware_diagnosis', 'screen_repair', 'battery_replacement', 'keyboard_repair', 'ssd_upgrade', 'os_installation'],
  },
  {
    id: 'smartphone',
    name: 'Smartphone',
    description: 'iPhones, Android-Handys',
    icon: Smartphone,
    color: 'bg-purple-500',
    suggestedSkills: ['hardware_diagnosis', 'screen_repair', 'battery_replacement', 'software_troubleshooting'],
  },
  {
    id: 'tablet',
    name: 'Tablet',
    description: 'iPads, Android-Tablets, E-Reader',
    icon: Tablet,
    color: 'bg-indigo-500',
    suggestedSkills: ['hardware_diagnosis', 'screen_repair', 'battery_replacement', 'software_troubleshooting'],
  },
  {
    id: 'desktop',
    name: 'Desktop-PC',
    description: 'Tower-PCs, Workstations, All-in-Ones',
    icon: Monitor,
    color: 'bg-gray-600',
    suggestedSkills: ['hardware_diagnosis', 'ssd_upgrade', 'os_installation', 'cleaning', 'virus_removal'],
  },
  {
    id: 'console',
    name: 'Spielkonsole',
    description: 'PlayStation, Xbox, Nintendo, Retro-Konsolen',
    icon: Gamepad2,
    color: 'bg-green-500',
    suggestedSkills: ['hardware_diagnosis', 'soldering', 'cleaning'],
  },
  {
    id: 'audio',
    name: 'Audio-Geräte',
    description: 'Kopfhörer, Lautsprecher, Verstärker',
    icon: Headphones,
    color: 'bg-pink-500',
    suggestedSkills: ['hardware_diagnosis', 'soldering'],
  },
  {
    id: 'peripheral',
    name: 'Peripherie',
    description: 'Tastaturen, Mäuse, Webcams, Drucker',
    icon: Keyboard,
    color: 'bg-orange-500',
    suggestedSkills: ['hardware_diagnosis', 'cleaning', 'soldering'],
  },
  {
    id: 'storage',
    name: 'Speicher',
    description: 'Externe Festplatten, SSDs, NAS, USB-Sticks',
    icon: HardDrive,
    color: 'bg-red-500',
    suggestedSkills: ['hardware_diagnosis', 'data_recovery', 'ssd_upgrade'],
  },
  {
    id: 'wearable',
    name: 'Wearables',
    description: 'Smartwatches, Fitness-Tracker',
    icon: Watch,
    color: 'bg-teal-500',
    suggestedSkills: ['hardware_diagnosis', 'battery_replacement'],
  },
  {
    id: 'network',
    name: 'Netzwerk',
    description: 'Router, Switches, Access Points, Modems',
    icon: Wifi,
    color: 'bg-cyan-500',
    suggestedSkills: ['network_setup', 'wifi_troubleshooting', 'hardware_diagnosis'],
  },
];

// ============================================================================
// Repair Skills (20 skills in 3 categories)
// ============================================================================

export const REPAIR_SKILLS: RepairSkill[] = [
  // Hardware skills
  {
    id: 'hardware_diagnosis',
    name: 'Hardware-Diagnose',
    category: 'hardware',
    description: 'Fehlersuche und Identifikation von Hardware-Problemen',
  },
  {
    id: 'soldering',
    name: 'Löten',
    category: 'hardware',
    description: 'Löten von Komponenten, Kabeln und Platinen',
  },
  {
    id: 'screen_repair',
    name: 'Bildschirm-Reparatur',
    category: 'hardware',
    description: 'Austausch und Reparatur von Displays',
  },
  {
    id: 'battery_replacement',
    name: 'Akku-Tausch',
    category: 'hardware',
    description: 'Austausch von Akkus und Batterien',
  },
  {
    id: 'keyboard_repair',
    name: 'Tastatur-Reparatur',
    category: 'hardware',
    description: 'Reparatur und Austausch von Tastaturen',
  },
  {
    id: 'ssd_upgrade',
    name: 'SSD/RAM-Upgrade',
    category: 'hardware',
    description: 'Einbau und Konfiguration von SSD und RAM',
  },
  {
    id: 'cleaning',
    name: 'Reinigung & Wartung',
    category: 'hardware',
    description: 'Professionelle Reinigung und Wärmeleitpaste-Erneuerung',
  },
  {
    id: 'power_supply',
    name: 'Netzteil-Reparatur',
    category: 'hardware',
    description: 'Diagnose und Reparatur von Stromversorgung',
  },
  {
    id: 'motherboard_repair',
    name: 'Mainboard-Reparatur',
    category: 'hardware',
    description: 'Reparatur von Hauptplatinen und Komponenten',
  },
  {
    id: 'connector_repair',
    name: 'Anschluss-Reparatur',
    category: 'hardware',
    description: 'Reparatur von USB, Ladeanschlüssen und anderen Ports',
  },

  // Software skills
  {
    id: 'os_installation',
    name: 'Betriebssystem-Installation',
    category: 'software',
    description: 'Installation von Windows, macOS, Linux',
  },
  {
    id: 'virus_removal',
    name: 'Viren-Entfernung',
    category: 'software',
    description: 'Entfernung von Malware und Systemwiederherstellung',
  },
  {
    id: 'data_recovery',
    name: 'Datenrettung',
    category: 'software',
    description: 'Wiederherstellung verlorener Daten',
  },
  {
    id: 'software_troubleshooting',
    name: 'Software-Fehlerbehebung',
    category: 'software',
    description: 'Diagnose und Behebung von Software-Problemen',
  },
  {
    id: 'driver_installation',
    name: 'Treiber-Installation',
    category: 'software',
    description: 'Installation und Aktualisierung von Treibern',
  },
  {
    id: 'backup_setup',
    name: 'Backup-Einrichtung',
    category: 'software',
    description: 'Einrichtung von Backup-Lösungen',
  },
  {
    id: 'linux_support',
    name: 'Linux-Support',
    category: 'software',
    description: 'Installation und Konfiguration von Linux-Systemen',
  },

  // Network skills
  {
    id: 'network_setup',
    name: 'Netzwerk-Einrichtung',
    category: 'network',
    description: 'Einrichtung von Heim- und Büronetzwerken',
  },
  {
    id: 'wifi_troubleshooting',
    name: 'WLAN-Fehlerbehebung',
    category: 'network',
    description: 'Diagnose und Behebung von WLAN-Problemen',
  },
  {
    id: 'router_config',
    name: 'Router-Konfiguration',
    category: 'network',
    description: 'Konfiguration von Routern und Firewalls',
  },
];

// ============================================================================
// Budget Types
// ============================================================================

export const BUDGET_TYPES: BudgetType[] = [
  {
    id: 'free',
    name: 'Community-Hilfe',
    description: 'Kostenlose Hilfe aus der Community',
    requiresAmount: false,
  },
  {
    id: 'donation',
    name: 'Spende',
    description: 'Freiwillige Spende nach eigenem Ermessen',
    requiresAmount: false,
  },
  {
    id: 'fixed',
    name: 'Festbetrag',
    description: 'Fester Betrag für die gesamte Reparatur',
    requiresAmount: true,
  },
  {
    id: 'hourly',
    name: 'Stundensatz',
    description: 'Vergütung pro Stunde Arbeitszeit',
    requiresAmount: true,
  },
];

// ============================================================================
// Urgency Levels
// ============================================================================

export const URGENCY_LEVELS: UrgencyLevel[] = [
  {
    id: 'low',
    name: 'Niedrig',
    description: 'Keine Eile, kann warten',
    badgeClass: 'bg-gray-100 text-gray-700',
  },
  {
    id: 'normal',
    name: 'Normal',
    description: 'Zeitnah, aber nicht dringend',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'high',
    name: 'Hoch',
    description: 'Möglichst bald benötigt',
    badgeClass: 'bg-orange-100 text-orange-700',
  },
  {
    id: 'urgent',
    name: 'Dringend',
    description: 'Wird dringend für Arbeit/Studium benötigt',
    badgeClass: 'bg-red-100 text-red-700',
  },
];

// ============================================================================
// Service Types
// ============================================================================

export const SERVICE_TYPES: ServiceType[] = [
  {
    id: 'flexible',
    name: 'Flexibel',
    description: 'Offen für verschiedene Optionen',
  },
  {
    id: 'pickup',
    name: 'Abholung',
    description: 'Helfer holt das Gerät ab',
  },
  {
    id: 'dropoff',
    name: 'Bringen',
    description: 'Ich bringe das Gerät zum Helfer',
  },
  {
    id: 'onsite',
    name: 'Vor Ort',
    description: 'Reparatur bei mir zu Hause',
  },
  {
    id: 'remote',
    name: 'Remote',
    description: 'Fernhilfe per Video/Telefon',
  },
];

// ============================================================================
// Request Statuses
// ============================================================================

export const REQUEST_STATUSES: RequestStatus[] = [
  {
    id: 'open',
    name: 'Offen',
    description: 'Anfrage ist offen für Angebote',
    badgeClass: 'bg-green-100 text-green-700',
  },
  {
    id: 'in_discussion',
    name: 'In Gespräch',
    description: 'In Verhandlung mit Helfern',
    badgeClass: 'bg-yellow-100 text-yellow-700',
  },
  {
    id: 'matched',
    name: 'Vergeben',
    description: 'Angebot akzeptiert, Reparatur läuft',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'completed',
    name: 'Abgeschlossen',
    description: 'Reparatur erfolgreich abgeschlossen',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    id: 'cancelled',
    name: 'Abgebrochen',
    description: 'Anfrage wurde abgebrochen',
    badgeClass: 'bg-gray-100 text-gray-500',
  },
];

// ============================================================================
// Offer Statuses
// ============================================================================

export const OFFER_STATUSES: OfferStatus[] = [
  {
    id: 'pending',
    name: 'Ausstehend',
    badgeClass: 'bg-yellow-100 text-yellow-700',
  },
  {
    id: 'accepted',
    name: 'Akzeptiert',
    badgeClass: 'bg-green-100 text-green-700',
  },
  {
    id: 'rejected',
    name: 'Abgelehnt',
    badgeClass: 'bg-red-100 text-red-700',
  },
  {
    id: 'withdrawn',
    name: 'Zurückgezogen',
    badgeClass: 'bg-gray-100 text-gray-500',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get device category by ID
 */
export function getCategoryById(id: string): DeviceCategory | undefined {
  return DEVICE_CATEGORIES.find(cat => cat.id === id);
}

/**
 * Get skill by ID
 */
export function getSkillById(id: string): RepairSkill | undefined {
  return REPAIR_SKILLS.find(skill => skill.id === id);
}

/**
 * Get skills for a device category
 */
export function getSkillsForCategory(categoryId: string): RepairSkill[] {
  const category = getCategoryById(categoryId);
  if (!category) return [];
  return category.suggestedSkills
    .map(skillId => getSkillById(skillId))
    .filter((skill): skill is RepairSkill => skill !== undefined);
}

/**
 * Get skills grouped by category
 */
export function getSkillsByCategory(): Record<string, RepairSkill[]> {
  return REPAIR_SKILLS.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, RepairSkill[]>);
}

/**
 * Get budget type by ID
 */
export function getBudgetTypeById(id: string): BudgetType | undefined {
  return BUDGET_TYPES.find(bt => bt.id === id);
}

/**
 * Get urgency level by ID
 */
export function getUrgencyById(id: string): UrgencyLevel | undefined {
  return URGENCY_LEVELS.find(u => u.id === id);
}

/**
 * Get service type by ID
 */
export function getServiceTypeById(id: string): ServiceType | undefined {
  return SERVICE_TYPES.find(st => st.id === id);
}

/**
 * Get request status by ID
 */
export function getRequestStatusById(id: string): RequestStatus | undefined {
  return REQUEST_STATUSES.find(s => s.id === id);
}

/**
 * Get offer status by ID
 */
export function getOfferStatusById(id: string): OfferStatus | undefined {
  return OFFER_STATUSES.find(s => s.id === id);
}

/**
 * Get all category IDs
 */
export function getCategoryIds(): string[] {
  return DEVICE_CATEGORIES.map(cat => cat.id);
}

/**
 * Get all skill IDs
 */
export function getSkillIds(): string[] {
  return REPAIR_SKILLS.map(skill => skill.id);
}
