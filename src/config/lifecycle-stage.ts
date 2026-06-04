/**
 * Lifecycle Stage — Shared Status Taxonomy (QQ.5)
 *
 * Three subsystems carry their own status enums:
 *   - booking-status.ts        (repair appointments — 9 states + 2 aliases)
 *   - appointment-status.ts    (service appointments / generic — 6 states)
 *   - it-hilfe.ts REQUEST_STATUS (peer-help requests — 5 states)
 *
 * They are conceptually similar lifecycles but with subtly different
 * states tailored to each domain. Merging them entirely would erase
 * meaningful distinctions (e.g. quote_approved is specific to repairs).
 *
 * This module provides a HIGHER-LEVEL taxonomy that every subsystem
 * maps to: pending → active → completed | cancelled. Code that doesn't
 * need to know subsystem specifics (generic "is this done?" checks,
 * cross-subsystem dashboards, status badge tiering) operates here.
 *
 * Additive only — does not change any existing enum, label, or caller.
 */

import { BOOKING_STATUS } from './booking-status'
import { APPOINTMENT_STATUS } from './appointment-status'
import { REQUEST_STATUS } from './it-hilfe'

export const LIFECYCLE_STAGE = {
  PENDING:   'pending',
  ACTIVE:    'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type LifecycleStage = typeof LIFECYCLE_STAGE[keyof typeof LIFECYCLE_STAGE]

export const LIFECYCLE_STAGE_LABELS: Record<LifecycleStage, string> = {
  [LIFECYCLE_STAGE.PENDING]:   'Ausstehend',
  [LIFECYCLE_STAGE.ACTIVE]:    'Aktiv',
  [LIFECYCLE_STAGE.COMPLETED]: 'Abgeschlossen',
  [LIFECYCLE_STAGE.CANCELLED]: 'Storniert',
}

/** Maps each subsystem's specific status string to a lifecycle stage. */
const BOOKING_STATUS_TO_STAGE: Record<string, LifecycleStage> = {
  [BOOKING_STATUS.REQUESTED]:        LIFECYCLE_STAGE.PENDING,
  [BOOKING_STATUS.PENDING]:          LIFECYCLE_STAGE.PENDING,
  [BOOKING_STATUS.QUOTED]:           LIFECYCLE_STAGE.PENDING,
  [BOOKING_STATUS.QUOTE_REJECTED]:   LIFECYCLE_STAGE.PENDING,
  [BOOKING_STATUS.ACCEPTED]:         LIFECYCLE_STAGE.ACTIVE,
  [BOOKING_STATUS.QUOTE_APPROVED]:   LIFECYCLE_STAGE.ACTIVE,
  [BOOKING_STATUS.CONFIRMED]:        LIFECYCLE_STAGE.ACTIVE,
  [BOOKING_STATUS.IN_PROGRESS]:      LIFECYCLE_STAGE.ACTIVE,
  [BOOKING_STATUS.COMPLETED]:        LIFECYCLE_STAGE.COMPLETED,
  [BOOKING_STATUS.REJECTED]:         LIFECYCLE_STAGE.CANCELLED,
  [BOOKING_STATUS.CANCELLED]:        LIFECYCLE_STAGE.CANCELLED,
}

const APPOINTMENT_STATUS_TO_STAGE: Record<string, LifecycleStage> = {
  [APPOINTMENT_STATUS.PENDING_APPROVAL]: LIFECYCLE_STAGE.PENDING,
  [APPOINTMENT_STATUS.REQUESTED]:        LIFECYCLE_STAGE.PENDING,
  [APPOINTMENT_STATUS.CONFIRMED]:        LIFECYCLE_STAGE.ACTIVE,
  [APPOINTMENT_STATUS.IN_PROGRESS]:      LIFECYCLE_STAGE.ACTIVE,
  [APPOINTMENT_STATUS.COMPLETED]:        LIFECYCLE_STAGE.COMPLETED,
  [APPOINTMENT_STATUS.CANCELLED]:        LIFECYCLE_STAGE.CANCELLED,
}

const IT_HILFE_STATUS_TO_STAGE: Record<string, LifecycleStage> = {
  [REQUEST_STATUS.OPEN]:      LIFECYCLE_STAGE.PENDING,
  [REQUEST_STATUS.MATCHED]:   LIFECYCLE_STAGE.ACTIVE,
  [REQUEST_STATUS.COMPLETED]: LIFECYCLE_STAGE.COMPLETED,
  [REQUEST_STATUS.CANCELLED]: LIFECYCLE_STAGE.CANCELLED,
  [REQUEST_STATUS.EXPIRED]:   LIFECYCLE_STAGE.CANCELLED,
}

export function bookingStatusToStage(status: string): LifecycleStage {
  return BOOKING_STATUS_TO_STAGE[status] ?? LIFECYCLE_STAGE.PENDING
}

export function appointmentStatusToStage(status: string): LifecycleStage {
  return APPOINTMENT_STATUS_TO_STAGE[status] ?? LIFECYCLE_STAGE.PENDING
}

export function itHilfeStatusToStage(status: string): LifecycleStage {
  return IT_HILFE_STATUS_TO_STAGE[status] ?? LIFECYCLE_STAGE.PENDING
}

/** Predicate helpers — work across all three subsystems. */
export function isPending(stage: LifecycleStage): boolean {
  return stage === LIFECYCLE_STAGE.PENDING
}
export function isActive(stage: LifecycleStage): boolean {
  return stage === LIFECYCLE_STAGE.ACTIVE
}
export function isDone(stage: LifecycleStage): boolean {
  return stage === LIFECYCLE_STAGE.COMPLETED || stage === LIFECYCLE_STAGE.CANCELLED
}
export function isCancelled(stage: LifecycleStage): boolean {
  return stage === LIFECYCLE_STAGE.CANCELLED
}

/** StatusBadge variant for each lifecycle stage — pairs with @/components/ui/status-badge. */
export const LIFECYCLE_STAGE_VARIANT: Record<LifecycleStage, 'warning' | 'success' | 'neutral'> = {
  [LIFECYCLE_STAGE.PENDING]:   'warning',
  [LIFECYCLE_STAGE.ACTIVE]:    'success',
  [LIFECYCLE_STAGE.COMPLETED]: 'success',
  [LIFECYCLE_STAGE.CANCELLED]: 'neutral',
}
