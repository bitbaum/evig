/**
 * Tests for config/terminology.ts
 */

import {
  TECHNICIAN_LABEL,
  technicianNotFoundMessage,
  onlyTechnicianMessage,
} from '@/config/terminology'

describe('terminology SSOT', () => {
  it('uses Techniker as user-facing label', () => {
    expect(TECHNICIAN_LABEL).toBe('Techniker')
  })

  it('builds not-found message', () => {
    expect(technicianNotFoundMessage()).toBe('Techniker nicht gefunden')
  })

  it('builds permission message', () => {
    expect(onlyTechnicianMessage('annehmen')).toBe('Nur der Techniker kann annehmen')
  })
})
