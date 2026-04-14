import type { DashboardStats, ActionItem } from './types'

export function buildActionItems(
  stats: DashboardStats,
  isSuper: boolean,
  canAccessSection: (section: string) => boolean
): ActionItem[] {
  const items: ActionItem[] = []

  if (stats.pendingApprovals > 0 && canAccessSection('approvals')) {
    items.push({
      type: 'urgent',
      label: `${stats.pendingApprovals} Freigabe${stats.pendingApprovals > 1 ? 'n' : ''} warten`,
      count: stats.pendingApprovals,
      href: '/admin/approvals',
      actionLabel: 'Jetzt prüfen',
      oldestAt: stats.pendingApprovalsOldest,
    })
  }

  if (isSuper && stats.pendingPermissionRequests > 0) {
    items.push({
      type: 'warning',
      label: `${stats.pendingPermissionRequests} Berechtigungsanfrage${stats.pendingPermissionRequests > 1 ? 'n' : ''}`,
      count: stats.pendingPermissionRequests,
      href: '#permission-requests',
      actionLabel: 'Ansehen',
    })
  }

  if (stats.pendingAppointments > 0 && canAccessSection('services')) {
    items.push({
      type: 'warning',
      label: `${stats.pendingAppointments} Termin${stats.pendingAppointments > 1 ? 'e' : ''} ausstehend`,
      count: stats.pendingAppointments,
      href: '/admin/services/appointments',
      actionLabel: 'Ansehen',
      oldestAt: stats.pendingAppointmentsOldest,
    })
  }

  if (stats.unverifiedListings > 0) {
    items.push({
      type: 'warning',
      label: `${stats.unverifiedListings} Inserat${stats.unverifiedListings > 1 ? 'e' : ''} zur Prüfung`,
      count: stats.unverifiedListings,
      href: '/admin/marketplace',
      actionLabel: 'Prüfen',
      oldestAt: stats.unverifiedListingsOldest,
    })
  }

  if (stats.urgentItHilfe > 0) {
    items.push({
      type: 'urgent',
      label: `${stats.urgentItHilfe} dringende IT-Hilfe-Anfrage${stats.urgentItHilfe > 1 ? 'n' : ''}`,
      count: stats.urgentItHilfe,
      href: '/admin/it-hilfe',
      actionLabel: 'Ansehen',
      oldestAt: stats.urgentItHilfeOldest,
    })
  }

  if (stats.overdueTasks > 0) {
    items.push({
      type: 'urgent',
      label: `${stats.overdueTasks} überfällige Aufgabe${stats.overdueTasks > 1 ? 'n' : ''}`,
      count: stats.overdueTasks,
      href: '/admin/tasks',
      actionLabel: 'Ansehen',
      oldestAt: stats.overdueTasksOldest,
    })
  }

  if (stats.pendingBlogSubmissions > 0) {
    items.push({
      type: 'warning',
      label: `${stats.pendingBlogSubmissions} Blog-Einreichung${stats.pendingBlogSubmissions > 1 ? 'en' : ''} ausstehend`,
      count: stats.pendingBlogSubmissions,
      href: '/admin/approvals',
      actionLabel: 'Prüfen',
      oldestAt: stats.pendingBlogSubmissionsOldest,
    })
  }

  if (stats.pendingRepairerApplications > 0) {
    items.push({
      type: 'warning',
      label: `${stats.pendingRepairerApplications} Techniker-Bewerbung${stats.pendingRepairerApplications > 1 ? 'en' : ''}`,
      count: stats.pendingRepairerApplications,
      href: '/admin/repairer-applications',
      actionLabel: 'Prüfen',
      oldestAt: stats.pendingRepairerApplicationsOldest,
    })
  }

  if (stats.openDecisions > 0) {
    items.push({
      type: 'warning',
      label: `${stats.openDecisions} offene Abstimmung${stats.openDecisions > 1 ? 'en' : ''}`,
      count: stats.openDecisions,
      href: '/admin/decisions',
      actionLabel: 'Abstimmen',
    })
  }

  return items
}
