import { mapTeamProfileUpdate } from '../team-profiles'
import type { UpdateTeamProfileInput } from '@/lib/schemas/team'

/**
 * mapTeamProfileUpdate is the SINGLE authorization guard shared by the admin
 * `[id]` route and the self-service `/me` route. These tests lock the invariant
 * that a non-super-admin can NEVER write payroll/sensitive fields — even if they
 * are present in the request body — so the self-service editor is safe.
 */
describe('mapTeamProfileUpdate — sensitive-field gating', () => {
  const withSensitive = {
    position: 'Technician',
    skills: ['linux'],
    salary_chf: 9999,
    hourly_rate_cents: 5000,
    ahv_number: '756.1234.5678.90',
    canton_tax_code: 'ZH',
    hr_notes: 'secret',
    salary_effective_date: '2026-01-01',
  } as unknown as UpdateTeamProfileInput

  it('DROPS every sensitive field when includeSensitive is false (self-service)', () => {
    const update = mapTeamProfileUpdate(withSensitive, false)
    // Non-sensitive fields flow through
    expect(update.position).toBe('Technician')
    expect(update.skills).toEqual(['linux'])
    // Sensitive fields are absent — cannot be written by a non-super
    expect(update).not.toHaveProperty('salaryChf')
    expect(update).not.toHaveProperty('hourlyRateCents')
    expect(update).not.toHaveProperty('ahvNumber')
    expect(update).not.toHaveProperty('cantonTaxCode')
    expect(update).not.toHaveProperty('hrNotes')
    expect(update).not.toHaveProperty('salaryEffectiveDate')
  })

  it('INCLUDES sensitive fields only when includeSensitive is true (super admin)', () => {
    const update = mapTeamProfileUpdate(withSensitive, true)
    expect(update.salaryChf).toBe(9999)
    expect(update.hourlyRateCents).toBe(5000)
    expect(update.ahvNumber).toBe('756.1234.5678.90')
    expect(update.cantonTaxCode).toBe('ZH')
    expect(update.hrNotes).toBe('secret')
  })

  it('maps snake_case input keys to the drizzle camelCase columns', () => {
    const update = mapTeamProfileUpdate(
      { development_areas: 'x', working_hours: 'Mo-Fr', show_on_about: true } as unknown as UpdateTeamProfileInput,
      false,
    )
    expect(update.developmentAreas).toBe('x')
    expect(update.workingHours).toBe('Mo-Fr')
    expect(update.showOnAbout).toBe(true)
  })

  it('omits keys that are undefined (partial update — no accidental nulling)', () => {
    const update = mapTeamProfileUpdate({ position: 'Lead' } as unknown as UpdateTeamProfileInput, false)
    expect(Object.keys(update)).toEqual(['position'])
  })
})
