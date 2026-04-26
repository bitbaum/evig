/**
 * Tests for marketplace domain functions.
 *
 * Pure form-to-payload transformation + Zod-backed validation. These
 * power the seller-side listing create + edit flows; bugs here break
 * the donor → buyer pipeline.
 */

import { transformListingFormToPayload, validateListingForm } from '../marketplace'
import { INITIAL_LISTING_FORM } from '@/types/listing-form'

const validForm = {
  ...INITIAL_LISTING_FORM,
  title: 'ThinkPad T480',
  description: 'Refurbished laptop, ready for daily work.',
  price: '300',
  category: '10', // Laptops
  condition: 'good',
  brand: 'Lenovo',
  model: 'T480',
}

describe('transformListingFormToPayload', () => {
  it('parses price string to number', () => {
    const payload = transformListingFormToPayload({ ...validForm, price: '450' })
    expect(payload.price_chf).toBe(450)
  })

  it('falls back price to 0 when string is empty', () => {
    const payload = transformListingFormToPayload({ ...validForm, price: '' })
    expect(payload.price_chf).toBe(0)
  })

  it('falls back price to 0 when string is non-numeric', () => {
    const payload = transformListingFormToPayload({ ...validForm, price: 'abc' })
    expect(payload.price_chf).toBe(0)
  })

  it('parses fractional price', () => {
    const payload = transformListingFormToPayload({ ...validForm, price: '99.95' })
    expect(payload.price_chf).toBe(99.95)
  })

  it('trims title, description, brand, model, pickup_location', () => {
    const payload = transformListingFormToPayload({
      ...validForm,
      title: '  Padded Title  ',
      description: '  Padded description text. ',
      brand: '  Lenovo  ',
      model: '  T480  ',
      pickupLocation: '  Zürich Hauptbahnhof  ',
    })
    expect(payload.title).toBe('Padded Title')
    expect(payload.description).toBe('Padded description text.')
    expect(payload.brand).toBe('Lenovo')
    expect(payload.model).toBe('T480')
    expect(payload.pickup_location).toBe('Zürich Hauptbahnhof')
  })

  it('converts empty optional strings to null', () => {
    const payload = transformListingFormToPayload({
      ...validForm,
      brand: '',
      model: '',
      pickupLocation: '',
    })
    expect(payload.brand).toBeNull()
    expect(payload.model).toBeNull()
    expect(payload.pickup_location).toBeNull()
  })

  it('parses shippingCost when provided, null when empty', () => {
    expect(transformListingFormToPayload({ ...validForm, shippingCost: '7.50' }).shipping_cost_chf).toBe(7.5)
    expect(transformListingFormToPayload({ ...validForm, shippingCost: '' }).shipping_cost_chf).toBeNull()
  })

  it('always sets status to "active"', () => {
    const payload = transformListingFormToPayload(validForm)
    expect(payload.status).toBe('active')
  })

  it('filters specs with empty values and trims values', () => {
    const payload = transformListingFormToPayload({
      ...validForm,
      specs: [
        { key: 'CPU', value: '  i5-8350U  ', unit: undefined },
        { key: 'RAM', value: '', unit: 'GB' }, // dropped
        { key: 'SSD', value: '256', unit: 'GB' },
      ],
    })
    expect(payload.specs).toEqual([
      { key: 'CPU', value: 'i5-8350U', unit: null },
      { key: 'SSD', value: '256', unit: 'GB' },
    ])
  })

  it('omits condition_checks when empty (undefined, not [])', () => {
    const payload = transformListingFormToPayload({ ...validForm, conditionChecks: [] })
    expect(payload.condition_checks).toBeUndefined()
  })

  it('drops condition_checks label, keeps only key + checked', () => {
    const payload = transformListingFormToPayload({
      ...validForm,
      conditionChecks: [
        { key: 'screen_ok', label: 'Bildschirm OK', checked: true },
        { key: 'keyboard_ok', label: 'Tastatur OK', checked: false },
      ],
    })
    expect(payload.condition_checks).toEqual([
      { key: 'screen_ok', checked: true },
      { key: 'keyboard_ok', checked: false },
    ])
  })

  it('passes images array through unchanged', () => {
    const images = ['/uploads/a.jpg', '/uploads/b.jpg']
    const payload = transformListingFormToPayload({ ...validForm, images })
    expect(payload.images).toBe(images) // reference identity, not just equal
  })
})

describe('validateListingForm', () => {
  it('returns null for a valid form', () => {
    expect(validateListingForm(validForm)).toBeNull()
  })

  it('rejects a too-short title', () => {
    const error = validateListingForm({ ...validForm, title: 'ab' })
    expect(error).toContain('mindestens 3 Zeichen')
  })

  it('rejects a too-short description', () => {
    const error = validateListingForm({ ...validForm, description: 'short' })
    expect(error).toContain('mindestens 10 Zeichen')
  })

  it('rejects an invalid category', () => {
    const error = validateListingForm({ ...validForm, category: 'not-a-real-category' })
    expect(error).toBeTruthy()
  })

  it('rejects an invalid condition', () => {
    const error = validateListingForm({ ...validForm, condition: 'mint' })
    expect(error).toBeTruthy()
  })

  it('accepts a price of exactly 0 (free listing)', () => {
    expect(validateListingForm({ ...validForm, price: '0' })).toBeNull()
  })

  it('accepts a missing price (transformed to 0)', () => {
    expect(validateListingForm({ ...validForm, price: '' })).toBeNull()
  })

  it('rejects an http://example.com image URL only if not whitelisted prefix', () => {
    // Schema accepts /uploads/, http://, https:// — so this should pass
    const ok = validateListingForm({
      ...validForm,
      images: ['https://cdn.example.com/img.jpg'],
    })
    expect(ok).toBeNull()
  })

  it('rejects a malformed image path (no /uploads/, no http/s)', () => {
    const error = validateListingForm({
      ...validForm,
      images: ['blob:abc123'],
    })
    expect(error).toContain('Ungültige Bild-URL')
  })
})
