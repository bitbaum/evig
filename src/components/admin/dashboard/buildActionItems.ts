import type { DashboardStats, ActionItem } from './types'
import { SERVICE_APPOINTMENT_ROUTES } from '@/config/service-appointments'
import type { AdminSection } from '@/lib/permissions'
import { APPROVAL_SOURCES } from '@/config/approval-sources'
import type { ApprovalCounts } from '@/lib/approvals/counts'

/** A pending approval older than this reads as urgent (matches the hub hero). */
const APPROVAL_STALE_DAYS = 7

function daysSince(iso: string | null): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - Date.parse(iso)) / 86_400_000)
}

export function buildActionItems(
  stats: DashboardStats,
  approvalCounts: ApprovalCounts,
  isSuper: boolean,
  canAccessSection: (section: AdminSection) => boolean
): ActionItem[] {
  const items: ActionItem[] = []

  // Approval sources — ONE count engine (`getApprovalCounts` over the
  // APPROVAL_SOURCES SSOT), the SAME one the /admin/approvals hub reads. This
  // replaces the former dead `user_content_submissions` read plus the separately
  // queried blog/timecard/permission counts, so the dashboard and the hub can no
  // longer disagree. Each row routes to its own review surface (`reviewHref`) and
  // is gated by its own section permission — add a source and it appears here.
  for (const source of APPROVAL_SOURCES) {
    const count = approvalCounts[source.key]
    if (!count || count.failed || count.pending === 0) continue
    if (source.superAdminOnly && !isSuper) continue
    if (!canAccessSection(source.permission as AdminSection)) continue
    const age = daysSince(count.oldestAt)
    items.push({
      type: age !== null && age >= APPROVAL_STALE_DAYS ? 'urgent' : 'warning',
      label: `${source.label} zur Freigabe`,
      count: count.pending,
      href: source.reviewHref,
      actionLabel: 'Prüfen',
      oldestAt: count.oldestAt,
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
