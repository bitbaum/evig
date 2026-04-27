/**
 * Tests for hirn/action-executor-contracts.ts — action input validation.
 *
 * Mission-relevant: HIRN can trigger actions (create_task, navigate, etc.)
 * on staff behalf. If validateExecuteActionInput accepts a missing actionId,
 * the executor may attempt a DB write with an undefined key. If isRiskyAction
 * incorrectly returns true for 'navigate', the UI shows an unnecessary
 * dry-run confirmation dialog, blocking staff flow.
 *
 * Behaviors locked:
 *   validateExecuteActionInput
 *   - returns success=true for valid input
 *   - rejects missing actionId
 *   - rejects empty actionId
 *   - rejects actionId longer than 80 characters
 *   - rejects unknown actionType
 *   - accepts all valid actionType values
 *   - defaults dryRun to false when omitted
 *
 *   isRiskyAction
 *   - returns false for all current action types (none are risky)
 */

import { validateExecuteActionInput, isRiskyAction } from '../action-executor-contracts'

const VALID_INPUT = {
  actionId: 'action-123',
  actionType: 'navigate' as const,
  payload: { url: '/admin/tasks' },
}

// ============================================================================
// validateExecuteActionInput
// ============================================================================

describe('validateExecuteActionInput', () => {
  it('returns success=true for valid input', () => {
    const result = validateExecuteActionInput(VALID_INPUT)
    expect(result.success).toBe(true)
  })

  it('defaults dryRun to false when omitted', () => {
    const result = validateExecuteActionInput(VALID_INPUT)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dryRun).toBe(false)
    }
  })

  it('accepts dryRun=true when provided', () => {
    const result = validateExecuteActionInput({ ...VALID_INPUT, dryRun: true })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.dryRun).toBe(true)
    }
  })

  it('rejects missing actionId', () => {
    const { actionId: _removed, ...rest } = VALID_INPUT
    const result = validateExecuteActionInput(rest)
    expect(result.success).toBe(false)
  })

  it('rejects empty actionId', () => {
    const result = validateExecuteActionInput({ ...VALID_INPUT, actionId: '' })
    expect(result.success).toBe(false)
  })

  it('rejects actionId longer than 80 characters', () => {
    const result = validateExecuteActionInput({ ...VALID_INPUT, actionId: 'a'.repeat(81) })
    expect(result.success).toBe(false)
  })

  it('accepts actionId exactly 80 characters', () => {
    const result = validateExecuteActionInput({ ...VALID_INPUT, actionId: 'a'.repeat(80) })
    expect(result.success).toBe(true)
  })

  it('rejects unknown actionType', () => {
    const result = validateExecuteActionInput({ ...VALID_INPUT, actionType: 'delete_user' })
    expect(result.success).toBe(false)
  })

  it('accepts create_task actionType', () => {
    const result = validateExecuteActionInput({ ...VALID_INPUT, actionType: 'create_task' })
    expect(result.success).toBe(true)
  })

  it('accepts create_decision_draft actionType', () => {
    const result = validateExecuteActionInput({ ...VALID_INPUT, actionType: 'create_decision_draft' })
    expect(result.success).toBe(true)
  })

  it('accepts create_protocol_draft actionType', () => {
    const result = validateExecuteActionInput({ ...VALID_INPUT, actionType: 'create_protocol_draft' })
    expect(result.success).toBe(true)
  })

  it('accepts navigate actionType', () => {
    const result = validateExecuteActionInput({ ...VALID_INPUT, actionType: 'navigate' })
    expect(result.success).toBe(true)
  })

  it('rejects null input', () => {
    const result = validateExecuteActionInput(null)
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// isRiskyAction
// ============================================================================

describe('isRiskyAction', () => {
  it('returns false for navigate', () => {
    expect(isRiskyAction('navigate')).toBe(false)
  })

  it('returns false for create_task', () => {
    expect(isRiskyAction('create_task')).toBe(false)
  })

  it('returns false for create_decision_draft', () => {
    expect(isRiskyAction('create_decision_draft')).toBe(false)
  })

  it('returns false for create_protocol_draft', () => {
    expect(isRiskyAction('create_protocol_draft')).toBe(false)
  })
})
