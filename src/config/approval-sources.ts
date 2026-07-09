import { FileText, CalendarPlus, MapPin, Clock, CalendarOff, ShieldCheck, type LucideIcon } from 'lucide-react'

/**
 * SSOT for everything that requires approval ("Freigaben").
 *
 * Adding a new approvable thing = one entry here (+ its count descriptor in
 * src/lib/approvals/counts.ts). Both the Freigaben hub and the dashboard queue
 * read from this single registry, so the pending numbers can no longer drift
 * between two engines.
 *
 * `reviewMode` captures the KEY insight that approving different things is not
 * the same job:
 *   - 'inline' — decide right here (approve/reject, maybe a reason): locations,
 *     workshop proposals, permission requests.
 *   - 'bulk'   — a dedicated multi-select surface (timecards/absences).
 *   - 'page'   — needs the full item to judge (a blog article's body), so review
 *     happens on its own page.
 *
 * This file is client-safe (structure only). The count queries live server-side
 * in src/lib/approvals/counts.ts, keyed by the same `key`.
 */

export type ApprovalReviewMode = 'inline' | 'bulk' | 'page'

export interface ApprovalSourceConfig {
  key: string
  label: string
  description: string
  icon: LucideIcon
  reviewMode: ApprovalReviewMode
  /** Where the reviewer goes to act (page) or which surface owns it. */
  reviewHref: string
  /** Section permission that gates seeing/acting on this source. */
  permission: string
  /** Only super admins may review (e.g. permission requests). */
  superAdminOnly?: boolean
}

export const APPROVAL_SOURCES: readonly ApprovalSourceConfig[] = [
  {
    key: 'blog',
    label: 'Blog-Beiträge',
    description: 'Eingereichte Artikel von Mitgliedern prüfen',
    icon: FileText,
    reviewMode: 'page',
    reviewHref: '/admin/content/submissions',
    permission: 'approvals',
  },
  {
    key: 'workshop_proposal',
    label: 'Workshop-Vorschläge',
    description: 'Vorgeschlagene Kurse prüfen und freigeben',
    icon: CalendarPlus,
    reviewMode: 'inline',
    reviewHref: '/admin/workshops',
    permission: 'workshops',
  },
  {
    key: 'location',
    label: 'Standorte',
    description: 'Eingereichte Standorte prüfen',
    icon: MapPin,
    reviewMode: 'inline',
    reviewHref: '/admin/locations',
    permission: 'locations',
  },
  {
    key: 'timecard',
    label: 'Zeitkarten',
    description: 'Eingereichte Arbeitszeiten freigeben',
    icon: Clock,
    reviewMode: 'bulk',
    reviewHref: '/admin/team/approvals',
    // Gate on the APPROVAL surface, not personal `timecards` — only reviewers,
    // not everyone with their own card, should see this in a queue.
    permission: 'timecard-approvals',
  },
  {
    key: 'time_off',
    label: 'Abwesenheiten',
    description: 'Ferien- und Abwesenheitsanträge prüfen',
    icon: CalendarOff,
    reviewMode: 'bulk',
    reviewHref: '/admin/team/approvals',
    permission: 'timecard-approvals',
  },
  {
    key: 'permission_request',
    label: 'Berechtigungsanfragen',
    description: 'Zugriffsanfragen von Teammitgliedern prüfen',
    icon: ShieldCheck,
    reviewMode: 'inline',
    reviewHref: '/admin/approvals',
    permission: 'settings',
    superAdminOnly: true,
  },
] as const

export function getApprovalSource(key: string): ApprovalSourceConfig | undefined {
  return APPROVAL_SOURCES.find(s => s.key === key)
}
