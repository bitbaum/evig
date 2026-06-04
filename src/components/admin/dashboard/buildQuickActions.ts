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
      color: 'bg-action-muted text-action hover:bg-action-muted',
    })
  }

  if (canAccessSection('intake')) {
    actions.push({
      label: 'Gerät annehmen',
      href: '/admin/intake',
      icon: PackageCheck,
      color: 'bg-action-muted text-action hover:bg-action-muted',
    })
  }

  if (canAccessSection('products')) {
    actions.push({
      label: 'Gerät erfassen',
      href: '/admin/erfassung',
      icon: ScanLine,
      color: 'bg-action-muted text-action hover:bg-action-muted',
    })
  }

  if (canAccessSection('workshops-admin')) {
    actions.push({
      label: 'Neuer Workshop',
      href: '/admin/workshops/new',
      icon: GraduationCap,
      color: 'bg-action-muted text-action hover:bg-action-muted',
    })
  }

  if (canAccessSection('services')) {
    actions.push({
      label: 'Neue Dienstleistung',
      href: '/admin/services/new',
      icon: Wrench,
      color: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 hover:bg-secondary-200 dark:hover:bg-secondary-900/50',
    })
  }

  if (canAccessSection('locations')) {
    actions.push({
      label: 'Neuer Standort',
      href: '/admin/locations/new',
      icon: MapPin,
      color: 'bg-action-muted text-action hover:bg-action-muted',
    })
  }

  return actions
}
