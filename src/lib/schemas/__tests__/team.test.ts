/**
 * Tests for team profile Zod schemas (lib/schemas/team.ts)
 *
 * Team profiles store employment data, skills, and emergency contacts for
 * Revamp-IT staff and volunteers. Correct validation ensures HR data quality.
 *
 * Covers: teamProfileSchema, createTeamProfileSchema, updateTeamProfileSchema,
 *         teamProfileFilterSchema.
 */

import {
  teamProfileSchema,
  createTeamProfileSchema,
  updateTeamProfileSchema,
  teamProfileFilterSchema,
} from '../team'

import {
  EMPLOYMENT_TYPE_OPTIONS,
  CONTACT_METHOD_OPTIONS,
  EMERGENCY_RELATION_OPTIONS,
} from '@/config/team'

// ============================================================================
// teamProfileSchema
// ============================================================================

describe('teamProfileSchema', () => {
  it('accepts empty object (all optional)', () => {
    const result = teamProfileSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('defaults skills to []', () => {
    const result = teamProfileSchema.safeParse({})
    if (result.success) expect(result.data.skills).toEqual([])
  })

  it('defaults interests to []', () => {
    const result = teamProfileSchema.safeParse({})
    if (result.success) expect(result.data.interests).toEqual([])
  })

  it('defaults preferred_contact to email', () => {
    const result = teamProfileSchema.safeParse({})
    if (result.success) expect(result.data.preferred_contact).toBe('email')
  })

  it('defaults is_active to true', () => {
    const result = teamProfileSchema.safeParse({})
    if (result.success) expect(result.data.is_active).toBe(true)
  })

  it('accepts all valid employment types', () => {
    for (const employment_type of EMPLOYMENT_TYPE_OPTIONS) {
      const result = teamProfileSchema.safeParse({ employment_type })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid employment type', () => {
    const result = teamProfileSchema.safeParse({ employment_type: 'freelancer' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid contact methods', () => {
    for (const preferred_contact of CONTACT_METHOD_OPTIONS) {
      const result = teamProfileSchema.safeParse({ preferred_contact })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid contact method', () => {
    const result = teamProfileSchema.safeParse({ preferred_contact: 'fax' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid emergency relation options', () => {
    for (const emergency_contact_relation of EMERGENCY_RELATION_OPTIONS) {
      const result = teamProfileSchema.safeParse({ emergency_contact_relation })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid emergency relation', () => {
    const result = teamProfileSchema.safeParse({ emergency_contact_relation: 'neighbor' })
    expect(result.success).toBe(false)
  })

  it('rejects position longer than 100 characters', () => {
    const result = teamProfileSchema.safeParse({ position: 'x'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('rejects contract_hours below 0', () => {
    const result = teamProfileSchema.safeParse({ contract_hours: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects contract_hours above 100', () => {
    const result = teamProfileSchema.safeParse({ contract_hours: 101 })
    expect(result.success).toBe(false)
  })

  it('accepts contract_hours of 0 and 100', () => {
    for (const contract_hours of [0, 100]) {
      const result = teamProfileSchema.safeParse({ contract_hours })
      expect(result.success).toBe(true)
    }
  })

  it('rejects non-integer contract_hours', () => {
    const result = teamProfileSchema.safeParse({ contract_hours: 37.5 })
    expect(result.success).toBe(false)
  })

  it('rejects more than 20 skills', () => {
    const skills = Array.from({ length: 21 }, (_, i) => `skill${i}`)
    const result = teamProfileSchema.safeParse({ skills })
    expect(result.success).toBe(false)
  })

  it('rejects a skill longer than 50 characters', () => {
    const result = teamProfileSchema.safeParse({ skills: ['x'.repeat(51)] })
    expect(result.success).toBe(false)
  })

  it('rejects more than 10 interests', () => {
    const interests = Array.from({ length: 11 }, (_, i) => `interest${i}`)
    const result = teamProfileSchema.safeParse({ interests })
    expect(result.success).toBe(false)
  })

  it('rejects goals longer than 2000 characters', () => {
    const result = teamProfileSchema.safeParse({ goals: 'x'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('rejects hr_notes longer than 5000 characters', () => {
    const result = teamProfileSchema.safeParse({ hr_notes: 'x'.repeat(5001) })
    expect(result.success).toBe(false)
  })

  it('accepts full valid profile', () => {
    const result = teamProfileSchema.safeParse({
      position: 'IT-Spezialist',
      employment_type: 'volunteer',
      contract_hours: 20,
      skills: ['Linux', 'Python'],
      interests: ['Hardware'],
      preferred_contact: 'email',
      is_active: true,
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// createTeamProfileSchema
// ============================================================================

describe('createTeamProfileSchema', () => {
  it('requires user_id', () => {
    const result = createTeamProfileSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts valid UUID user_id', () => {
    const result = createTeamProfileSchema.safeParse({
      user_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-UUID user_id', () => {
    const result = createTeamProfileSchema.safeParse({ user_id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// updateTeamProfileSchema
// ============================================================================

describe('updateTeamProfileSchema', () => {
  it('accepts empty object (all optional)', () => {
    const result = updateTeamProfileSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts partial update with one field', () => {
    const result = updateTeamProfileSchema.safeParse({ position: 'Senior Developer' })
    expect(result.success).toBe(true)
  })

  it('still enforces field constraints on provided fields', () => {
    const result = updateTeamProfileSchema.safeParse({ contract_hours: -1 })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// teamProfileFilterSchema
// ============================================================================

describe('teamProfileFilterSchema', () => {
  it('accepts empty query (defaults applied)', () => {
    const result = teamProfileFilterSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('defaults is_active to "all"', () => {
    const result = teamProfileFilterSchema.safeParse({})
    if (result.success) expect(result.data.is_active).toBe('all')
  })

  it('accepts is_active "true", "false", "all"', () => {
    for (const is_active of ['true', 'false', 'all']) {
      const result = teamProfileFilterSchema.safeParse({ is_active })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid is_active value', () => {
    const result = teamProfileFilterSchema.safeParse({ is_active: 'yes' })
    expect(result.success).toBe(false)
  })

  it('rejects search longer than 100 characters', () => {
    const result = teamProfileFilterSchema.safeParse({ search: 'x'.repeat(101) })
    expect(result.success).toBe(false)
  })
})
