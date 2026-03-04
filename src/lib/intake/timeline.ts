/**
 * Intake Timeline Helper (Server-only)
 *
 * Manages the chronological audit trail for device processing.
 * Events are stored as JSONB array in inventory_items.intake_events.
 *
 * For client-safe types/constants, import from '@/lib/intake/timeline-types'.
 */

import { query } from '@/lib/auth/db'
import { TABLE_NAMES } from '@/config/database'
import { logger } from '@/lib/logger'

// Re-export types so existing server-side imports still work
export type { IntakeEventType, IntakeEvent, StoredIntakeEvent } from './timeline-types'
export { EVENT_TYPE_LABELS, EVENT_TYPE_ICONS } from './timeline-types'

import type { IntakeEvent, StoredIntakeEvent } from './timeline-types'

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Append an event to the intake_events JSONB array.
 * Uses jsonb_concat (||) for atomic append.
 */
export async function appendIntakeEvent(
  inventoryId: string,
  event: IntakeEvent,
): Promise<void> {
  const storedEvent: StoredIntakeEvent = {
    ...event,
    timestamp: event.timestamp || new Date().toISOString(),
  }

  try {
    await query(
      `UPDATE ${TABLE_NAMES.INVENTORY_ITEMS}
       SET intake_events = COALESCE(intake_events, '[]'::jsonb) || $1::jsonb
       WHERE id = $2`,
      [JSON.stringify([storedEvent]), inventoryId]
    )
  } catch (error) {
    // Timeline is non-critical — log but don't throw
    logger.error('Failed to append intake event', {
      inventoryId,
      eventType: event.type,
      error,
    })
  }
}
