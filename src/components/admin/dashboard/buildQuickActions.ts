import {
  FileText,
  PackageCheck,
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
      label: 'Neuer Artikel',
      href: '/admin/content/blog/new',
      icon: FileText,
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-200 dark:hover:bg-blue-900/50',
    })
  }

  if (canAccessSection('intake')) {
    actions.push({
      label: 'Neues Gerät',
      href: '/admin/intake',
      icon: PackageCheck,
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200 dark:hover:bg-green-900/50',
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
