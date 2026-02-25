// Mock Next.js server imports that aren't needed for schema-only tests
jest.mock('next/server', () => ({
  NextRequest: class {},
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) =>
      ({ json: () => data, status: init?.status || 200 }),
  },
}))

import {
  validateBody,
  validateQuery,
  formatZodErrorsAsRecord,
  // Payment schemas
  CreatePaymentIntentSchema,
  RefundSchema,
  EscrowReleaseSchema,
  // Appointment schemas
  CreateAppointmentSchema,
  BookWithPaymentSchema,
  GetAppointmentsQuerySchema,
  AppointmentActionSchema,
  // Review schemas
  CreateReviewSchema,
  GetReviewsQuerySchema,
  ReviewResponseSchema,
  ReviewVoteSchema,
  // Workshop schemas
  WorkshopRegistrationSchema,
  WorkshopProposalSchema,
  WorkshopRegisterWithPaymentSchema,
  // Message schemas
  SendMessageSchema,
  // User schemas
  UpdateProfileSchema,
  // Repairer schemas
  RepairerApplicationSchema,
  // Seller schemas
  SellerApplicationSchema,
  // Blog schemas
  BlogSubmissionSchema,
  // AI schemas
  AnalyzeProductSchema,
  // Inventory schemas
  ImportCSVSchema,
} from '@/lib/schemas'
import { ZodError } from 'zod'

// ── Helper tests ──────────────────────────────────────────────

describe('validateBody', () => {
  it('returns success with parsed data for valid input', () => {
    const result = validateBody(RefundSchema, {
      transactionId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 10.5,
      reason: 'customer_request',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.transactionId).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(result.data.amount).toBe(10.5)
    }
  })

  it('returns error response for invalid input', () => {
    const result = validateBody(RefundSchema, { amount: 'not-a-number' })
    expect(result.success).toBe(false)
  })
})

