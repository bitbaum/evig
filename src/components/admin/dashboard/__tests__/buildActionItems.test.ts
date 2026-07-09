import { buildActionItems } from '../buildActionItems'
import type { DashboardStats } from '../types'
import type { ApprovalCounts } from '@/lib/approvals/counts'
import { APPROVAL_SOURCES } from '@/config/approval-sources'
import type { AdminSection } from '@/lib/permissions'

// A DashboardStats with every NON-approval action item at zero — approval-type
// items now come exclusively from the approvalCounts arg, so these tests can
// isolate the SSOT-driven queue.
const ZERO_STATS: DashboardStats = {
  pendingAppointments: 0,
  pendingAppointmentsOldest: null,
  unverifiedListings: 0,
  unverifiedListingsOldest: null,
  urgentItHilfe: 0,
  urgentItHilfeOldest: null,
  pendingRepairerApplications: 0,
  pendingRepairerApplicationsOldest: null,
  pendingJobApplications: 0,
  pendingJobApplicationsOldest: null,
  overdueTasks: 0,
  overdueTasksOldest: null,
  openDecisions: 0,
  newUsersThisWeek: 0,
  postsPublishedThisWeek: 0,
  totalUsers: 0,
  totalStaff: 0,
  totalTechnicians: 0,
  totalListings: 0,
  activeListings: 0,
  mission: {
    devicesProcessedThisMonth: 0,
    devicesSoldThisMonth: 0,
    itHilfeCompletedThisMonth: 0,
    workshopAttendeesThisMonth: 0,
  },
  delta: { devicesProcessed: 0, devicesSold: 0, itHilfeCompleted: 0, workshopAttendees: 0 },
  topUnverifiedListing: null,
  topPendingRepairerApp: null,
}

function emptyCounts(): ApprovalCounts {
  return Object.fromEntries(
    APPROVAL_SOURCES.map(s => [s.key, { pending: 0, oldestAt: null, failed: false }]),
  )
}

const allowAll = (_section: AdminSection) => true
const denyAll = (_section: AdminSection) => false

describe('buildActionItems — approval sources are SSOT-driven', () => {
  it('emits one queue row per pending approval source, routed to its reviewHref', () => {
    const counts = emptyCounts()
    counts.blog = { pending: 2, oldestAt: '2026-07-01T00:00:00.000Z', failed: false }
    counts.location = { pending: 1, oldestAt: '2026-07-08T00:00:00.000Z', failed: false }

    const items = buildActionItems(ZERO_STATS, counts, true, allowAll)

    const blogSource = APPROVAL_SOURCES.find(s => s.key === 'blog')!
    const blogItem = items.find(i => i.href === blogSource.reviewHref)
    expect(blogItem).toBeDefined()
    expect(blogItem!.count).toBe(2)
    // No hardcoded pluralization in the label — the count lives in the badge.
    expect(blogItem!.label).toBe(`${blogSource.label} zur Freigabe`)

    expect(items.filter(i => i.count && i.count > 0)).toHaveLength(2)
  })

  it('does NOT emit a source the viewer lacks permission for', () => {
    const counts = emptyCounts()
    counts.timecard = { pending: 5, oldestAt: '2026-07-01T00:00:00.000Z', failed: false }
    const items = buildActionItems(ZERO_STATS, counts, true, denyAll)
    expect(items).toHaveLength(0)
  })

  it('hides super-admin-only sources (permission requests) from non-supers', () => {
    const counts = emptyCounts()
    counts.permission_request = { pending: 3, oldestAt: '2026-07-01T00:00:00.000Z', failed: false }
    const asSuper = buildActionItems(ZERO_STATS, counts, true, allowAll)
    const asStaff = buildActionItems(ZERO_STATS, counts, false, allowAll)
    expect(asSuper.some(i => i.count === 3)).toBe(true)
    expect(asStaff.some(i => i.count === 3)).toBe(false)
  })

  it('marks a source urgent once its oldest pending item is >= 7 days old', () => {
    const old = new Date(Date.now() - 9 * 86_400_000).toISOString()
    const fresh = new Date(Date.now() - 1 * 86_400_000).toISOString()
    const counts = emptyCounts()
    counts.blog = { pending: 1, oldestAt: old, failed: false }
    counts.location = { pending: 1, oldestAt: fresh, failed: false }
    const items = buildActionItems(ZERO_STATS, counts, true, allowAll)
    const blogSource = APPROVAL_SOURCES.find(s => s.key === 'blog')!
    const locSource = APPROVAL_SOURCES.find(s => s.key === 'location')!
    expect(items.find(i => i.href === blogSource.reviewHref)!.type).toBe('urgent')
    expect(items.find(i => i.href === locSource.reviewHref)!.type).toBe('warning')
  })

  it('skips sources whose count query failed (never a misleading zero row)', () => {
    const counts = emptyCounts()
    counts.blog = { pending: 0, oldestAt: null, failed: true }
    const items = buildActionItems(ZERO_STATS, counts, true, allowAll)
    expect(items).toHaveLength(0)
  })
})
