import type { DashboardStats, ActionItem } from './types'

export function buildActionItems(
  stats: DashboardStats,
  isSuper: boolean,
  canAccessSection: (section: string) => boolean
): ActionItem[] {
  const items: ActionItem[] = []

  // Pending approvals
  if (stats.pendingApprovals > 0 && canAccessSection('approvals')) {
    items.push({
      type: 'urgent',
      label: `${stats.pendingApprovals} Freigabe${stats.pendingApprovals > 1 ? 'n' : ''} warten`,
      count: stats.pendingApprovals,
      href: '/admin/approvals',
      actionLabel: 'Jetzt prüfen',
    })
  }

  // Pending permission requests (super admin only)
  if (isSuper && stats.pendingPermissionRequests > 0) {
    items.push({
      type: 'warning',
      label: `${stats.pendingPermissionRequests} Berechtigungsanfrage${stats.pendingPermissionRequests > 1 ? 'n' : ''}`,
      count: stats.pendingPermissionRequests,
      href: '#permission-requests',
      actionLabel: 'Ansehen',
    })
  }

  // Pending appointments
  if (stats.pendingAppointments > 0 && canAccessSection('services')) {
    items.push({
      type: 'warning',
      label: `${stats.pendingAppointments} Termin${stats.pendingAppointments > 1 ? 'e' : ''} ausstehend`,
      count: stats.pendingAppointments,
      href: '/admin/services/appointments',
      actionLabel: 'Ansehen',
    })
  }

  // Unverified marketplace listings
  if (stats.unverifiedListings > 0) {
    items.push({
      type: 'warning',
      label: `${stats.unverifiedListings} Inserat${stats.unverifiedListings > 1 ? 'e' : ''} zur Prüfung`,
      count: stats.unverifiedListings,
      href: '/admin/marketplace',
      actionLabel: 'Prüfen',
    })
  }

  // Urgent IT-Hilfe requests
  if (stats.urgentItHilfe > 0) {
    items.push({
      type: 'urgent',
      label: `${stats.urgentItHilfe} dringende IT-Hilfe-Anfrage${stats.urgentItHilfe > 1 ? 'n' : ''}`,
      count: stats.urgentItHilfe,
      href: '/admin/it-hilfe',
      actionLabel: 'Ansehen',
    })
  }

  // Overdue tasks
  if (stats.overdueTasks > 0) {
    items.push({
      type: 'urgent',
      label: `${stats.overdueTasks} überfällige Aufgabe${stats.overdueTasks > 1 ? 'n' : ''}`,
      count: stats.overdueTasks,
      href: '/admin/tasks',
      actionLabel: 'Ansehen',
    })
  }

  // Pending blog submissions
  if (stats.pendingBlogSubmissions > 0) {
    items.push({
      type: 'warning',
      label: `${stats.pendingBlogSubmissions} Blog-Einreichung${stats.pendingBlogSubmissions > 1 ? 'en' : ''} ausstehend`,
      count: stats.pendingBlogSubmissions,
      href: '/admin/approvals',
      actionLabel: 'Prüfen',
    })
  }

  // Pending repairer applications
  if (stats.pendingRepairerApplications > 0) {
    items.push({
      type: 'warning',
      label: `${stats.pendingRepairerApplications} Techniker-Bewerbung${stats.pendingRepairerApplications > 1 ? 'en' : ''}`,
      count: stats.pendingRepairerApplications,
      href: '/admin/repairer-applications',
      actionLabel: 'Prüfen',
    })
  }

  // Open decisions (voting)
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
