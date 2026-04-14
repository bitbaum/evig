import { buildActionItems } from './buildActionItems'
import type { DashboardStats, UnifiedQueueItem } from './types'

const URGENCY_ORDER = { urgent: 0, warning: 1, success: 2 } as const

/**
 * Builds the unified queue that replaces the separate ActionItemsSection
 * and the "Erledigen" row from QuickActionsSection.
 *
 * ActionItems are a superset of FulfillActions (same hrefs, same data, more detail),
 * so merging is simply reusing buildActionItems and sorting urgent items first.
 */
export function buildUnifiedQueue(
  stats: DashboardStats,
  isSuper: boolean,
  canAccessSection: (section: string) => boolean,
): UnifiedQueueItem[] {
  return buildActionItems(stats, isSuper, canAccessSection).sort(
    (a, b) => URGENCY_ORDER[a.type] - URGENCY_ORDER[b.type]
  )
}