describe('validateQuery', () => {
  it('strips null values and applies defaults', () => {
    const result = validateQuery(GetAppointmentsQuerySchema, {
      role: null,
      status: null,
      limit: null,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(50) // default from schema
    }
  })

  it('parses provided string values', () => {
    const result = validateQuery(GetAppointmentsQuerySchema, {
      role: 'customer',
      limit: '10',
      status: null,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(10)
    }
  })
})

describe('formatZodErrorsAsRecord', () => {
  it('converts ZodError to Record<string, string[]>', () => {
    const result = RefundSchema.safeParse({ amount: 'bad' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const record = formatZodErrorsAsRecord(result.error)
      expect(typeof record).toBe('object')
      // Should have at least transactionId and amount errors
      const keys = Object.keys(record)
      expect(keys.length).toBeGreaterThan(0)
      for (const key of keys) {
        expect(Array.isArray(record[key])).toBe(true)
        expect(record[key].length).toBeGreaterThan(0)
      }
    }
  })
})

// ── Payment schemas ───────────────────────────────────────────

describe('CreatePaymentIntentSchema', () => {
  const validPayload = {
    amount: 50,
    currency: 'CHF',
    description: 'Test payment',
  }

  it('accepts valid payment intent', () => {
    const result = CreatePaymentIntentSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
  })

  it('rejects negative amount', () => {
    const result = CreatePaymentIntentSchema.safeParse({ ...validPayload, amount: -5 })
    expect(result.success).toBe(false)
  })

  it('rejects invalid currency', () => {
    const result = CreatePaymentIntentSchema.safeParse({ ...validPayload, currency: 'USD' })
    expect(result.success).toBe(false)
  })

  it('defaults escrowEnabled to false', () => {
    const result = CreatePaymentIntentSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.escrowEnabled).toBe(false)
    }
  })
})

describe('RefundSchema', () => {
  it('accepts valid refund request', () => {
    const result = RefundSchema.safeParse({
      transactionId: '550e8400-e29b-41d4-a716-446655440000',
      amount: 25.50,
      reason: 'customer_request',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing transactionId', () => {
    const result = RefundSchema.safeParse({ amount: 25 })
    expect(result.success).toBe(false)
  })

  it('rejects non-UUID transactionId', () => {
    const result = RefundSchema.safeParse({
      transactionId: 'not-a-uuid',
      amount: 25,
      reason: 'customer_request',
    })
    expect(result.success).toBe(false)
  })
})

describe('EscrowReleaseSchema', () => {
  it('accepts valid escrow release', () => {
    const result = EscrowReleaseSchema.safeParse({
      amount: 100,
      releaseType: 'full',
      reason: 'Service completed',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid releaseType', () => {
    const result = EscrowReleaseSchema.safeParse({
      amount: 100,
      releaseType: 'invalid',
    })
    expect(result.success).toBe(false)
  })
})

// ── Appointment schemas ───────────────────────────────────────

describe('CreateAppointmentSchema', () => {
  it('accepts valid appointment', () => {
    const result = CreateAppointmentSchema.safeParse({
      description: 'Laptop screen replacement',
      urgency: 'normal',
    })
    expect(result.success).toBe(true)
  })

  it('requires visit_address when is_home_visit is true', () => {
    const result = CreateAppointmentSchema.safeParse({
      description: 'Home repair',
      is_home_visit: true,
    })
    expect(result.success).toBe(false)
  })

  it('accepts home visit with address and city', () => {
    const result = CreateAppointmentSchema.safeParse({
      description: 'Home repair',
      is_home_visit: true,
      visit_address: 'Bahnhofstrasse 1',
      visit_city: 'Zürich',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty description', () => {
    const result = CreateAppointmentSchema.safeParse({
      description: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('BookWithPaymentSchema', () => {
  it('accepts valid booking', () => {
    const result = BookWithPaymentSchema.safeParse({
      serviceSlug: 'laptop-repair',
      urgency: 'normal',
    })
    expect(result.success).toBe(true)
  })

  it('defaults useEscrow to true', () => {
    const result = BookWithPaymentSchema.safeParse({
      serviceSlug: 'laptop-repair',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.useEscrow).toBe(true)
    }
  })

  it('rejects empty serviceSlug', () => {
    const result = BookWithPaymentSchema.safeParse({
      serviceSlug: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('AppointmentActionSchema', () => {
  it('accepts accept action', () => {
    const result = AppointmentActionSchema.safeParse({ action: 'accept' })
    expect(result.success).toBe(true)
  })

  it('accepts quote action with price', () => {
    const result = AppointmentActionSchema.safeParse({
      action: 'quote',
      quoted_price_chf: 150,
    })
    expect(result.success).toBe(true)
  })

  it('rejects quote without price', () => {
    const result = AppointmentActionSchema.safeParse({
      action: 'quote',
    })
    expect(result.success).toBe(false)
  })

  it('rejects unknown action', () => {
    const result = AppointmentActionSchema.safeParse({
      action: 'unknown_action',
    })
    expect(result.success).toBe(false)
  })
})

// ── Review schemas ────────────────────────────────────────────

describe('CreateReviewSchema', () => {
  const validReview = {
    targetType: 'repairer',
    targetId: '550e8400-e29b-41d4-a716-446655440000',
    overallRating: 5,
    content: 'Excellent service and quick turnaround!',
  }

  it('accepts valid review', () => {
    const result = CreateReviewSchema.safeParse(validReview)
    expect(result.success).toBe(true)
  })

  it('rejects rating above 5', () => {
    const result = CreateReviewSchema.safeParse({ ...validReview, overallRating: 6 })
    expect(result.success).toBe(false)
  })

  it('rejects rating below 1', () => {
    const result = CreateReviewSchema.safeParse({ ...validReview, overallRating: 0 })
    expect(result.success).toBe(false)
  })

  it('rejects content shorter than 10 characters', () => {
    const result = CreateReviewSchema.safeParse({ ...validReview, content: 'Short' })
    expect(result.success).toBe(false)
  })
})

describe('ReviewVoteSchema', () => {
  it('accepts helpful vote', () => {
    const result = ReviewVoteSchema.safeParse({ voteType: 'helpful' })
    expect(result.success).toBe(true)
  })

  it('accepts unhelpful vote', () => {
    const result = ReviewVoteSchema.safeParse({ voteType: 'unhelpful' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid vote type', () => {
    const result = ReviewVoteSchema.safeParse({ voteType: 'neutral' })
    expect(result.success).toBe(false)
  })
})

// ── Workshop schemas ──────────────────────────────────────────

describe('WorkshopRegistrationSchema', () => {
  it('accepts valid registration', () => {
    const result = WorkshopRegistrationSchema.safeParse({
      workshopSlug: 'intro-linux',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty workshopSlug', () => {
    const result = WorkshopRegistrationSchema.safeParse({
      workshopSlug: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('WorkshopRegisterWithPaymentSchema', () => {
  it('accepts valid registration with payment', () => {
    const result = WorkshopRegisterWithPaymentSchema.safeParse({
      instanceId: '550e8400-e29b-41d4-a716-446655440000',
      useEscrow: false,
    })
    expect(result.success).toBe(true)
  })

  it('defaults useEscrow to false', () => {
    const result = WorkshopRegisterWithPaymentSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.useEscrow).toBe(false)
    }
  })
})

// ── Message schemas ───────────────────────────────────────────

describe('SendMessageSchema', () => {
  it('accepts valid message', () => {
    const result = SendMessageSchema.safeParse({
      recipient_id: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Hello, I have a question about my repair.',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty content', () => {
    const result = SendMessageSchema.safeParse({
      recipient_id: '550e8400-e29b-41d4-a716-446655440000',
      content: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects content exceeding 5000 characters', () => {
    const result = SendMessageSchema.safeParse({
      recipient_id: '550e8400-e29b-41d4-a716-446655440000',
      content: 'x'.repeat(5001),
    })
    expect(result.success).toBe(false)
  })
})

// ── User schemas ──────────────────────────────────────────────

describe('UpdateProfileSchema', () => {
  it('accepts valid profile update', () => {
    const result = UpdateProfileSchema.safeParse({
      name: 'Max Muster',
      phone: '+41791234567',
      city: 'Zürich',
      postalCode: '8001',
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty update (all fields optional)', () => {
    const result = UpdateProfileSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('rejects invalid postal code', () => {
    const result = UpdateProfileSchema.safeParse({
      postal_code: '123', // Swiss postal codes are 4 digits
    })
    expect(result.success).toBe(false)
  })
})

// ── Repairer schemas ──────────────────────────────────────────

describe('RepairerApplicationSchema', () => {
  const validApplication = {
    businessType: 'individual',
    description: 'Experienced laptop repairer',
    yearsExperience: 5,
    phone: '+41791234567',
    address: 'Techstrasse 42',
    city: 'Bern',
    postalCode: '3001',
    serviceRadius: 20,
    servicesOffered: ['laptop-repair', 'phone-repair'],
    termsAccepted: true,
  }

  it('accepts valid application', () => {
    const result = RepairerApplicationSchema.safeParse(validApplication)
    expect(result.success).toBe(true)
  })

  it('rejects without termsAccepted', () => {
    const result = RepairerApplicationSchema.safeParse({
      ...validApplication,
      termsAccepted: false,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty servicesOffered', () => {
    const result = RepairerApplicationSchema.safeParse({
      ...validApplication,
      servicesOffered: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid postal code format', () => {
    const result = RepairerApplicationSchema.safeParse({
      ...validApplication,
      postalCode: '12345', // Swiss PLZ is 4 digits
    })
    expect(result.success).toBe(false)
  })
})

// ── Seller schemas ────────────────────────────────────────────

describe('SellerApplicationSchema', () => {
  const validApplication = {
    address: 'Marktplatz 1',
    city: 'Basel',
    postalCode: '4001',
    phone: '+41612345678',
    productTypes: ['electronics', 'accessories'],
    termsAccepted: true as const,
  }

  it('accepts valid seller application', () => {
    const result = SellerApplicationSchema.safeParse(validApplication)
    expect(result.success).toBe(true)
  })

  it('rejects without termsAccepted', () => {
    const result = SellerApplicationSchema.safeParse({
      ...validApplication,
      termsAccepted: false,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty productTypes', () => {
    const result = SellerApplicationSchema.safeParse({
      ...validApplication,
      productTypes: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing address', () => {
    const { address, ...noAddress } = validApplication
    const result = SellerApplicationSchema.safeParse(noAddress)
    expect(result.success).toBe(false)
  })
})

// ── Blog schemas ──────────────────────────────────────────────

describe('BlogSubmissionSchema', () => {
  const validSubmission = {
    name: 'Anna Beispiel',
    email: 'anna@example.com',
    title: 'Open Source Hardware im Alltag',
    content: 'Ein ausführlicher Artikel über die Vorteile von Open Source Hardware...',
  }

  it('accepts valid blog submission', () => {
    const result = BlogSubmissionSchema.safeParse(validSubmission)
    expect(result.success).toBe(true)
  })

  it('defaults submissionType to draft', () => {
    const result = BlogSubmissionSchema.safeParse(validSubmission)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.submissionType).toBe('draft')
    }
  })

  it('defaults tags to empty array', () => {
    const result = BlogSubmissionSchema.safeParse(validSubmission)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags).toEqual([])
    }
  })

  it('rejects invalid email', () => {
    const result = BlogSubmissionSchema.safeParse({
      ...validSubmission,
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing title', () => {
    const { title, ...noTitle } = validSubmission
    const result = BlogSubmissionSchema.safeParse(noTitle)
    expect(result.success).toBe(false)
  })
})

// ── AI schemas ────────────────────────────────────────────────

describe('AnalyzeProductSchema', () => {
  it('accepts image data', () => {
    const result = AnalyzeProductSchema.safeParse({
      image: 'base64encodeddata...',
    })
    expect(result.success).toBe(true)
  })

  it('accepts imageUrl', () => {
    const result = AnalyzeProductSchema.safeParse({
      imageUrl: 'https://example.com/image.jpg',
    })
    expect(result.success).toBe(true)
  })

  it('rejects when neither image nor imageUrl provided', () => {
    const result = AnalyzeProductSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('defaults saveToDatabase to false', () => {
    const result = AnalyzeProductSchema.safeParse({
      image: 'data...',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.saveToDatabase).toBe(false)
    }
  })
})

// ── Inventory schemas ─────────────────────────────────────────

describe('ImportCSVSchema', () => {
  it('accepts valid CSV import', () => {
    const result = ImportCSVSchema.safeParse({
      csvContent: 'Artikelnummer,Typ,Artikelbeschreibung\n001,Laptop,ThinkPad T480',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty csvContent', () => {
    const result = ImportCSVSchema.safeParse({
      csvContent: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing csvContent', () => {
    const result = ImportCSVSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

