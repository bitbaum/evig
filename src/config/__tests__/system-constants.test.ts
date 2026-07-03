/**
 * Tests for system-level config constants.
 *
 * Covers: notifications.ts, payment-status.ts, help-request-status.ts,
 * helper-status.ts.
 *
 * Mission-relevant: these constants match DB CHECK constraints. If a
 * constant value is renamed in code but not in the migration, all writes
 * using it fail silently at the DB level. Locking the exact string values
 * here catches accidental renames before they reach production.
 *
 * Behaviors locked:
 *   NOTIFICATION_TYPES — exact string values for all notification types
 *   RELATED_TYPES — exact string values for related entity types
 *   RELATED_TYPE_HREFS — each related type maps to a valid route prefix
 *   PAYMENT_STATUS / PAYMENT_TRANSACTION_TYPE / PAYMENT_DISPUTE_STATUS / ESCROW_STATUS
 *   HELP_REQUEST_STATUS — values match DB enum
 *   HELPER_STATUS + HELPER_STATUS_LABELS — values and Swiss-German labels
 */

import fs from 'node:fs'
import path from 'node:path'
import { NOTIFICATION_TYPES, RELATED_TYPES, RELATED_TYPE_HREFS } from '../notifications'
import {
  PAYMENT_STATUS,
  PAYMENT_TRANSACTION_TYPE,
  PAYMENT_DISPUTE_STATUS,
  ESCROW_STATUS,
} from '../payment-status'
import { HELP_REQUEST_STATUS } from '../activity'
import { HELPER_STATUS, HELPER_STATUS_LABELS } from '../helper-status'

// ============================================================================
// NOTIFICATION_TYPES
// ============================================================================

describe('NOTIFICATION_TYPES', () => {
  it('decision system types have expected values', () => {
    expect(NOTIFICATION_TYPES.DECISION_VOTING).toBe('decision_voting')
    expect(NOTIFICATION_TYPES.DECISION_CLOSED).toBe('decision_closed')
    expect(NOTIFICATION_TYPES.DECISION_DEADLINE).toBe('decision_deadline')
  })

  it('protocol type has expected value', () => {
    expect(NOTIFICATION_TYPES.PROTOCOL_FINALIZED).toBe('protocol_finalized')
  })

  it('task management types have expected values', () => {
    expect(NOTIFICATION_TYPES.TASK_ATTENTION).toBe('task_attention')
    expect(NOTIFICATION_TYPES.TASK_REQUEST).toBe('task_request')
    expect(NOTIFICATION_TYPES.TASK_REQUEST_RESPONSE).toBe('task_request_response')
    expect(NOTIFICATION_TYPES.TASK_COMPLETED).toBe('task_completed')
    expect(NOTIFICATION_TYPES.TASK_BROADCAST).toBe('task_broadcast')
  })

  it('IT-Hilfe types have expected values', () => {
    expect(NOTIFICATION_TYPES.IT_HILFE_REQUEST_CONFIRMATION).toBe('it_hilfe_request_confirmation')
    expect(NOTIFICATION_TYPES.IT_HILFE_MATCHING_REQUEST).toBe('it_hilfe_matching_request')
    expect(NOTIFICATION_TYPES.IT_HILFE_NEW_OFFER).toBe('it_hilfe_new_offer')
    expect(NOTIFICATION_TYPES.IT_HILFE_OFFER_ACCEPTED).toBe('it_hilfe_offer_accepted')
    expect(NOTIFICATION_TYPES.IT_HILFE_OFFER_REJECTED).toBe('it_hilfe_offer_rejected')
    expect(NOTIFICATION_TYPES.IT_HILFE_REQUEST_COMPLETED).toBe('it_hilfe_request_completed')
    expect(NOTIFICATION_TYPES.IT_HILFE_REVIEW_RECEIVED).toBe('it_hilfe_review_received')
  })

  it('time-off types have expected values', () => {
    expect(NOTIFICATION_TYPES.TIME_OFF_REQUESTED).toBe('time_off_requested')
    expect(NOTIFICATION_TYPES.TIME_OFF_REVIEWED).toBe('time_off_reviewed')
  })

  it('timecard types have expected values', () => {
    expect(NOTIFICATION_TYPES.TIMECARD_SUBMITTED).toBe('timecard_submitted')
    expect(NOTIFICATION_TYPES.TIMECARD_REVIEWED).toBe('timecard_reviewed')
  })

  it('blog submission type has expected value', () => {
    expect(NOTIFICATION_TYPES.BLOG_SUBMISSION_STATUS).toBe('blog_submission_status')
  })

  it('core types have expected values', () => {
    expect(NOTIFICATION_TYPES.MESSAGE).toBe('message')
    expect(NOTIFICATION_TYPES.APPOINTMENT).toBe('appointment')
    expect(NOTIFICATION_TYPES.MARKETPLACE).toBe('marketplace')
    expect(NOTIFICATION_TYPES.SYSTEM).toBe('system')
    expect(NOTIFICATION_TYPES.MARKETING).toBe('marketing')
  })
})

