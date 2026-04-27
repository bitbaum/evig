/**
 * Tests for config/decisions.ts — decision status and voting helpers.
 *
 * Mission-relevant: Revamp-IT uses participatory decision-making for
 * association governance. isStatusEditable gates whether members can
 * modify a decision — wrong result could allow edits to closed votes or
 * block edits on drafts. isStatusCommentable controls discussion access.
 *
 * Behaviors locked:
 *   isStatusEditable
 *   - returns true for 'draft' and 'discussion'
 *   - returns false for 'voting', 'closed', 'cancelled'
 *
 *   isStatusCommentable
 *   - returns true for 'discussion', 'voting', 'closed'
 *   - returns false for 'draft', 'cancelled'
 *
 *   DECISION_STATUS constants exist and map to expected string values
 *   VALID_TRANSITIONS is defined and has entries for each status
 */

import {
  isStatusEditable,
  isStatusCommentable,
  DECISION_STATUS,
  EDITABLE_STATUSES,
  COMMENTABLE_STATUSES,
  VALID_TRANSITIONS,
} from '../decisions'

// ============================================================================
// isStatusEditable
// ============================================================================

describe('isStatusEditable', () => {
  it('returns true for "draft"', () => {
    expect(isStatusEditable(DECISION_STATUS.DRAFT)).toBe(true)
  })

  it('returns true for "discussion"', () => {
    expect(isStatusEditable(DECISION_STATUS.DISCUSSION)).toBe(true)
  })

  it('returns false for "voting"', () => {
    expect(isStatusEditable(DECISION_STATUS.VOTING)).toBe(false)
  })

  it('returns false for "closed"', () => {
    expect(isStatusEditable(DECISION_STATUS.CLOSED)).toBe(false)
  })

  it('returns false for "cancelled"', () => {
    expect(isStatusEditable(DECISION_STATUS.CANCELLED)).toBe(false)
  })

  it('EDITABLE_STATUSES contains exactly draft and discussion', () => {
    expect(EDITABLE_STATUSES).toContain('draft')
    expect(EDITABLE_STATUSES).toContain('discussion')
    expect(EDITABLE_STATUSES).toHaveLength(2)
  })
})

// ============================================================================
// isStatusCommentable
// ============================================================================

describe('isStatusCommentable', () => {
  it('returns true for "discussion"', () => {
    expect(isStatusCommentable(DECISION_STATUS.DISCUSSION)).toBe(true)
  })

  it('returns true for "voting"', () => {
    expect(isStatusCommentable(DECISION_STATUS.VOTING)).toBe(true)
  })

  it('returns true for "closed"', () => {
    expect(isStatusCommentable(DECISION_STATUS.CLOSED)).toBe(true)
  })

  it('returns false for "draft"', () => {
    expect(isStatusCommentable(DECISION_STATUS.DRAFT)).toBe(false)
  })

  it('returns false for "cancelled"', () => {
    expect(isStatusCommentable(DECISION_STATUS.CANCELLED)).toBe(false)
  })

  it('COMMENTABLE_STATUSES contains discussion, voting, closed', () => {
    expect(COMMENTABLE_STATUSES).toContain('discussion')
    expect(COMMENTABLE_STATUSES).toContain('voting')
    expect(COMMENTABLE_STATUSES).toContain('closed')
  })
})

// ============================================================================
// DECISION_STATUS constants
// ============================================================================

describe('DECISION_STATUS', () => {
  it('defines expected status values', () => {
    expect(DECISION_STATUS.DRAFT).toBe('draft')
    expect(DECISION_STATUS.DISCUSSION).toBe('discussion')
    expect(DECISION_STATUS.VOTING).toBe('voting')
    expect(DECISION_STATUS.CLOSED).toBe('closed')
    expect(DECISION_STATUS.CANCELLED).toBe('cancelled')
  })
})

// ============================================================================
// VALID_TRANSITIONS
// ============================================================================

describe('VALID_TRANSITIONS', () => {
  it('draft can transition to discussion', () => {
    expect(VALID_TRANSITIONS['draft']).toContain('discussion')
  })

  it('discussion can transition to voting', () => {
    expect(VALID_TRANSITIONS['discussion']).toContain('voting')
  })

  it('closed status has no outgoing transitions', () => {
    expect(VALID_TRANSITIONS['closed']).toHaveLength(0)
  })
})
