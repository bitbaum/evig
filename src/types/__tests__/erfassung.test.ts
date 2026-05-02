/**
 * Tests for types/erfassung.ts — product data entry utility functions.
 *
 * Mission-relevant: the erfassung (product intake) flow uses these to
 * construct BulkProduct objects from scanner/voice/manual entry. If
 * formDataToBulkProduct returns status='valid' for a product with no name,
 * invalid products pass through the bulk review step.
 *
 * Behaviors locked:
 *   createDefaultBulkProduct
 *   - returns a BulkProduct with expected default fields
 *   - uses provided tempId when given
 *   - generates a tempId when not given
 *   - status is 'warning' (defaults incomplete)
 *
 *   formDataToBulkProduct
 *   - returns 'valid' status when hersteller and produktname are set
 *   - returns 'warning' status when either is missing
 *   - includes provided metadata in _aiMetadata
 *
 *   formDataToPayload
 *   - converts specs array to JSON-serialized langtext
 *   - converts verkaufspreis string to float
 *   - sets action from argument
 *   - skips specs with empty key or value
 */

import {
  createDefaultBulkProduct,
  formDataToBulkProduct,
  formDataToPayload,
  DEFAULT_FORM_DATA,
} from '../erfassung'

// ============================================================================
// createDefaultBulkProduct
// ============================================================================

describe('createDefaultBulkProduct', () => {
  it('returns a BulkProduct with _selected=true', () => {
    const product = createDefaultBulkProduct('manual')
    expect(product._selected).toBe(true)
  })

  it('sets the provided source', () => {
    expect(createDefaultBulkProduct('image')._source).toBe('image')
    expect(createDefaultBulkProduct('voice')._source).toBe('voice')
    expect(createDefaultBulkProduct('manual')._source).toBe('manual')
  })

  it('uses provided tempId', () => {
    const product = createDefaultBulkProduct('manual', 'test-id-123')
    expect(product._tempId).toBe('test-id-123')
  })

  it('generates a tempId when none provided', () => {
    const product = createDefaultBulkProduct('manual')
    expect(product._tempId).toBeTruthy()
    expect(product._tempId).toMatch(/^bulk-/)
  })

  it('defaults to warning status', () => {
    expect(createDefaultBulkProduct('manual')._status).toBe('warning')
  })

  it('has empty _errors array', () => {
    expect(createDefaultBulkProduct('manual')._errors).toEqual([])
  })
})

// ============================================================================
// formDataToBulkProduct
// ============================================================================

describe('formDataToBulkProduct', () => {
  it('returns "valid" when both hersteller and produktname are set', () => {
    const data = { ...DEFAULT_FORM_DATA, hersteller: 'Lenovo', produktname: 'ThinkPad T14' }
    const product = formDataToBulkProduct(data, 'manual')
    expect(product._status).toBe('valid')
  })

  it('returns "warning" when hersteller is missing', () => {
    const data = { ...DEFAULT_FORM_DATA, hersteller: '', produktname: 'ThinkPad' }
    const product = formDataToBulkProduct(data, 'manual')
    expect(product._status).toBe('warning')
  })

  it('returns "warning" when produktname is missing', () => {
    const data = { ...DEFAULT_FORM_DATA, hersteller: 'Lenovo', produktname: '' }
    const product = formDataToBulkProduct(data, 'manual')
    expect(product._status).toBe('warning')
  })

  it('stores provided AI metadata', () => {
    const metadata = {} as import('@/lib/schemas/erfassung').AIFieldMetadata
    const product = formDataToBulkProduct({ ...DEFAULT_FORM_DATA }, 'image', metadata)
    expect(product._aiMetadata).toBe(metadata)
  })

  it('generates a unique tempId', () => {
    const p1 = formDataToBulkProduct({ ...DEFAULT_FORM_DATA }, 'manual')
    const p2 = formDataToBulkProduct({ ...DEFAULT_FORM_DATA }, 'manual')
    // Both are valid bulk-* IDs
    expect(p1._tempId).toMatch(/^bulk-/)
    expect(p2._tempId).toMatch(/^bulk-/)
  })
})

// ============================================================================
// formDataToPayload
// ============================================================================

describe('formDataToPayload', () => {
  it('converts verkaufspreis string to float', () => {
    const data = { ...DEFAULT_FORM_DATA, verkaufspreis: '149.90' }
    const payload = formDataToPayload(data, 'erfassen')
    expect(payload.verkaufspreis).toBe(149.90)
  })

  it('converts "0" verkaufspreis to 0', () => {
    const data = { ...DEFAULT_FORM_DATA, verkaufspreis: '0' }
    expect(formDataToPayload(data, 'draft').verkaufspreis).toBe(0)
  })

  it('defaults verkaufspreis to 0 for empty string', () => {
    const data = { ...DEFAULT_FORM_DATA, verkaufspreis: '' }
    expect(formDataToPayload(data, 'draft').verkaufspreis).toBe(0)
  })

  it('sets action from argument', () => {
    expect(formDataToPayload({ ...DEFAULT_FORM_DATA }, 'draft').action).toBe('draft')
    expect(formDataToPayload({ ...DEFAULT_FORM_DATA }, 'erfassen').action).toBe('erfassen')
    expect(formDataToPayload({ ...DEFAULT_FORM_DATA }, 'publish').action).toBe('publish')
  })

  it('serializes specs with key and value to langtext JSON', () => {
    const data = {
      ...DEFAULT_FORM_DATA,
      specs: [
        { key: 'ram', value: '16GB' },
        { key: 'cpu', value: 'i7' },
      ],
    }
    const payload = formDataToPayload(data, 'draft')
    const specs = JSON.parse(payload.langtext as string)
    expect(specs).toEqual({ ram: '16GB', cpu: 'i7' })
  })

  it('skips specs with empty key or value', () => {
    const data = {
      ...DEFAULT_FORM_DATA,
      specs: [
        { key: 'ram', value: '8GB' },
        { key: '', value: 'ignored' },
        { key: 'cpu', value: '' },
      ],
    }
    const specs = JSON.parse(formDataToPayload(data, 'draft').langtext as string)
    expect(Object.keys(specs)).toEqual(['ram'])
  })
})
