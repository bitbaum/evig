/**
 * Admin configuration
 *
 * Single Source of Truth for admin shortcuts and commands
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

import {
  Rocket,
  Database,
  Settings,
  Users,
  Package,
  FileText,
  Terminal,
  Shield,
  Eye,
  Plus,
  MapPin,
  GraduationCap,
  LucideIcon,
} from "lucide-react";
import { MEDUSA_ADMIN_URL } from "@/config/urls";

/**
 * Admin shortcut item configuration
 */
export interface AdminShortcut {
  id: string;
  title: string;
  description: string;
  href?: string;
  /** Command to copy to clipboard (for action shortcuts) */
  command?: string;
  icon: LucideIcon;
  color: string;
  external?: boolean;
  /** Category for grouping */
  category: "setup" | "internal" | "external" | "system" | "marketplace" | "quick";
}

/**
 * Quick command for the commands section
 */
export interface AdminQuickCommand {
  title: string;
  command: string;
}

/**
 * Admin shortcuts configuration
 * Organized by category for easier maintenance
 */
export const ADMIN_SHORTCUTS: AdminShortcut[] = [
  // Quick Setup Actions
  {
    id: "start-services",
    title: "Alle Services starten",
    description: "Startet Frontend, CMS und Medusa mit einem Befehl",
    command: "npm run d",
    icon: Rocket,
    color: "bg-green-500",
    category: "setup",
  },
  {
    id: "setup-admins",
    title: "Admin Benutzer einrichten",
    description: "Erstellt Admin-Benutzer für CMS und Medusa",
    command: "npm run setup-admins",
    icon: Shield,
    color: "bg-blue-500",
    category: "setup",
  },

  // Internal Admin Interfaces
  {
    id: "products",
    title: "Produktverwaltung",
    description: "Produkte hinzufügen, bearbeiten und löschen",
    href: "/admin/products",
    icon: Package,
    color: "bg-indigo-500",
    category: "internal",
  },
  {
    id: "locations",
    title: "Ortsverwaltung",
    description: "Veranstaltungsorte genehmigen und verwalten",
    href: "/admin/locations",
    icon: MapPin,
    color: "bg-orange-500",
    category: "internal",
  },
  {
    id: "workshops",
    title: "Workshop-Verwaltung",
    description: "Workshop-Vorschläge genehmigen und verwalten",
    href: "/admin/workshops",
    icon: GraduationCap,
    color: "bg-purple-500",
    category: "internal",
  },

  // External Admin Interfaces
  {
    id: "medusa-admin",
    title: "Medusa Admin",
    description: "Direkter Zugriff auf Medusa Admin-Interface",
    href: MEDUSA_ADMIN_URL,
    icon: Settings,
    color: "bg-gray-500",
    external: true,
    category: "external",
  },
  {
    id: "cms",
    title: "CMS Inhalte bearbeiten",
    description: "Seiten, Blog-Artikel und Inhalte verwalten",
    href: "/ai-cms",
    icon: FileText,
    color: "bg-teal-500",
    category: "external",
  },

  // System Management
  {
    id: "db-status",
    title: "Datenbank Status",
    description: "Überprüft den Status aller Datenbanken",
    command: "docker ps",
    icon: Database,
    color: "bg-orange-500",
    category: "system",
  },
  {
    id: "logs",
    title: "Logs anzeigen",
    description: "Container-Logs für Fehlerbehebung",
    command: "npm run medusa:logs",
    icon: Terminal,
    color: "bg-gray-500",
    category: "system",
  },

  // Marketplace Management
  {
    id: "marketplace",
    title: "User Marketplace",
    description: "Benutzer-Anzeigen und Marketplace-Übersicht",
    href: "/marketplace",
    icon: Users,
    color: "bg-purple-500",
    category: "marketplace",
  },

  // Quick Access
  {
    id: "shop-frontend",
    title: "Shop Frontend",
    description: "E-Commerce Shop in neuem Tab öffnen",
    href: "/shop/medusa",
    icon: Eye,
    color: "bg-emerald-500",
    category: "quick",
  },
  {
    id: "list-product",
    title: "Produkt auflisten",
    description: "Neues Produkt als Benutzer auflisten",
    href: "/marketplace/list",
    icon: Plus,
    color: "bg-green-500",
    category: "quick",
  },
  {
    id: "new-product-medusa",
    title: "Neues Produkt",
    description: "Schnellzugriff für neue Produkte im Medusa Admin",
    href: `${MEDUSA_ADMIN_URL}/products/new`,
    icon: Plus,
    color: "bg-purple-500",
    external: true,
    category: "quick",
  },
];

/**
 * Quick commands shown in the admin panel footer
 */
export const ADMIN_QUICK_COMMANDS: AdminQuickCommand[] = [
  {
    title: "Alle Services starten",
    command: "npm run d",
  },
  {
    title: "Admin-Benutzer einrichten",
    command: "npm run setup-admins",
  },
  {
    title: "Container-Status prüfen",
    command: "docker ps",
  },
  {
    title: "Medusa-Logs anzeigen",
    command: "npm run medusa:logs",
  },
];
