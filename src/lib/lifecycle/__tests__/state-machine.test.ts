/**
 * Tests for lifecycle/state-machine.ts — the declarative transition validator
 * shared by marketplace orders and service appointments.
 *
 * Behaviors locked:
 *   - no row for the action            → { ok: false, reason: 'unknown_action' }
 *   - row exists, role mismatch        → { ok: false, reason: 'wrong_role' }
 *   - role ok, from mismatch           → { ok: false, reason: 'wrong_state' }
 *   - role + from match                → { ok: true, to }
 *   - role omitted on a row            → any actor allowed
 *   - role as an array                 → any listed actor allowed
 *   - to omitted                       → { ok: true, to: null } (non-status action)
 *   - multiple rows per action         → first matching role+from wins
 *   - reason priority: role before state
 */

import { resolveTransition, canTransition, type TransitionTable } from '../state-machine'

// An order-shaped table (action === target status, role-gated).
const ORDER_TABLE: TransitionTable<'paid' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'pending_payment',
  'shipped' | 'delivered' | 'completed' | 'cancelled', 'buyer' | 'seller'> = [
  { action: 'shipped', from: 'paid', role: 'seller', to: 'shipped' },
  { action: 'cancelled', from: 'paid', role: 'buyer', to: 'cancelled' },
  { action: 'delivered', from: 'shipped', role: 'seller', to: 'delivered' },
  { action: 'completed', from: 'delivered', role: 'buyer', to: 'completed' },
  { action: 'cancelled', from: 'pending_payment', role: ['buyer', 'seller'], to: 'cancelled' },
]

describe('resolveTransition — basic decisions', () => {
  it('unknown_action when no row matches the action', () => {
    expect(resolveTransition(ORDER_TABLE, { from: 'paid', action: 'completed', role: 'buyer' }))
      .toEqual({ ok: false, reason: 'wrong_state' }) // completed exists but from!=delivered
    expect(resolveTransition(ORDER_TABLE, { from: 'paid', action: 'delivered', role: 'buyer' }))
      .toEqual({ ok: false, reason: 'wrong_role' }) // delivered is seller-only
  })

  it('wrong_role when the actor cannot perform the action', () => {
    expect(resolveTransition(ORDER_TABLE, { from: 'paid', action: 'shipped', role: 'buyer' }))
      .toEqual({ ok: false, reason: 'wrong_role' })
  })

  it('wrong_state when role is allowed but the current status is wrong', () => {
    expect(resolveTransition(ORDER_TABLE, { from: 'paid', action: 'delivered', role: 'seller' }))
      .toEqual({ ok: false, reason: 'wrong_state' })
  })

  it('ok with the target status when role and from both match', () => {
    expect(resolveTransition(ORDER_TABLE, { from: 'paid', action: 'shipped', role: 'seller' }))
      .toEqual({ ok: true, to: 'shipped' })
    expect(resolveTransition(ORDER_TABLE, { from: 'delivered', action: 'completed', role: 'buyer' }))
      .toEqual({ ok: true, to: 'completed' })
  })
})

describe('resolveTransition — role variants', () => {
  it('accepts any listed role for an array role', () => {
    expect(resolveTransition(ORDER_TABLE, { from: 'pending_payment', action: 'cancelled', role: 'buyer' }))
      .toEqual({ ok: true, to: 'cancelled' })
    expect(resolveTransition(ORDER_TABLE, { from: 'pending_payment', action: 'cancelled', role: 'seller' }))
      .toEqual({ ok: true, to: 'cancelled' })
  })

  it('picks the matching row when an action has multiple rows (cancelled from paid vs pending_payment)', () => {
    expect(resolveTransition(ORDER_TABLE, { from: 'paid', action: 'cancelled', role: 'buyer' }))
      .toEqual({ ok: true, to: 'cancelled' })
    // seller may cancel, but only from pending_payment — so a paid order is
    // wrong_state for the seller (the seller-eligible row requires pending_payment).
    expect(resolveTransition(ORDER_TABLE, { from: 'paid', action: 'cancelled', role: 'seller' }))
      .toEqual({ ok: false, reason: 'wrong_state' })
  })
})

describe('resolveTransition — appointment-shaped (role omitted, to omitted, role array)', () => {
  const APPT_TABLE: TransitionTable<'requested' | 'completed' | 'cancelled' | 'accepted', 'rate' | 'cancel' | 'unknownish', 'customer' | 'repairer'> = [
    { action: 'rate', from: 'completed', role: 'customer' }, // no `to` — non-status action
    { action: 'cancel', from: ['requested', 'accepted'], role: ['customer', 'repairer'], to: 'cancelled' },
  ]

  it('returns to: null for an action with no target status', () => {
    expect(resolveTransition(APPT_TABLE, { from: 'completed', action: 'rate', role: 'customer' }))
      .toEqual({ ok: true, to: null })
  })

  it('honours an array of allowed from-states', () => {
    expect(resolveTransition(APPT_TABLE, { from: 'accepted', action: 'cancel', role: 'repairer' }))
      .toEqual({ ok: true, to: 'cancelled' })
    expect(resolveTransition(APPT_TABLE, { from: 'completed', action: 'cancel', role: 'customer' }))
      .toEqual({ ok: false, reason: 'wrong_state' })
  })

  it('unknown_action for an action with no rows', () => {
    expect(resolveTransition(APPT_TABLE, { from: 'completed', action: 'unknownish', role: 'customer' }))
      .toEqual({ ok: false, reason: 'unknown_action' })
  })

  it('null actor role fails role-gated rows', () => {
    expect(resolveTransition(APPT_TABLE, { from: 'completed', action: 'rate', role: null }))
      .toEqual({ ok: false, reason: 'wrong_role' })
  })
})

describe('canTransition', () => {
  it('is true only when resolveTransition is ok', () => {
    expect(canTransition(ORDER_TABLE, { from: 'paid', action: 'shipped', role: 'seller' })).toBe(true)
    expect(canTransition(ORDER_TABLE, { from: 'paid', action: 'shipped', role: 'buyer' })).toBe(false)
  })
})
