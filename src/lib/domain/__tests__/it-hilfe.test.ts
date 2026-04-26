/**
 * Tests for IT-Hilfe domain functions.
 *
 * Pure form-to-payload transformation + Zod-backed validation. These
 * power the IT-Hilfe create + edit flows; bugs here break the
 * mission-critical repair-needs-to-technician matchmaking entry point.
 */

import { transformITHilfeFormToPayload, validateITHilfeForm } from '../it-hilfe'
import { INITIAL_IT_HILFE_FORM } from '@/types/it-hilfe-form'

const validForm = {
  ...INITIAL_IT_HILFE_FORM,
  title: 'Mein Laptop startet nicht',
  description: 'Beim Drücken des Power-Knopfes passiert nichts.',
  postalCode: '8004',
  city: 'Zürich',
  canton: 'Zürich',
  skillsNeeded: [],
}

describe('transformITHilfeFormToPayload', () => {
  it('passes title and description through verbatim', () => {
    const payload = transformITHilfeFormToPayload(validForm)
    expect(payload.title).toBe('Mein Laptop startet nicht')
    expect(payload.description).toBe('Beim Drücken des Power-Knopfes passiert nichts.')
  })

  it('converts maxBudget string to integer cents', () => {
    const payload = transformITHilfeFormToPayload({ ...validForm, maxBudget: '50' })
    expect(payload.maxBudgetCents).toBe(5000)
  })

  it('handles fractional CHF amounts in maxBudget', () => {
    const payload = transformITHilfeFormToPayload({ ...validForm, maxBudget: '12.50' })
    expect(payload.maxBudgetCents).toBe(1250)
  })

  it('rounds rather than truncates fractional cents', () => {
    // 12.345 → 1234.5 → Math.round → 1235
    const payload = transformITHilfeFormToPayload({ ...validForm, maxBudget: '12.345' })
    expect(payload.maxBudgetCents).toBe(1235)
  })

  it('returns null for empty maxBudget', () => {
    const payload = transformITHilfeFormToPayload({ ...validForm, maxBudget: '' })
    expect(payload.maxBudgetCents).toBeNull()
  })

  it('converts empty optional strings to null (not empty string)', () => {
    const payload = transformITHilfeFormToPayload({
      ...validForm,
      deviceBrand: '',
      deviceModel: '',
      description: '',
      postalCode: '',
      city: '',
      canton: '',
      aiDiagnosis: '',
    })
    expect(payload.deviceBrand).toBeNull()
    expect(payload.deviceModel).toBeNull()
    expect(payload.description).toBeNull()
    expect(payload.postalCode).toBeNull()
    expect(payload.city).toBeNull()
    expect(payload.canton).toBeNull()
    expect(payload.aiDiagnosis).toBeNull()
  })

  it('converts empty categoryId/urgency to undefined (zod .optional())', () => {
    const payload = transformITHilfeFormToPayload({ ...validForm, categoryId: '', urgency: '' })
    expect(payload.categoryId).toBeUndefined()
    expect(payload.urgency).toBeUndefined()
  })

  it('omits imageUrls when array is empty (zod .optional())', () => {
    const payload = transformITHilfeFormToPayload({ ...validForm, imageUrls: [] })
    expect(payload.imageUrls).toBeUndefined()
  })

  it('preserves imageUrls when array has entries', () => {
    const urls = ['/uploads/a.jpg', '/uploads/b.jpg']
    const payload = transformITHilfeFormToPayload({ ...validForm, imageUrls: urls })
    expect(payload.imageUrls).toEqual(urls)
  })

  it('preserves serviceType and skillsNeeded as-is', () => {
    const payload = transformITHilfeFormToPayload({
      ...validForm,
      serviceType: 'remote',
      skillsNeeded: ['hardware_diagnosis'],
    })
    expect(payload.serviceType).toBe('remote')
    expect(payload.skillsNeeded).toEqual(['hardware_diagnosis'])
  })
})

describe('validateITHilfeForm', () => {
  it('returns null for a valid form', () => {
    expect(validateITHilfeForm(validForm)).toBeNull()
  })

  it('rejects a too-short title with the schema message', () => {
    const error = validateITHilfeForm({ ...validForm, title: 'hi' })
    expect(error).toContain('mindestens 5 Zeichen')
  })

  it('rejects a too-long title', () => {
    const error = validateITHilfeForm({ ...validForm, title: 'a'.repeat(201) })
    expect(error).toContain('maximal 200 Zeichen')
  })

  it('rejects a malformed postal code (not 4 digits)', () => {
    const error = validateITHilfeForm({ ...validForm, postalCode: '12' })
    expect(error).toContain('4 Ziffern')
  })

  it('rejects a budget over CHF 1000 (the schema cap)', () => {
    const error = validateITHilfeForm({ ...validForm, maxBudget: '1500' })
    expect(error).toContain('CHF 1000')
  })

  it('accepts a budget at exactly the CHF 1000 cap', () => {
    expect(validateITHilfeForm({ ...validForm, maxBudget: '1000' })).toBeNull()
  })

  it('accepts an empty postalCode (optional in schema)', () => {
    expect(validateITHilfeForm({ ...validForm, postalCode: '' })).toBeNull()
  })

  it('accepts a form with no skills', () => {
    expect(validateITHilfeForm({ ...validForm, skillsNeeded: [] })).toBeNull()
  })

  it('rejects more than 10 skills', () => {
    const eleven = Array(11).fill('hardware_diagnosis')
    const error = validateITHilfeForm({ ...validForm, skillsNeeded: eleven })
    expect(error).toContain('Maximal 10')
  })
})
