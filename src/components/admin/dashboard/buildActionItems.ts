import type { DashboardStats, ActionItem } from './types'
import { SERVICE_APPOINTMENT_ROUTES } from '@/config/service-appointments'

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
      inlineAction: stats.topPendingApproval
        ? { itemId: stats.topPendingApproval.id, itemLabel: stats.topPendingApproval.label, actionType: 'approve_blog' }
        : undefined,
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

  if (stats.pendingAppointments > 0 && canAccessSection('appointments-admin')) {
    items.push({
      type: 'warning',
      label: `${stats.pendingAppointments} Termin${stats.pendingAppointments > 1 ? 'e' : ''} ausstehend`,
      count: stats.pendingAppointments,
      href: SERVICE_APPOINTMENT_ROUTES.adminList,
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
      inlineAction: stats.topUnverifiedListing
        ? { itemId: stats.topUnverifiedListing.id, itemLabel: stats.topUnverifiedListing.label, actionType: 'verify_listing' }
        : undefined,
    })
  }

  if (stats.urgentItHilfe > 0 && canAccessSection('it-hilfe-admin')) {
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

  if (stats.pendingJobApplications > 0 && canAccessSection('hr-applications')) {
    items.push({
      type: 'warning',
      label: `${stats.pendingJobApplications} HR-Bewerbung${stats.pendingJobApplications > 1 ? 'en' : ''} (neu)`,
      count: stats.pendingJobApplications,
      href: '/admin/hr/applications',
      actionLabel: 'Prüfen',
      oldestAt: stats.pendingJobApplicationsOldest,
    })
  }

  if (stats.pendingTimecardApprovals > 0 && canAccessSection('timecard-approvals')) {
    items.push({
      type: 'warning',
      label: `${stats.pendingTimecardApprovals} Zeitkarte${stats.pendingTimecardApprovals > 1 ? 'n' : ''} zur Freigabe`,
      count: stats.pendingTimecardApprovals,
      href: '/admin/team/approvals',
      actionLabel: 'Freigeben',
      oldestAt: stats.pendingTimecardApprovalsOldest,
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
      inlineAction: stats.topPendingRepairerApp
        ? { itemId: stats.topPendingRepairerApp.id, itemLabel: stats.topPendingRepairerApp.label, actionType: 'approve_repairer' }
        : undefined,
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
