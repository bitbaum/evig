/**
 * Tests for seller-application Zod schema (lib/schemas/seller.ts).
 *
 * Sellers must accept terms (literal true), supply Swiss-format
 * postal code + phone, and pick at least one product type.
 */

import { SellerApplicationSchema } from '../seller'

const valid = {
  address: 'Hardstrasse 245',
  city: 'Zürich',
  postalCode: '8005',
  phone: '+41441234567',
  productTypes: ['laptops'],
  termsAccepted: true as const,
}

describe('SellerApplicationSchema', () => {
  it('accepts a minimal valid application', () => {
    expect(SellerApplicationSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects empty address', () => {
    expect(SellerApplicationSchema.safeParse({ ...valid, address: '' }).success).toBe(false)
  })

  it('rejects empty city', () => {
    expect(SellerApplicationSchema.safeParse({ ...valid, city: '' }).success).toBe(false)
  })

  it('requires Swiss postal code format (4 digits)', () => {
    expect(SellerApplicationSchema.safeParse({ ...valid, postalCode: '800' }).success).toBe(false)
    expect(SellerApplicationSchema.safeParse({ ...valid, postalCode: '80050' }).success).toBe(false)
    expect(SellerApplicationSchema.safeParse({ ...valid, postalCode: 'abcd' }).success).toBe(false)
  })

  it('requires phone of at least 10 chars', () => {
    expect(SellerApplicationSchema.safeParse({ ...valid, phone: '044123' }).success).toBe(false)
  })

  it('rejects empty productTypes array', () => {
    expect(SellerApplicationSchema.safeParse({ ...valid, productTypes: [] }).success).toBe(false)
  })

  it('rejects when termsAccepted is false', () => {
    expect(SellerApplicationSchema.safeParse({ ...valid, termsAccepted: false }).success).toBe(false)
  })

  it('rejects when termsAccepted is missing entirely', () => {
    const without = { ...valid } as Record<string, unknown>
    delete without.termsAccepted
    expect(SellerApplicationSchema.safeParse(without).success).toBe(false)
  })

  it('accepts optional businessName, businessType, taxId, experience, motivation as null', () => {
    const result = SellerApplicationSchema.safeParse({
      ...valid,
      businessName: null,
      businessType: null,
      taxId: null,
      experience: null,
      motivation: null,
    })
    expect(result.success).toBe(true)
  })

  it('accepts multiple product types', () => {
    const result = SellerApplicationSchema.safeParse({
      ...valid,
      productTypes: ['laptops', 'phones', 'accessories'],
    })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.productTypes).toEqual(['laptops', 'phones', 'accessories'])
  })
})
