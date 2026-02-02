/**
 * Service Icons Configuration
 *
 * Curated list of Lucide icons available for admin selection.
 * These icons are suitable for IT/tech services.
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
  Wrench,
  Cpu,
  Monitor,
  Laptop,
  Smartphone,
  Wifi,
  Cloud,
  Settings,
  Terminal,
  FileCode,
  Package,
  type LucideIcon,
} from 'lucide-react'

/**
 * Icon configuration with German labels
 */
export interface ServiceIconConfig {
  icon: LucideIcon
  label: string
}

/**
 * Available icons for service configuration
 * Keyed by icon component name (stored in database)
 */
export const SERVICE_ICONS: Record<string, ServiceIconConfig> = {
  // Storage & Data
  HardDrive: { icon: HardDrive, label: 'Festplatte' },
  Server: { icon: Server, label: 'Server' },
  Database: { icon: Database, label: 'Datenbank' },
  Disc: { icon: Disc, label: 'Disc/CD' },
  Cloud: { icon: Cloud, label: 'Cloud' },
  Archive: { icon: Archive, label: 'Archiv' },
  FolderInput: { icon: FolderInput, label: 'Datentransfer' },

  // Hardware
  Cpu: { icon: Cpu, label: 'Prozessor' },
  Monitor: { icon: Monitor, label: 'Monitor' },
  Laptop: { icon: Laptop, label: 'Laptop' },
  Smartphone: { icon: Smartphone, label: 'Smartphone' },
  Wifi: { icon: Wifi, label: 'Netzwerk' },

  // Software & Development
  Code: { icon: Code, label: 'Code/Entwicklung' },
  Terminal: { icon: Terminal, label: 'Terminal' },
  FileCode: { icon: FileCode, label: 'Datei-Code' },
  Globe: { icon: Globe, label: 'Web/Internet' },
  Palette: { icon: Palette, label: 'Design' },

  // General
  Wrench: { icon: Wrench, label: 'Werkzeug/Reparatur' },
  Settings: { icon: Settings, label: 'Einstellungen' },
  Shield: { icon: Shield, label: 'Sicherheit' },
  Zap: { icon: Zap, label: 'Schnell/Leistung' },
  Clock: { icon: Clock, label: 'Zeit/Beratung' },
  CheckCircle2: { icon: CheckCircle2, label: 'Erledigt/Erfolg' },
  Package: { icon: Package, label: 'Paket/Produkt' },
} as const

/**
 * Get icon component by name
 * Returns Wrench as fallback if icon not found
 */
export function getIconByName(iconName: string | null): LucideIcon {
  if (!iconName) return Wrench
  return SERVICE_ICONS[iconName]?.icon ?? Wrench
}

/**
 * Get icon label by name
 */
export function getIconLabel(iconName: string | null): string {
  if (!iconName) return 'Werkzeug'
  return SERVICE_ICONS[iconName]?.label ?? 'Unbekannt'
}

/**
 * Get all icon names for dropdown/picker
 */
export function getIconNames(): string[] {
  return Object.keys(SERVICE_ICONS)
}

/**
 * Validate if an icon name exists
 */
export function isValidIconName(iconName: string): boolean {
  return iconName in SERVICE_ICONS
}
