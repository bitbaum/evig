import {
  ClipboardCheck,
  FileText,
  Zap,
  Calendar,
  Wrench,
} from 'lucide-react'
import type { DashboardStats, FulfillAction } from './types'

export function buildFulfillActions(
  stats: DashboardStats,
  canAccessSection: (section: string) => boolean,
): FulfillAction[] {
  const actions: FulfillAction[] = []

  if (stats.unverifiedListings > 0) {
    actions.push({
      label: 'Inserate prüfen',
      href: '/admin/marketplace',
      icon: ClipboardCheck,
      count: stats.unverifiedListings,
    })
  }

  if (stats.pendingBlogSubmissions > 0) {
    actions.push({
      label: 'Blog-Einreichungen',
      href: '/admin/approvals',
      icon: FileText,
      count: stats.pendingBlogSubmissions,
    })
  }

  if (stats.urgentItHilfe > 0 && canAccessSection('it-hilfe')) {
    actions.push({
      label: 'IT-Hilfe zuweisen',
      href: '/admin/it-hilfe',
      icon: Zap,
      count: stats.urgentItHilfe,
    })
  }

  if (stats.pendingAppointments > 0 && canAccessSection('services')) {
    actions.push({
      label: 'Termine bestätigen',
      href: '/admin/services/appointments',
      icon: Calendar,
      count: stats.pendingAppointments,
    })
  }

  if (stats.pendingRepairerApplications > 0) {
    actions.push({
      label: 'Techniker-Bewerbungen',
      href: '/admin/repairer-applications',
      icon: Wrench,
      count: stats.pendingRepairerApplications,
    })
  }

  return actions
}
