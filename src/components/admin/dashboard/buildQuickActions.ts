import {
  FileText,
  PackageCheck,
  ScanLine,
  GraduationCap,
  Wrench,
  MapPin,
} from 'lucide-react'
import type { QuickAction } from './types'

export function buildQuickActions(
  canAccessSection: (section: string) => boolean
): QuickAction[] {
  const actions: QuickAction[] = []

  if (canAccessSection('content')) {
    actions.push({
      label: 'Neuer Blogartikel',
      href: '/admin/content/blog/new',
      icon: FileText,
      color: 'bg-info-100 dark:bg-info-900/30 text-info-600 hover:bg-info-200 dark:hover:bg-info-900/50',
    })
  }

  if (canAccessSection('intake')) {
    actions.push({
      label: 'Gerät annehmen',
      href: '/admin/intake',
      icon: PackageCheck,
      color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 hover:bg-primary-200 dark:hover:bg-primary-900/50',
    })
  }

  if (canAccessSection('products')) {
    actions.push({
      label: 'Gerät erfassen',
      href: '/admin/erfassung',
      icon: ScanLine,
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
    })
  }

  if (canAccessSection('workshops-admin')) {
    actions.push({
      label: 'Neuer Workshop',
      href: '/admin/workshops/new',
      icon: GraduationCap,
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 hover:bg-purple-200 dark:hover:bg-purple-900/50',
    })
  }

  if (canAccessSection('services')) {
    actions.push({
      label: 'Neue Dienstleistung',
      href: '/admin/services/new',
      icon: Wrench,
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 hover:bg-orange-200 dark:hover:bg-orange-900/50',
    })
  }

  if (canAccessSection('locations')) {
    actions.push({
      label: 'Neuer Standort',
      href: '/admin/locations/new',
      icon: MapPin,
      color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 hover:bg-teal-200 dark:hover:bg-teal-900/50',
    })
  }

  return actions
}
