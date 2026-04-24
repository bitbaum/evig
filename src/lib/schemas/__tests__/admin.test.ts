/**
 * Tests for admin Zod schemas (lib/schemas/admin.ts)
 *
 * Admin schemas gate privileged operations: user management, approvals,
 * workshop comms, service creation, AI erfassung bulk ops, and HIRN chat.
 * Validation correctness prevents malformed data from reaching admin APIs.
 *
 * Covers: AdminUpdateUserSchema, AdminApprovalActionSchema,
 *         AdminWorkshopRegistrationUpdateSchema, AdminSendFeedbackRequestsSchema,
 *         AdminSendRemindersSchema, AdminCreateServiceSchema, BulkSaveSchema,
 *         BulkEnrichSchema, BulkTextSchema, ErfassungCreateSchema,
 *         AdminCreateProductSchema, HirnChatSchema, HirnProviderUpdateSchema,
 *         CertificationVerifySchema, CertificationRejectSchema,
 *         AdminPermissionsSchema, SmartProductEntrySchema.
 */

import {
  AdminUpdateUserSchema,
  AdminApprovalActionSchema,
  AdminWorkshopRegistrationUpdateSchema,
  AdminSendFeedbackRequestsSchema,
  AdminSendRemindersSchema,
  AdminCreateServiceSchema,
  BulkSaveSchema,
  BulkEnrichSchema,
  BulkTextSchema,
  ErfassungCreateSchema,
  AdminCreateProductSchema,
  HirnChatSchema,
  HirnProviderUpdateSchema,
  CertificationVerifySchema,
  CertificationRejectSchema,
  AdminPermissionsSchema,
  SmartProductEntrySchema,
} from '../admin'

// ============================================================================
// AdminUpdateUserSchema
// ============================================================================

