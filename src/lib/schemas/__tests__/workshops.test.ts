/**
 * Tests for workshop Zod schemas (lib/schemas/workshops.ts).
 *
 * Three schemas for the workshop lifecycle:
 *   - WorkshopRegistrationSchema  — slug-based signup
 *   - WorkshopProposalSchema      — community-submitted proposal form
 *   - WorkshopRegisterWithPaymentSchema — paid registration with escrow
 *
 * The proposal schema is the largest, with z.coerce on numeric fields
 * (HTML form values arrive as strings) and a literal-true terms gate.
 */

import {
  WorkshopRegistrationSchema,
  WorkshopProposalSchema,
  WorkshopRegisterWithPaymentSchema,
} from '../workshops'

const UUID = '00000000-0000-4000-8000-000000000000'

const validProposal = {
  title: 'Linux für Einsteiger',
  description: 'Eine praktische Einführung in Linux.',
  shortDescription: 'Praktische Einführung in Linux.',
  category: 'software',
  durationHours: 3,
  level: 'beginner',
  maxParticipants: 12,
  minParticipants: 4,
  pricePerPerson: 25,
  learningObjectives: ['Grundlagen verstehen', 'Erste Befehle ausführen'],
  termsAccepted: true as const,
}

// ============================================================================
// WorkshopRegistrationSchema
// ============================================================================

describe('WorkshopRegistrationSchema', () => {
  it('accepts a valid workshop slug', () => {
    expect(WorkshopRegistrationSchema.safeParse({ workshopSlug: 'linux-basics' }).success).toBe(true)
  })

  it('rejects empty workshopSlug', () => {
    expect(WorkshopRegistrationSchema.safeParse({ workshopSlug: '' }).success).toBe(false)
  })

  it('rejects missing workshopSlug', () => {
    expect(WorkshopRegistrationSchema.safeParse({}).success).toBe(false)
  })
})

// ============================================================================
// WorkshopProposalSchema
// ============================================================================

describe('WorkshopProposalSchema', () => {
  it('accepts a valid proposal', () => {
    expect(WorkshopProposalSchema.safeParse(validProposal).success).toBe(true)
  })

  it('rejects empty title', () => {
    expect(WorkshopProposalSchema.safeParse({ ...validProposal, title: '' }).success).toBe(false)
  })

  it('caps title at 200 chars', () => {
    expect(WorkshopProposalSchema.safeParse({ ...validProposal, title: 'x'.repeat(201) }).success).toBe(false)
  })

  it('caps shortDescription at 500 chars', () => {
    expect(WorkshopProposalSchema.safeParse({ ...validProposal, shortDescription: 'x'.repeat(501) }).success).toBe(false)
  })

  it('rejects empty learningObjectives array', () => {
    expect(WorkshopProposalSchema.safeParse({ ...validProposal, learningObjectives: [] }).success).toBe(false)
  })

  it('rejects when termsAccepted is false', () => {
    expect(WorkshopProposalSchema.safeParse({ ...validProposal, termsAccepted: false }).success).toBe(false)
  })

  it('coerces durationHours from string (HTML form value)', () => {
    const result = WorkshopProposalSchema.safeParse({ ...validProposal, durationHours: '3.5' })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.durationHours).toBe(3.5)
  })

  it('rejects non-positive durationHours', () => {
    expect(WorkshopProposalSchema.safeParse({ ...validProposal, durationHours: 0 }).success).toBe(false)
    expect(WorkshopProposalSchema.safeParse({ ...validProposal, durationHours: -1 }).success).toBe(false)
  })

  it('coerces participant counts from strings and requires integers ≥ 1', () => {
    expect(WorkshopProposalSchema.safeParse({ ...validProposal, maxParticipants: '12' }).success).toBe(true)
    expect(WorkshopProposalSchema.safeParse({ ...validProposal, maxParticipants: 0 }).success).toBe(false)
    expect(WorkshopProposalSchema.safeParse({ ...validProposal, minParticipants: 0 }).success).toBe(false)
  })

  it('accepts pricePerPerson of 0 (free workshop)', () => {
    expect(WorkshopProposalSchema.safeParse({ ...validProposal, pricePerPerson: 0 }).success).toBe(true)
  })

  it('rejects negative pricePerPerson', () => {
    expect(WorkshopProposalSchema.safeParse({ ...validProposal, pricePerPerson: -10 }).success).toBe(false)
  })

  it('accepts optional selectedLocationId as null or a UUID', () => {
    expect(WorkshopProposalSchema.safeParse({ ...validProposal, selectedLocationId: null }).success).toBe(true)
    expect(WorkshopProposalSchema.safeParse({ ...validProposal, selectedLocationId: UUID }).success).toBe(true)
  })

  it('rejects a non-UUID selectedLocationId', () => {
    expect(WorkshopProposalSchema.safeParse({ ...validProposal, selectedLocationId: 'abc' }).success).toBe(false)
  })

  it('accepts most optional text fields as null', () => {
    const result = WorkshopProposalSchema.safeParse({
      ...validProposal,
      prerequisites: null,
      targetAudience: null,
      materialsProvided: null,
      materialsRequired: null,
      locationType: null,
      proposedLocation: null,
      proposedDate: null,
      proposedTime: null,
      specialRequirements: null,
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// WorkshopRegisterWithPaymentSchema
// ============================================================================

describe('WorkshopRegisterWithPaymentSchema', () => {
  it('accepts an empty body and applies defaults', () => {
    const result = WorkshopRegisterWithPaymentSchema.safeParse({})
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.useEscrow).toBe(false)
  })

  it('accepts a UUID instanceId', () => {
    expect(WorkshopRegisterWithPaymentSchema.safeParse({ instanceId: UUID }).success).toBe(true)
  })

  it('accepts useEscrow=true override', () => {
    const result = WorkshopRegisterWithPaymentSchema.safeParse({ useEscrow: true })
    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.useEscrow).toBe(true)
  })

  it('rejects a non-UUID instanceId', () => {
    expect(WorkshopRegisterWithPaymentSchema.safeParse({ instanceId: 'abc' }).success).toBe(false)
  })
})
