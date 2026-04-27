/**
 * Tests for config/tasks.ts — task management configuration constants.
 *
 * Mission-relevant: task types and status labels appear on the admin
 * hirn/tasks page. If TASK_STATUS_LABELS['idle'] is empty, the task list
 * shows blank status badges.
 *
 * Behaviors locked:
 *   TASK_TYPE_LABELS — non-empty German label for every TASK_TYPES value
 *   TASK_STATUS_LABELS — non-empty German label for every TASK_STATUSES value
 *   TASK_CATEGORY_LABELS — non-empty German label for every TASK_CATEGORIES value
 *   TASK_PRIORITY_LABELS — non-empty German label for every TASK_PRIORITIES value
 *   PROJECT_STATUS_LABELS — non-empty German label for every PROJECT_STATUSES value
 *   REQUEST_STATUS_LABELS — non-empty German label for every REQUEST_STATUSES value
 *   TASK_STATUS_COLORS — color class string for every task status
 *   TASK_PRIORITY_COLORS — color class string for every priority
 */

import {
  TASK_TYPES,
  TASK_TYPE_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABELS,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
} from '../tasks'

// ============================================================================
// TASK_TYPE_LABELS
// ============================================================================

describe('TASK_TYPE_LABELS', () => {
  it('has non-empty German label for every task type', () => {
    for (const type of Object.values(TASK_TYPES)) {
      const label = TASK_TYPE_LABELS[type]
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })

  it('returns "Einmalig" for one_time', () => {
    expect(TASK_TYPE_LABELS[TASK_TYPES.ONE_TIME]).toBe('Einmalig')
  })
})

// ============================================================================
// TASK_STATUS_LABELS / TASK_STATUS_COLORS
// ============================================================================

describe('TASK_STATUS_LABELS', () => {
  it('has non-empty label for every task status', () => {
    for (const status of Object.values(TASK_STATUSES)) {
      const label = TASK_STATUS_LABELS[status]
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })

  it('returns "In Bearbeitung" for in_progress', () => {
    expect(TASK_STATUS_LABELS[TASK_STATUSES.IN_PROGRESS]).toBe('In Bearbeitung')
  })
})

describe('TASK_STATUS_COLORS', () => {
  it('has color class for every task status', () => {
    for (const status of Object.values(TASK_STATUSES)) {
      const color = TASK_STATUS_COLORS[status]
      expect(typeof color).toBe('string')
      expect(color.length).toBeGreaterThan(0)
    }
  })
})

// ============================================================================
// TASK_CATEGORY_LABELS
// ============================================================================

describe('TASK_CATEGORY_LABELS', () => {
  it('has non-empty German label for every task category', () => {
    for (const category of Object.values(TASK_CATEGORIES)) {
      const label = TASK_CATEGORY_LABELS[category]
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })
})

// ============================================================================
// TASK_PRIORITY_LABELS / TASK_PRIORITY_COLORS
// ============================================================================

describe('TASK_PRIORITY_LABELS', () => {
  it('has non-empty German label for every priority', () => {
    for (const priority of Object.values(TASK_PRIORITIES)) {
      const label = TASK_PRIORITY_LABELS[priority]
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })
})

describe('TASK_PRIORITY_COLORS', () => {
  it('has color class for every priority', () => {
    for (const priority of Object.values(TASK_PRIORITIES)) {
      const color = TASK_PRIORITY_COLORS[priority]
      expect(typeof color).toBe('string')
      expect(color.length).toBeGreaterThan(0)
    }
  })
})

// ============================================================================
// PROJECT_STATUS_LABELS
// ============================================================================

describe('PROJECT_STATUS_LABELS', () => {
  it('has non-empty German label for every project status', () => {
    for (const status of Object.values(PROJECT_STATUSES)) {
      const label = PROJECT_STATUS_LABELS[status]
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })
})

// ============================================================================
// REQUEST_STATUS_LABELS
// ============================================================================

describe('REQUEST_STATUS_LABELS', () => {
  it('has non-empty German label for every request status', () => {
    for (const status of Object.values(REQUEST_STATUSES)) {
      const label = REQUEST_STATUS_LABELS[status]
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    }
  })
})
