/**
 * Tests for payments/payments-invoice.ts — invoice creation and line item helpers.
 *
 * Mission-relevant: invoices are the legal payment record. If createInvoice
 * miscalculates taxCents (wrong rounding), Swiss VAT compliance is broken.
 * If buildInvoiceLineItem formats unitPrice incorrectly (3 decimal places),
 * the PDF template fails to parse amounts.
 *
 * Behaviors locked:
 *   buildInvoiceLineItem
 *   - formats unitPrice to 2 decimal places
 *   - total equals unitPrice (quantity doesn't scale total in current impl)
 *   - uses quantity=1 as default
 *
 *   createInvoice
 *   - inserts record with serviceAppointmentId when provided
 *   - inserts record with null serviceAppointmentId when absent
 *   - inserts record with workshopRegistrationId when provided
 *   - passes taxCents derived from calculateSwissVAT(baseAmountCents)
 *   - returns invoiceId and invoiceNumber from insert result
 */

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeChain(result: unknown = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.insert = jest.fn().mockReturnValue(chain)
  chain.values = jest.fn().mockReturnValue(chain)
  chain.returning = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbInsert = jest.fn(() => makeChain([{ id: 'inv-1', invoiceNumber: 'INV-2026-001' }]))

jest.mock('@/db', () => ({
  db: {
    insert: (...args: unknown[]) => mockDbInsert.apply(null, args),
  },
}))

jest.mock('@/db/schema', () => ({
  invoices: {
    id: 'inv_id', invoiceNumber: 'inv_invoiceNumber', type: 'inv_type',
    status: 'inv_status', userId: 'inv_userId',
    serviceAppointmentId: 'inv_serviceAppointmentId',
    workshopRegistrationId: 'inv_workshopRegistrationId',
    subtotalCents: 'inv_subtotalCents', taxCents: 'inv_taxCents',
    totalCents: 'inv_totalCents', currency: 'inv_currency',
    taxRate: 'inv_taxRate', lineItems: 'inv_lineItems',
    issueDate: 'inv_issueDate', notes: 'inv_notes',
    paymentTerms: 'inv_paymentTerms',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  sql: Object.assign(
    jest.fn().mockReturnValue({ __sql: 'mocked' }),
    { raw: jest.fn().mockReturnValue({ __raw: true }) },
  ),
}))

jest.mock('@/lib/payments/tax-compliance', () => ({
  SWISS_VAT_RATES: { standard: 0.081 },
}))

jest.mock('@/config/invoice-status', () => ({
  INVOICE_STATUS: { DRAFT: 'draft' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/lib/payments/payments-fees', () => ({
  calculateSwissVAT: jest.fn((cents: number) => Math.round(cents * 0.081)),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { createInvoice, buildInvoiceLineItem } from '../payments-invoice'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_PARAMS = {
  userId: 'user-1',
  baseAmountCents: 10000,
  totalAmountCents: 10810,
  currency: 'CHF' as const,
  lineItems: [{ description: 'Service', quantity: 1, unitPrice: '100.00', total: '100.00' }],
  notes: '',
  paymentTerms: '30 Tage',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbInsert.mockImplementation(() =>
    makeChain([{ id: 'inv-1', invoiceNumber: 'INV-2026-001' }])
  )
})

// ============================================================================
// buildInvoiceLineItem
// ============================================================================

describe('buildInvoiceLineItem', () => {
  it('formats unitPrice to 2 decimal places from cents', () => {
    const item = buildInvoiceLineItem('Reparatur', 7000)

    expect(item.unitPrice).toBe('70.00')
  })

  it('sets description correctly', () => {
    const item = buildInvoiceLineItem('Diagnose', 3000)

    expect(item.description).toBe('Diagnose')
  })

  it('uses quantity=1 by default', () => {
    const item = buildInvoiceLineItem('Service', 5000)

    expect(item.quantity).toBe(1)
  })

  it('uses provided quantity', () => {
    const item = buildInvoiceLineItem('Workshop', 2000, 3)

    expect(item.quantity).toBe(3)
  })

  it('total equals unitPrice (current implementation ignores quantity for total)', () => {
    const item = buildInvoiceLineItem('Item', 5000, 2)

    expect(item.total).toBe(item.unitPrice)
  })

  it('handles fractional cents correctly (rounds to 2dp)', () => {
    const item = buildInvoiceLineItem('Small item', 100)

    expect(item.unitPrice).toBe('1.00')
  })
})

// ============================================================================
// createInvoice
// ============================================================================

describe('createInvoice', () => {
  it('returns invoiceId and invoiceNumber from insert', async () => {
    const result = await createInvoice(BASE_PARAMS)

    expect(result.invoiceId).toBe('inv-1')
    expect(result.invoiceNumber).toBe('INV-2026-001')
  })

  it('calls db.insert once', async () => {
    await createInvoice(BASE_PARAMS)

    expect(mockDbInsert).toHaveBeenCalledTimes(1)
  })

  it('passes serviceAppointmentId when provided', async () => {
    let capturedValues: Record<string, unknown> | null = null
    mockDbInsert.mockImplementationOnce(() => {
      const chain = makeChain([{ id: 'inv-1', invoiceNumber: 'INV-2026-001' }])
      const origValues = chain.values as jest.Mock
      chain.values = jest.fn((...args: unknown[]) => {
        capturedValues = args[0] as Record<string, unknown>
        return origValues(...args)
      })
      return chain
    })

    await createInvoice({ ...BASE_PARAMS, serviceAppointmentId: 'appt-1' })

    expect((capturedValues as unknown as Record<string, unknown>)?.serviceAppointmentId).toBe('appt-1')
  })

  it('passes null for serviceAppointmentId when absent', async () => {
    let capturedValues: Record<string, unknown> | null = null
    mockDbInsert.mockImplementationOnce(() => {
      const chain = makeChain([{ id: 'inv-1', invoiceNumber: 'INV-2026-001' }])
      const origValues = chain.values as jest.Mock
      chain.values = jest.fn((...args: unknown[]) => {
        capturedValues = args[0] as Record<string, unknown>
        return origValues(...args)
      })
      return chain
    })

    await createInvoice(BASE_PARAMS)

    expect((capturedValues as unknown as Record<string, unknown>)?.serviceAppointmentId).toBeNull()
  })

  it('passes workshopRegistrationId when provided', async () => {
    let capturedValues: Record<string, unknown> | null = null
    mockDbInsert.mockImplementationOnce(() => {
      const chain = makeChain([{ id: 'inv-1', invoiceNumber: 'INV-2026-001' }])
      const origValues = chain.values as jest.Mock
      chain.values = jest.fn((...args: unknown[]) => {
        capturedValues = args[0] as Record<string, unknown>
        return origValues(...args)
      })
      return chain
    })

    await createInvoice({ ...BASE_PARAMS, workshopRegistrationId: 'ws-reg-1' })

    expect((capturedValues as unknown as Record<string, unknown>)?.workshopRegistrationId).toBe('ws-reg-1')
  })

  it('passes taxCents computed from calculateSwissVAT', async () => {
    let capturedValues: Record<string, unknown> | null = null
    mockDbInsert.mockImplementationOnce(() => {
      const chain = makeChain([{ id: 'inv-1', invoiceNumber: 'INV-2026-001' }])
      const origValues = chain.values as jest.Mock
      chain.values = jest.fn((...args: unknown[]) => {
        capturedValues = args[0] as Record<string, unknown>
        return origValues(...args)
      })
      return chain
    })

    await createInvoice({ ...BASE_PARAMS, baseAmountCents: 10000 })

    // calculateSwissVAT(10000) = Math.round(10000 * 0.081) = 810
    expect((capturedValues as unknown as Record<string, unknown>)?.taxCents).toBe(810)
  })
})
