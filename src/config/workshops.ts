/**
 * Workshop configuration
 *
 * Single Source of Truth for workshop categories, levels, and related config
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

import {
  BookOpen,
  Code,
  HardDrive,
  Globe,
  Bitcoin,
  Brain,
  Shield,
  Leaf,
  Smartphone,
  RefreshCw,
  LucideIcon,
} from "lucide-react";

/**
 * Workshop category configuration
 */
export interface WorkshopCategory {
  /** Unique identifier/slug */
  id: string;
  /** Display name */
  name: string;
  /** Description for the category */
  description: string;
  /** Icon component */
  icon: LucideIcon;
  /** Tailwind color classes for the icon background */
  color: string;
}

/**
 * Workshop level configuration
 */
export interface WorkshopLevel {
  id: string;
  name: string;
  /** Tailwind classes for badge styling */
  badgeClass: string;
}

/**
 * Workshop categories
 *
 * "Retraining" is a key category - RevampIT doesn't just revamp hardware,
 * we revamp careers. Helping people stay employable in an AI/automation world.
 */
export const WORKSHOP_CATEGORIES: WorkshopCategory[] = [
  {
    id: "retraining",
    name: "Umschulung & Karriere",
    description:
      "Neue Fähigkeiten für die Arbeitswelt von morgen. Werde 10x produktiver mit AI-Tools und Automatisierung.",
    icon: RefreshCw,
    color: "bg-orange-500",
  },
  {
    id: "linux",
    name: "Linux & Open Source",
    description:
      "Betriebssysteme, Terminal, Server-Administration und Open-Source-Tools.",
    icon: BookOpen,
    color: "bg-primary-500",
  },
  {
    id: "hardware",
    name: "Hardware-Reparatur",
    description:
      "Computer reparieren, aufrüsten und warten. Löten, Diagnose, Vintage-Restauration.",
    icon: HardDrive,
    color: "bg-blue-500",
  },
  {
    id: "development",
    name: "Programmierung",
    description:
      "Programmieren lernen: Python, JavaScript, Webentwicklung und mehr.",
    icon: Code,
    color: "bg-purple-500",
  },
  {
    id: "web",
    name: "Webentwicklung",
    description:
      "Websites erstellen mit modernen Tools: HTML, CSS, React, Next.js.",
    icon: Globe,
    color: "bg-teal-500",
  },
  {
    id: "ai",
    name: "KI & Machine Learning",
    description:
      "Künstliche Intelligenz verstehen und nutzen. ChatGPT, Automatisierung, AI-Tools.",
    icon: Brain,
    color: "bg-pink-500",
  },
  {
    id: "blockchain",
    name: "Blockchain & Web3",
    description:
      "Kryptowährungen, dezentrale Anwendungen und Blockchain-Technologie.",
    icon: Bitcoin,
    color: "bg-yellow-500",
  },
  {
    id: "privacy",
    name: "Datenschutz & Sicherheit",
    description:
      "Online-Sicherheit, Verschlüsselung, Passwort-Management und Privatsphäre.",
    icon: Shield,
    color: "bg-red-500",
  },
  {
    id: "sustainability",
    name: "Nachhaltigkeit",
    description:
      "Nachhaltige IT: Reparieren statt wegwerfen, Energie sparen, E-Waste vermeiden.",
    icon: Leaf,
    color: "bg-emerald-500",
  },
  {
    id: "digital-skills",
    name: "Digital Skills",
    description:
      "Grundlegende digitale Kompetenzen für Alltag und Beruf.",
    icon: Smartphone,
    color: "bg-indigo-500",
  },
];

/**
 * Workshop difficulty levels
 */
export const WORKSHOP_LEVELS: WorkshopLevel[] = [
  {
    id: "beginner",
    name: "Anfänger",
    badgeClass: "bg-primary-100 text-primary-800",
  },
  {
    id: "intermediate",
    name: "Fortgeschrittene",
    badgeClass: "bg-blue-100 text-blue-800",
  },
  {
    id: "advanced",
    name: "Experten",
    badgeClass: "bg-purple-100 text-purple-800",
  },
  {
    id: "all",
    name: "Alle Stufen",
    badgeClass: "bg-neutral-100 text-neutral-800",
  },
];

/**
 * Workshop instance statuses
 * CHECK (status IN ('scheduled', 'cancelled', 'completed'))
 */
export const WORKSHOP_INSTANCE_STATUS = {
  SCHEDULED: 'scheduled',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export type WorkshopInstanceStatus = typeof WORKSHOP_INSTANCE_STATUS[keyof typeof WORKSHOP_INSTANCE_STATUS];

export const WORKSHOP_INSTANCE_STATUS_LABELS: Record<WorkshopInstanceStatus, string> = {
  [WORKSHOP_INSTANCE_STATUS.SCHEDULED]: 'Geplant',
  [WORKSHOP_INSTANCE_STATUS.CANCELLED]: 'Abgesagt',
  [WORKSHOP_INSTANCE_STATUS.COMPLETED]: 'Abgeschlossen',
};

/**
 * Workshop proposal statuses
 * Used in workshop_proposals table and admin UI
 */
export const PROPOSAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REQUIRES_CHANGES: 'requires_changes',
} as const;

export type ProposalStatus = typeof PROPOSAL_STATUS[keyof typeof PROPOSAL_STATUS];

/**
 * Status labels for UI display
 */
export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  [PROPOSAL_STATUS.PENDING]: 'Ausstehend',
  [PROPOSAL_STATUS.APPROVED]: 'Genehmigt',
  [PROPOSAL_STATUS.REJECTED]: 'Abgelehnt',
  [PROPOSAL_STATUS.REQUIRES_CHANGES]: 'Änderungen erforderlich',
};

/**
 * Get category by ID
 */
export function getCategoryById(id: string): WorkshopCategory | undefined {
  return WORKSHOP_CATEGORIES.find(
    (cat) => cat.id === id || cat.name.toLowerCase() === id.toLowerCase()
  );
}

/**
 * Get category icon by name (for backwards compatibility with existing data)
 */
export function getCategoryIcon(categoryName: string | null | undefined): LucideIcon {
  if (!categoryName) return BookOpen;
  const normalizedName = categoryName.toLowerCase();

  // Check by ID first
  const byId = WORKSHOP_CATEGORIES.find((cat) => cat.id === normalizedName);
  if (byId) return byId.icon;

  // Check by name (partial match for flexibility)
  const byName = WORKSHOP_CATEGORIES.find(
    (cat) =>
      cat.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(cat.id)
  );
  if (byName) return byName.icon;

  // Legacy mappings for existing database entries
  const legacyMap: Record<string, LucideIcon> = {
    betriebssysteme: BookOpen,
    entwicklung: Code,
    web: Globe,
    blockchain: Bitcoin,
    "ki & ml": Brain,
  };

  return legacyMap[normalizedName] || BookOpen;
}

/**
 * Get level badge class by level name
 */
export function getLevelBadgeClass(levelName: string | null | undefined): string {
  if (!levelName) return "bg-neutral-100 text-neutral-800";
  const normalizedName = levelName.toLowerCase();
  const level = WORKSHOP_LEVELS.find(
    (l) => l.id === normalizedName || l.name.toLowerCase() === normalizedName
  );
  return level?.badgeClass || "bg-neutral-100 text-neutral-800";
}

/**
 * Get category names as simple string array (for dropdowns)
 */
export function getCategoryNames(): string[] {
  return WORKSHOP_CATEGORIES.map((cat) => cat.name);
}