describe('AdminUpdateUserSchema', () => {
  it('accepts empty update (all optional)', () => {
    const result = AdminUpdateUserSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts valid email', () => {
    const result = AdminUpdateUserSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = AdminUpdateUserSchema.safeParse({ email: 'not-valid' })
    expect(result.success).toBe(false)
  })

  it('rejects name longer than 100 characters', () => {
    const result = AdminUpdateUserSchema.safeParse({ name: 'x'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('accepts is_staff boolean', () => {
    const result = AdminUpdateUserSchema.safeParse({ is_staff: true })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// AdminApprovalActionSchema
// ============================================================================

describe('AdminApprovalActionSchema', () => {
  it('accepts approve', () => {
    const result = AdminApprovalActionSchema.safeParse({ action: 'approve' })
    expect(result.success).toBe(true)
  })

  it('accepts reject', () => {
    const result = AdminApprovalActionSchema.safeParse({ action: 'reject' })
    expect(result.success).toBe(true)
  })

  it('accepts reopen', () => {
    const result = AdminApprovalActionSchema.safeParse({ action: 'reopen' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid action', () => {
    const result = AdminApprovalActionSchema.safeParse({ action: 'delete' })
    expect(result.success).toBe(false)
  })

  it('rejects missing action', () => {
    const result = AdminApprovalActionSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// AdminWorkshopRegistrationUpdateSchema
// ============================================================================

describe('AdminWorkshopRegistrationUpdateSchema', () => {
  it('accepts empty update', () => {
    const result = AdminWorkshopRegistrationUpdateSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts all valid statuses', () => {
    for (const status of ['pending', 'confirmed', 'waitlist', 'attended', 'cancelled', 'no_show']) {
      const result = AdminWorkshopRegistrationUpdateSchema.safeParse({ status })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid status', () => {
    const result = AdminWorkshopRegistrationUpdateSchema.safeParse({ status: 'archived' })
    expect(result.success).toBe(false)
  })

  it('rejects notes longer than 2000 characters', () => {
    const result = AdminWorkshopRegistrationUpdateSchema.safeParse({ notes: 'x'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('accepts attended boolean', () => {
    const result = AdminWorkshopRegistrationUpdateSchema.safeParse({ attended: true })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// AdminSendFeedbackRequestsSchema
// ============================================================================

describe('AdminSendFeedbackRequestsSchema', () => {
  it('defaults daysAfterWorkshop to 1', () => {
    const result = AdminSendFeedbackRequestsSchema.safeParse({})
    if (result.success) expect(result.data.daysAfterWorkshop).toBe(1)
  })

  it('accepts daysAfterWorkshop of 1 and 30', () => {
    for (const daysAfterWorkshop of [1, 30]) {
      const result = AdminSendFeedbackRequestsSchema.safeParse({ daysAfterWorkshop })
      expect(result.success).toBe(true)
    }
  })

  it('rejects daysAfterWorkshop below 1', () => {
    const result = AdminSendFeedbackRequestsSchema.safeParse({ daysAfterWorkshop: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects daysAfterWorkshop above 30', () => {
    const result = AdminSendFeedbackRequestsSchema.safeParse({ daysAfterWorkshop: 31 })
    expect(result.success).toBe(false)
  })

  it('coerces string to number', () => {
    const result = AdminSendFeedbackRequestsSchema.safeParse({ daysAfterWorkshop: '7' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.daysAfterWorkshop).toBe(7)
  })
})

// ============================================================================
// AdminSendRemindersSchema
// ============================================================================

describe('AdminSendRemindersSchema', () => {
  it('defaults daysBeforeWorkshop to 1', () => {
    const result = AdminSendRemindersSchema.safeParse({})
    if (result.success) expect(result.data.daysBeforeWorkshop).toBe(1)
  })

  it('rejects daysBeforeWorkshop below 1', () => {
    const result = AdminSendRemindersSchema.safeParse({ daysBeforeWorkshop: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects daysBeforeWorkshop above 30', () => {
    const result = AdminSendRemindersSchema.safeParse({ daysBeforeWorkshop: 31 })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// AdminCreateServiceSchema
// ============================================================================

describe('AdminCreateServiceSchema', () => {
  const valid = {
    name: 'Laptop-Reparatur',
    slug: 'laptop-reparatur',
  }

  it('accepts minimal valid service', () => {
    const result = AdminCreateServiceSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = AdminCreateServiceSchema.safeParse({ ...valid, name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty slug', () => {
    const result = AdminCreateServiceSchema.safeParse({ ...valid, slug: '' })
    expect(result.success).toBe(false)
  })

  it('rejects slug with uppercase letters', () => {
    const result = AdminCreateServiceSchema.safeParse({ ...valid, slug: 'Laptop-Reparatur' })
    expect(result.success).toBe(false)
  })

  it('rejects slug with spaces', () => {
    const result = AdminCreateServiceSchema.safeParse({ ...valid, slug: 'laptop reparatur' })
    expect(result.success).toBe(false)
  })

  it('accepts valid slug pattern', () => {
    const result = AdminCreateServiceSchema.safeParse({ ...valid, slug: 'laptop-reparatur-123' })
    expect(result.success).toBe(true)
  })

  it('rejects priceCents below 0', () => {
    const result = AdminCreateServiceSchema.safeParse({ ...valid, priceCents: -1 })
    expect(result.success).toBe(false)
  })

  it('defaults durationMinutes to 60', () => {
    const result = AdminCreateServiceSchema.safeParse(valid)
    if (result.success) expect(result.data.durationMinutes).toBe(60)
  })

  it('defaults requiresApproval to false', () => {
    const result = AdminCreateServiceSchema.safeParse(valid)
    if (result.success) expect(result.data.requiresApproval).toBe(false)
  })

  it('defaults isBookable to true', () => {
    const result = AdminCreateServiceSchema.safeParse(valid)
    if (result.success) expect(result.data.isBookable).toBe(true)
  })

  it('rejects name longer than 200 characters', () => {
    const result = AdminCreateServiceSchema.safeParse({ ...valid, name: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// BulkSaveSchema
// ============================================================================

describe('BulkSaveSchema', () => {
  const validProduct = { hersteller: 'HP', produktname: 'EliteBook' }

  it('accepts valid bulk save', () => {
    const result = BulkSaveSchema.safeParse({
      products: [validProduct],
      action: 'erfassen',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty products array', () => {
    const result = BulkSaveSchema.safeParse({ products: [], action: 'draft' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid action values', () => {
    for (const action of ['draft', 'erfassen', 'publish']) {
      const result = BulkSaveSchema.safeParse({ products: [validProduct], action })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid action', () => {
    const result = BulkSaveSchema.safeParse({ products: [validProduct], action: 'delete' })
    expect(result.success).toBe(false)
  })

  it('rejects missing action', () => {
    const result = BulkSaveSchema.safeParse({ products: [validProduct] })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// BulkEnrichSchema
// ============================================================================

describe('BulkEnrichSchema', () => {
  const validItem = {
    _tempId: 'temp-1',
    hersteller: 'Lenovo',
    produktname: 'ThinkPad X1',
  }

  it('accepts valid enrich request', () => {
    const result = BulkEnrichSchema.safeParse({ items: [validItem] })
    expect(result.success).toBe(true)
  })

  it('rejects empty items array', () => {
    const result = BulkEnrichSchema.safeParse({ items: [] })
    expect(result.success).toBe(false)
  })

  it('accepts items with optional fields', () => {
    const result = BulkEnrichSchema.safeParse({
      items: [{ ...validItem, zustand: 'gut', verkaufspreis: '350' }],
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// BulkTextSchema
// ============================================================================

describe('BulkTextSchema', () => {
  it('accepts text with 10+ characters', () => {
    const result = BulkTextSchema.safeParse({ text: 'ThinkPad X1 Carbon, 16GB RAM, gut' })
    expect(result.success).toBe(true)
  })

  it('rejects text shorter than 10 characters', () => {
    const result = BulkTextSchema.safeParse({ text: 'Short' })
    expect(result.success).toBe(false)
  })

  it('accepts text of exactly 10 characters', () => {
    const result = BulkTextSchema.safeParse({ text: '1234567890' })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// ErfassungCreateSchema
// ============================================================================

describe('ErfassungCreateSchema', () => {
  const valid = {
    hersteller: 'Dell',
    produktname: 'Latitude 7490',
    verkaufspreis: 400,
  }

  it('accepts minimal valid erfassung', () => {
    const result = ErfassungCreateSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects empty hersteller', () => {
    const result = ErfassungCreateSchema.safeParse({ ...valid, hersteller: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty produktname', () => {
    const result = ErfassungCreateSchema.safeParse({ ...valid, produktname: '' })
    expect(result.success).toBe(false)
  })

  it('rejects negative verkaufspreis', () => {
    const result = ErfassungCreateSchema.safeParse({ ...valid, verkaufspreis: -1 })
    expect(result.success).toBe(false)
  })

  it('accepts verkaufspreis of 0', () => {
    const result = ErfassungCreateSchema.safeParse({ ...valid, verkaufspreis: 0 })
    expect(result.success).toBe(true)
  })

  it('coerces string verkaufspreis to number', () => {
    const result = ErfassungCreateSchema.safeParse({ ...valid, verkaufspreis: '350' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.verkaufspreis).toBe(350)
  })

  it('accepts all valid action values', () => {
    for (const action of ['draft', 'erfassen', 'publish']) {
      const result = ErfassungCreateSchema.safeParse({ ...valid, action })
      expect(result.success).toBe(true)
    }
  })

  it('passes through additional fields (passthrough)', () => {
    const result = ErfassungCreateSchema.safeParse({ ...valid, extra_field: 'test' })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// AdminCreateProductSchema (cross-field refinement)
// ============================================================================

describe('AdminCreateProductSchema', () => {
  it('accepts when title is provided', () => {
    const result = AdminCreateProductSchema.safeParse({ title: 'ThinkPad X1 Carbon' })
    expect(result.success).toBe(true)
  })

  it('accepts when product_name is provided', () => {
    const result = AdminCreateProductSchema.safeParse({ product_name: 'EliteBook 840' })
    expect(result.success).toBe(true)
  })

  it('rejects when neither title nor product_name is provided', () => {
    const result = AdminCreateProductSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('accepts price of 0', () => {
    const result = AdminCreateProductSchema.safeParse({ title: 'Free Item', price: 0 })
    expect(result.success).toBe(true)
  })

  it('rejects negative price', () => {
    const result = AdminCreateProductSchema.safeParse({ title: 'Test', price: -1 })
    expect(result.success).toBe(false)
  })

  it('defaults quantity to 1', () => {
    const result = AdminCreateProductSchema.safeParse({ title: 'Test' })
    if (result.success) expect(result.data.quantity).toBe(1)
  })

  it('rejects quantity below 1', () => {
    const result = AdminCreateProductSchema.safeParse({ title: 'Test', quantity: 0 })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// HirnChatSchema
// ============================================================================

describe('HirnChatSchema', () => {
  const valid = {
    message: 'Was sind die wichtigsten Aufgaben heute?',
    sessionId: 'sess-abc123',
  }

  it('accepts valid chat message', () => {
    const result = HirnChatSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects empty message', () => {
    const result = HirnChatSchema.safeParse({ ...valid, message: '' })
    expect(result.success).toBe(false)
  })

  it('rejects empty sessionId', () => {
    const result = HirnChatSchema.safeParse({ ...valid, sessionId: '' })
    expect(result.success).toBe(false)
  })

  it('accepts optional temperature in [0, 2]', () => {
    for (const temperature of [0, 1, 2]) {
      const result = HirnChatSchema.safeParse({ ...valid, temperature })
      expect(result.success).toBe(true)
    }
  })

  it('rejects temperature above 2', () => {
    const result = HirnChatSchema.safeParse({ ...valid, temperature: 2.1 })
    expect(result.success).toBe(false)
  })

  it('rejects temperature below 0', () => {
    const result = HirnChatSchema.safeParse({ ...valid, temperature: -0.1 })
    expect(result.success).toBe(false)
  })

  it('accepts optional maxTokens (positive integer, max 8192)', () => {
    const result = HirnChatSchema.safeParse({ ...valid, maxTokens: 4096 })
    expect(result.success).toBe(true)
  })

  it('rejects maxTokens above 8192', () => {
    const result = HirnChatSchema.safeParse({ ...valid, maxTokens: 8193 })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// HirnProviderUpdateSchema
// ============================================================================

describe('HirnProviderUpdateSchema', () => {
  it('accepts valid provider update', () => {
    const result = HirnProviderUpdateSchema.safeParse({ provider: 'anthropic' })
    expect(result.success).toBe(true)
  })

  it('rejects empty provider', () => {
    const result = HirnProviderUpdateSchema.safeParse({ provider: '' })
    expect(result.success).toBe(false)
  })

  it('accepts optional isDefault', () => {
    const result = HirnProviderUpdateSchema.safeParse({ provider: 'openai', isDefault: true })
    expect(result.success).toBe(true)
  })

  it('accepts optional isEnabled', () => {
    const result = HirnProviderUpdateSchema.safeParse({ provider: 'openai', isEnabled: false })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// CertificationVerifySchema
// ============================================================================

describe('CertificationVerifySchema', () => {
  it('accepts empty object (all optional)', () => {
    const result = CertificationVerifySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts adminNotes', () => {
    const result = CertificationVerifySchema.safeParse({
      adminNotes: 'Zertifikat geprüft und gültig.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects adminNotes longer than 5000 characters', () => {
    const result = CertificationVerifySchema.safeParse({ adminNotes: 'x'.repeat(5001) })
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// CertificationRejectSchema
// ============================================================================

describe('CertificationRejectSchema', () => {
  it('accepts valid rejection reason', () => {
    const result = CertificationRejectSchema.safeParse({
      rejectionReason: 'Dokument abgelaufen.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty rejectionReason', () => {
    const result = CertificationRejectSchema.safeParse({ rejectionReason: '' })
    expect(result.success).toBe(false)
  })

  it('rejects rejectionReason longer than 2000 characters', () => {
    const result = CertificationRejectSchema.safeParse({ rejectionReason: 'x'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('rejects missing rejectionReason', () => {
    const result = CertificationRejectSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

// ============================================================================
// AdminPermissionsSchema
// ============================================================================

describe('AdminPermissionsSchema', () => {
  it('accepts empty object (all optional)', () => {
    const result = AdminPermissionsSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts permissions array', () => {
    const result = AdminPermissionsSchema.safeParse({
      permissions: ['dashboard', 'products'],
    })
    expect(result.success).toBe(true)
  })

  it('accepts isSuperAdmin boolean', () => {
    const result = AdminPermissionsSchema.safeParse({ isSuperAdmin: true })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// SmartProductEntrySchema
// ============================================================================

describe('SmartProductEntrySchema', () => {
  const valid = { query: 'ThinkPad X1 Carbon' }

  it('accepts valid product query', () => {
    const result = SmartProductEntrySchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('defaults inputType to "text"', () => {
    const result = SmartProductEntrySchema.safeParse(valid)
    if (result.success) expect(result.data.inputType).toBe('text')
  })

  it('rejects empty query', () => {
    const result = SmartProductEntrySchema.safeParse({ query: '' })
    expect(result.success).toBe(false)
  })

  it('rejects query longer than 500 characters', () => {
    const result = SmartProductEntrySchema.safeParse({ query: 'x'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('accepts all valid inputType values', () => {
    for (const inputType of ['text', 'voice', 'image']) {
      const result = SmartProductEntrySchema.safeParse({ ...valid, inputType })
      expect(result.success).toBe(true)
    }
  })

  it('rejects invalid inputType', () => {
    const result = SmartProductEntrySchema.safeParse({ ...valid, inputType: 'video' })
    expect(result.success).toBe(false)
  })
})