// ============================================================================
// RELATED_TYPES and RELATED_TYPE_HREFS
// ============================================================================

describe('RELATED_TYPES', () => {
  it('has expected values', () => {
    expect(RELATED_TYPES.TASK).toBe('task')
    expect(RELATED_TYPES.PROTOCOL).toBe('protocol')
    expect(RELATED_TYPES.DECISION).toBe('decision')
    expect(RELATED_TYPES.CONVERSATION).toBe('conversation')
    expect(RELATED_TYPES.APPOINTMENT).toBe('appointment')
    expect(RELATED_TYPES.IT_HILFE).toBe('it_hilfe')
  })
})

describe('RELATED_TYPE_HREFS', () => {
  it('every related type has a route prefix', () => {
    for (const type of Object.values(RELATED_TYPES)) {
      expect(RELATED_TYPE_HREFS[type]).toBeTruthy()
    }
  })

  it('all routes start with /', () => {
    for (const href of Object.values(RELATED_TYPE_HREFS)) {
      expect(href).toMatch(/^\//)
    }
  })

  it('all routes are ready for ID append (end with / or query =)', () => {
    // Most hrefs are path bases (".../"); the conversation deep-link appends
    // the id to a query param ("...?conversation="). Both are valid append points.
    for (const href of Object.values(RELATED_TYPE_HREFS)) {
      expect(href).toMatch(/[/=]$/)
    }
  })

  it('TASK maps to admin tasks route', () => {
    expect(RELATED_TYPE_HREFS[RELATED_TYPES.TASK]).toBe('/admin/tasks/')
  })

  it('IT_HILFE maps to it-hilfe route', () => {
    expect(RELATED_TYPE_HREFS[RELATED_TYPES.IT_HILFE]).toBe('/it-hilfe/')
  })

  it('LISTING uses marketplace query deep link (no [id] admin route)', () => {
    expect(RELATED_TYPE_HREFS[RELATED_TYPES.LISTING]).toBe('/admin/marketplace?listing=')
  })

  it('MEMBERSHIP deep-links to the MEMBER-facing dashboard (recipients are members, not staff)', () => {
    expect(RELATED_TYPE_HREFS[RELATED_TYPES.MEMBERSHIP]).toBe('/dashboard/membership?ref=')
  })
})

const APP_DIR = path.join(__dirname, '../../app')

/** Static check: each notification href base maps to an existing App Router page shell */
describe('RELATED_TYPE_HREFS route shells', () => {
  const cases: Array<{ type: string; pagePath: string }> = [
    { type: RELATED_TYPES.TASK, pagePath: 'admin/tasks/[id]/page.tsx' },
    { type: RELATED_TYPES.PROTOCOL, pagePath: 'admin/protocols/[id]/page.tsx' },
    { type: RELATED_TYPES.DECISION, pagePath: 'admin/decisions/[id]/page.tsx' },
    { type: RELATED_TYPES.CONVERSATION, pagePath: 'dashboard/messages/page.tsx' },
    { type: RELATED_TYPES.APPOINTMENT, pagePath: 'dashboard/appointments/[id]/page.tsx' },
    { type: RELATED_TYPES.IT_HILFE, pagePath: '[locale]/it-hilfe/[id]/page.tsx' },
    { type: RELATED_TYPES.WORKSHOP, pagePath: 'admin/workshops/instances/[id]/page.tsx' },
    { type: RELATED_TYPES.WORKSHOP_PROPOSAL, pagePath: 'admin/workshops/proposals/[id]/page.tsx' },
    { type: RELATED_TYPES.MEMBERSHIP, pagePath: 'admin/membership/page.tsx' },
    { type: RELATED_TYPES.LISTING, pagePath: 'admin/marketplace/page.tsx' },
    { type: RELATED_TYPES.TIME_OFF, pagePath: 'dashboard/timecards/page.tsx' },
    { type: RELATED_TYPES.TIME_OFF_REVIEW, pagePath: 'admin/team/approvals/page.tsx' },
    { type: RELATED_TYPES.TIMECARD, pagePath: 'dashboard/timecards/page.tsx' },
    { type: RELATED_TYPES.TIMECARD_REVIEW, pagePath: 'admin/team/approvals/page.tsx' },
  ]

  for (const { type, pagePath } of cases) {
    it(`${type} href base has page shell at ${pagePath}`, () => {
      expect(RELATED_TYPE_HREFS[type]).toBeTruthy()
      expect(fs.existsSync(path.join(APP_DIR, pagePath))).toBe(true)
    })
  }
})

// ============================================================================
// PAYMENT_STATUS
// ============================================================================

describe('PAYMENT_STATUS', () => {
  it('has expected values', () => {
    expect(PAYMENT_STATUS.PENDING).toBe('pending')
    expect(PAYMENT_STATUS.PROCESSING).toBe('processing')
    expect(PAYMENT_STATUS.SUCCEEDED).toBe('succeeded')
    expect(PAYMENT_STATUS.FAILED).toBe('failed')
    expect(PAYMENT_STATUS.CANCELLED).toBe('cancelled')
    expect(PAYMENT_STATUS.CONFIRMED).toBe('confirmed')
    expect(PAYMENT_STATUS.REFUNDED).toBe('refunded')
    expect(PAYMENT_STATUS.DISPUTED).toBe('disputed')
  })
})

describe('PAYMENT_TRANSACTION_TYPE', () => {
  it('matches DB CHECK constraint values', () => {
    expect(PAYMENT_TRANSACTION_TYPE.PAYMENT).toBe('payment')
    expect(PAYMENT_TRANSACTION_TYPE.REFUND).toBe('refund')
    expect(PAYMENT_TRANSACTION_TYPE.CHARGEBACK).toBe('chargeback')
    expect(PAYMENT_TRANSACTION_TYPE.PAYOUT).toBe('payout')
    expect(PAYMENT_TRANSACTION_TYPE.FEE).toBe('fee')
    expect(PAYMENT_TRANSACTION_TYPE.TRANSFER).toBe('transfer')
  })

  it('has exactly 6 types (matches DB enum)', () => {
    expect(Object.keys(PAYMENT_TRANSACTION_TYPE)).toHaveLength(6)
  })
})

describe('PAYMENT_DISPUTE_STATUS', () => {
  it('matches DB CHECK constraint values', () => {
    expect(PAYMENT_DISPUTE_STATUS.OPENED).toBe('opened')
    expect(PAYMENT_DISPUTE_STATUS.UNDER_REVIEW).toBe('under_review')
    expect(PAYMENT_DISPUTE_STATUS.WON).toBe('won')
    expect(PAYMENT_DISPUTE_STATUS.LOST).toBe('lost')
    expect(PAYMENT_DISPUTE_STATUS.CANCELLED).toBe('cancelled')
  })

  it('has exactly 5 statuses (matches DB enum)', () => {
    expect(Object.keys(PAYMENT_DISPUTE_STATUS)).toHaveLength(5)
  })
})

describe('ESCROW_STATUS', () => {
  it('has ACTIVE and RELEASED values', () => {
    expect(ESCROW_STATUS.ACTIVE).toBe('active')
    expect(ESCROW_STATUS.RELEASED).toBe('released')
  })
})

// ============================================================================
// HELP_REQUEST_STATUS
// ============================================================================

describe('HELP_REQUEST_STATUS', () => {
  it('has expected values', () => {
    expect(HELP_REQUEST_STATUS.OPEN).toBe('open')
    expect(HELP_REQUEST_STATUS.IN_PROGRESS).toBe('in_progress')
    expect(HELP_REQUEST_STATUS.RESOLVED).toBe('resolved')
    expect(HELP_REQUEST_STATUS.CANCELLED).toBe('cancelled')
  })

  it('has exactly 4 statuses', () => {
    expect(Object.keys(HELP_REQUEST_STATUS)).toHaveLength(4)
  })
})

// ============================================================================
// HELPER_STATUS
// ============================================================================

describe('HELPER_STATUS', () => {
  it('has expected values', () => {
    expect(HELPER_STATUS.ACTIVE).toBe('active')
    expect(HELPER_STATUS.VERIFIED).toBe('verified')
    expect(HELPER_STATUS.SUSPENDED).toBe('suspended')
  })
})

describe('HELPER_STATUS_LABELS', () => {
  it('has a Swiss-German label for every status', () => {
    for (const v of Object.values(HELPER_STATUS)) {
      expect(HELPER_STATUS_LABELS[v as keyof typeof HELPER_STATUS_LABELS]).toBeTruthy()
    }
  })

  it('"verified" maps to "Verifiziert"', () => {
    expect(HELPER_STATUS_LABELS.verified).toBe('Verifiziert')
  })

  it('"suspended" maps to "Suspendiert"', () => {
    expect(HELPER_STATUS_LABELS.suspended).toBe('Suspendiert')
  })
})
