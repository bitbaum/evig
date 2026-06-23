import {
  getTechnicianProfileGaps,
  isTechnicianProfileMatchReady,
  type TechnicianProfileFields,
} from '../technician-profile'

const complete: TechnicianProfileFields = {
  skills: ['hardware_diagnosis'],
  canton: 'Zürich',
  postalCode: '8001',
  city: 'Zürich',
}

describe('technician-profile completeness', () => {
  it('returns no gaps when profile is match-ready', () => {
    expect(getTechnicianProfileGaps(complete)).toEqual([])
    expect(isTechnicianProfileMatchReady(complete)).toBe(true)
  })

  it('flags missing skills', () => {
    expect(getTechnicianProfileGaps({ ...complete, skills: [] })).toContain('skills')
  })

  it('flags missing canton', () => {
    expect(getTechnicianProfileGaps({ ...complete, canton: '' })).toContain('canton')
  })

  it('flags missing location when PLZ and city are empty', () => {
    expect(getTechnicianProfileGaps({ ...complete, postalCode: '', city: '' })).toContain('location')
  })

  it('accepts city without PLZ', () => {
    expect(getTechnicianProfileGaps({ ...complete, postalCode: '' })).not.toContain('location')
  })
})
