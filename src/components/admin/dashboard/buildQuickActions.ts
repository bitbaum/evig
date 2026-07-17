import {
  FileText,
  ScanLine,
  GraduationCap,
  Wrench,
  MapPin,
} from 'lucide-react'
import type { QuickAction } from './types'
import type { AdminSection } from '@/lib/permissions'

export function buildQuickActions(
  canAccessSection: (section: AdminSection) => boolean
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
      label: 'Produkt aufnehmen',
      href: '/admin/intake/capture',
      icon: ScanLine,
      color: 'bg-action-muted text-action hover:bg-action-muted',
    })
  } else if (canAccessSection('products')) {
    actions.push({
      label: 'Produkt aufnehmen',
      href: '/admin/intake/capture',
      icon: ScanLine,
      color: 'bg-action-muted text-action hover:bg-action-muted',
    })
  }

  if (canAccessSection('workshops-admin')) {
    actions.push({
      label: 'Neuer Workshop',
      // Workshops entstehen über den Vorschlags-Flow (Proposal → Freigabe).
      // Das alte /admin/workshops/new-Formular speicherte nie etwas.
      href: '/admin/workshops/proposals',
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
