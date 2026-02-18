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

  return items
}
