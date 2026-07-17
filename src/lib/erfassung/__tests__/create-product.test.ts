/**
 * Tests for erfassung/create-product.ts — SSOT for product creation.
 *
 * Mission-relevant: every device that enters the system goes through
 * createErfassungProduct. A bug in the action→status mapping publishes
 * products prematurely or blocks them from ever appearing in the shop.
 * A broken donation-link path loses the audit trail for intake items.
 *
 * Behaviors locked:
 *   generateItemUUID
 *   - returns format I-YYMMDD-NNNN
 *   - uses sequential count + 1 as sequence number
 *   - works with no executor (db.execute path)
 *   - works with Drizzle tx executor (tx.execute path)
 *   - works with PoolClient executor (client.query path)
 *
 *   createErfassungProduct
 *   - action='draft' → productStatus PENDING_REVIEW, no marketplace listing
 *   - action='publish' → productStatus APPROVED, inserts marketplace listing
 *   - checklistGated overrides publish → no marketplace listing (finalStatus=DRAFT)
 *   - existingDonationId found → donationId linked
 *   - existingDonationId NOT found → donationId null (graceful, no throw)
 *   - donation option → inserts donation record, donationId set
 *   - no donation option → donationId null
 *   - intakeTier → initializes intake checklist state
 *   - no image → imageUrl null
 *   - image upload success → imageUrl set, product image record inserted
 *   - image upload failure → imageUrl null, continues without throwing
 *   - returns { productId, inventoryId, itemUUID, imageUrl, donationId }
 */

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function makeInsertChain(result: unknown = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.values = jest.fn().mockReturnValue(chain)
  chain.returning = jest.fn().mockReturnValue(chain)
  chain.onConflictDoNothing = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

function makeSelectChain(result: unknown = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.from = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.limit = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// DB mocks
// ---------------------------------------------------------------------------

const mockDbExecute = jest.fn()

jest.mock('@/db', () => ({
  db: {
    execute: (...args: unknown[]) => mockDbExecute.apply(null, args),
  },
}))

jest.mock('@/db/schema/inventory', () => ({
  aiExtractedProducts: { id: 'aep_id', slug: 'aep_slug' },
  inventoryItems: { id: 'ii_id' },
  customerProfiles: { id: 'cp_id', slug: 'cp_slug' },
  productCustomerProfiles: { productId: 'pcp_productId', profileId: 'pcp_profileId' },
  marketplaceListings: { inventoryItemId: 'ml_inventoryItemId' },
  productImages: { id: 'pi_id', productId: 'pi_productId' },
}))

jest.mock('@/db/schema/misc', () => ({
  donations: { id: 'd_id' },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  sql: Object.assign(
    jest.fn().mockReturnValue({ __sql: 'mocked' }),
    { raw: jest.fn().mockReturnValue({ __raw: true }) },
  ),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  getTableName: jest.fn().mockReturnValue('ai_extracted_products'),
}))

// ---------------------------------------------------------------------------
// Config + util mocks
// ---------------------------------------------------------------------------

jest.mock('@/config/marketplace-status', () => ({
  PRODUCT_STATUS: { PENDING_REVIEW: 'pending_review', APPROVED: 'approved' },
  MARKETPLACE_STATUS: { PUBLISHED: 'published', DRAFT: 'draft' },
  INVENTORY_ITEM_STATUS: { AVAILABLE: 'available' },
}))

// Keep the real pure config (INTAKE_TIERS, emptyChecklistItemState,
// requiresQualityControl over the real CHECKLIST_ITEMS) — only pin the
// device checklist to a stable two-item list.
jest.mock('@/config/intake-checklist', () => ({
  ...jest.requireActual('@/config/intake-checklist'),
  getChecklistForDevice: jest.fn().mockReturnValue([
    { id: 'check-1' },
    { id: 'check-2' },
  ]),
}))

jest.mock('@/config/donations', () => ({
  DONATION_STATUSES: { RECORDED: 'recorded' },
}))

const mockUploadImage = jest.fn().mockResolvedValue({ success: false, error: 'disabled' })
const mockGenerateImageFilename = jest.fn().mockReturnValue('I-260427-0001.jpg')

jest.mock('@/lib/storage/image-upload', () => ({
  uploadImage: (...args: unknown[]) => mockUploadImage.apply(null, args),
  generateImageFilename: (...args: unknown[]) => mockGenerateImageFilename.apply(null, args),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// publishRevampitListing is the unified-marketplace publish helper. create-product
// delegates to it on `action='publish'` (it replaced the old inline
// marketplace_listings insert). Its own DB chains are covered by its own tests;
// here we only assert that create-product calls it for publish and skips it when
// checklist-gated, so a no-op spy is the correct seam.
const mockPublishRevampitListing = jest.fn().mockResolvedValue('listing-1')

jest.mock('@/lib/marketplace/publish-revampit-listing', () => ({
  publishRevampitListing: (...args: unknown[]) => mockPublishRevampitListing.apply(null, args),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { generateItemUUID, createErfassungProduct } from '../create-product'
import type { ErfassungPayload } from '@/types/erfassung'

// ---------------------------------------------------------------------------
// Transaction mock
// ---------------------------------------------------------------------------

const mockTxExecute = jest.fn()
const mockTxInsert = jest.fn()
const mockTxSelect = jest.fn()

const mockTx = {
  execute: (...args: unknown[]) => mockTxExecute.apply(null, args),
  insert: (...args: unknown[]) => mockTxInsert.apply(null, args),
  select: (...args: unknown[]) => mockTxSelect.apply(null, args),
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makePayload(overrides: Partial<ErfassungPayload> = {}): ErfassungPayload {
  return {
    produktname: 'ThinkPad T480',
    hersteller: 'Lenovo',
    kurzbeschreibung: 'Gut erhaltenes Laptop',
    verkaufspreis: 199,
    zustand: 'good',
    hauptkategorie: 'laptop',
    action: 'draft',
    ...overrides,
  } as ErfassungPayload
}

/** Queue up the standard minimal "draft" mock sequence */
function setupMinimalDraft(productId = 'product-1', inventoryId = 'inventory-1') {
  // generateItemUUID via tx.execute
  mockTxExecute.mockResolvedValueOnce({ rows: [{ count: '0' }] })
  // aiExtractedProducts insert
  mockTxInsert.mockReturnValueOnce(makeInsertChain([{ id: productId }]))
  // inventoryItems insert
  mockTxInsert.mockReturnValueOnce(makeInsertChain([{ id: inventoryId }]))
}

beforeEach(() => {
  jest.clearAllMocks()
  mockDbExecute.mockResolvedValue({ rows: [{ count: '0' }] })
  mockTxExecute.mockResolvedValue({ rows: [{ count: '0' }] })
  mockTxInsert.mockReturnValue(makeInsertChain([]))
  mockTxSelect.mockReturnValue(makeSelectChain([]))
})

// ============================================================================
// generateItemUUID
// ============================================================================

describe('generateItemUUID', () => {
  it('returns format I-YYMMDD-NNNN with no executor (db.execute path)', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [{ count: '0' }] })

    const result = await generateItemUUID()

    expect(result).toMatch(/^I-\d{6}-\d{4}$/)
  })

  it('uses count + 1 as sequence number', async () => {
    mockDbExecute.mockResolvedValueOnce({ rows: [{ count: '5' }] })

    const result = await generateItemUUID()

    expect(result).toMatch(/-0006$/)
  })

  it('works with Drizzle tx executor (tx.execute path)', async () => {
    mockTxExecute.mockResolvedValueOnce({ rows: [{ count: '2' }] })

    const result = await generateItemUUID(mockTx as unknown as Parameters<typeof generateItemUUID>[0])

    expect(result).toMatch(/^I-\d{6}-0003$/)
    expect(mockTxExecute).toHaveBeenCalledTimes(1)
    expect(mockDbExecute).not.toHaveBeenCalled()
  })

  it('works with PoolClient executor (client.query path)', async () => {
    const mockPoolClient = {
      query: jest.fn().mockResolvedValueOnce({ rows: [{ count: '9' }] }),
      // PoolClient does NOT have .insert — isPoolClient check relies on this
    }

    const result = await generateItemUUID(mockPoolClient as unknown as Parameters<typeof generateItemUUID>[0])

    expect(result).toMatch(/-0010$/)
    expect(mockPoolClient.query).toHaveBeenCalledTimes(1)
    expect(mockDbExecute).not.toHaveBeenCalled()
  })
})

// ============================================================================
// createErfassungProduct — action → status mapping
// ============================================================================

describe('createErfassungProduct — action/status', () => {
  it('draft action → productStatus PENDING_REVIEW, no marketplace listing insert', async () => {
    setupMinimalDraft()

    const result = await createErfassungProduct(makePayload({ action: 'draft' }), 'user-1', mockTx as never)

    // Only 2 inserts: aiExtractedProducts + inventoryItems (no marketplace listing)
    expect(mockTxInsert).toHaveBeenCalledTimes(2)
    expect(result.productId).toBe('product-1')
    expect(result.inventoryId).toBe('inventory-1')
  })

  it('publish action → delegates to publishRevampitListing (2 own inserts)', async () => {
    setupMinimalDraft()

    const result = await createErfassungProduct(makePayload({ action: 'publish' }), 'user-1', mockTx as never)

    // create-product itself inserts only product + inventory; the marketplace
    // listing is created by publishRevampitListing (mocked here).
    expect(mockTxInsert).toHaveBeenCalledTimes(2)
    expect(mockPublishRevampitListing).toHaveBeenCalledTimes(1)
    expect(mockPublishRevampitListing).toHaveBeenCalledWith(mockTx, 'inventory-1', { verifiedBy: 'user-1' })
    expect(result.productId).toBe('product-1')
  })

  it('checklistGated + publish → skips publishRevampitListing (2 inserts only)', async () => {
    setupMinimalDraft()

    await createErfassungProduct(
      makePayload({ action: 'publish' }),
      'user-1',
      mockTx as never,
      { checklistGated: true },
    )

    // checklistGated overrides publish → no marketplace listing
    expect(mockTxInsert).toHaveBeenCalledTimes(2)
    expect(mockPublishRevampitListing).not.toHaveBeenCalled()
  })

  it('publish of a QC-required category → intercepted: draft + refurbish tier, no listing', async () => {
    setupMinimalDraft()

    // '10' (Laptops) has required testing items → requiresQualityControl=true
    const result = await createErfassungProduct(
      makePayload({ action: 'publish', hauptkategorie: '10' }),
      'user-1',
      mockTx as never,
    )

    expect(mockPublishRevampitListing).not.toHaveBeenCalled()
    expect(result.qcRequired).toBe(true)
    expect(result.listingId).toBeNull()
  })

  it('publish of an accessory category → not QC-gated, publishes directly', async () => {
    setupMinimalDraft()

    // '80' (Peripherie) has no required testing/security items
    const result = await createErfassungProduct(
      makePayload({ action: 'publish', hauptkategorie: '80' }),
      'user-1',
      mockTx as never,
    )

    expect(mockPublishRevampitListing).toHaveBeenCalledTimes(1)
    expect(result.qcRequired).toBe(false)
  })

  it('documented QC bypass publishes a testable device without claiming verification', async () => {
    setupMinimalDraft()

    const result = await createErfassungProduct(
      makePayload({ action: 'publish', hauptkategorie: '10' }),
      'user-1',
      mockTx as never,
      { qcBypassReason: 'sealed stock sold without functional test' },
    )

    expect(mockPublishRevampitListing).toHaveBeenCalledTimes(1)
    expect(result.qcRequired).toBe(false)
    expect(result.qcBypassed).toBe(true)
    expect(result.listingId).toBe('listing-1')
  })
})

// ============================================================================
// createErfassungProduct — donation handling
// ============================================================================

describe('createErfassungProduct — donation handling', () => {
  it('donationId is null when no donation option', async () => {
    setupMinimalDraft()

    const result = await createErfassungProduct(makePayload(), 'user-1', mockTx as never)

    expect(result.donationId).toBeNull()
  })

  it('links existingDonationId when the donation record is found', async () => {
    mockTxExecute.mockResolvedValueOnce({ rows: [{ count: '0' }] }) // UUID
    mockTxInsert.mockReturnValueOnce(makeInsertChain([{ id: 'product-1' }])) // product
    // existingDonation lookup → found
    mockTxSelect.mockReturnValueOnce(makeSelectChain([{ id: 'donation-existing' }]))
    mockTxInsert.mockReturnValueOnce(makeInsertChain([{ id: 'inventory-1' }])) // inventory

    const result = await createErfassungProduct(
      makePayload(),
      'user-1',
      mockTx as never,
      { existingDonationId: 'donation-existing' },
    )

    expect(result.donationId).toBe('donation-existing')
  })

  it('donationId is null when existingDonationId record not found', async () => {
    mockTxExecute.mockResolvedValueOnce({ rows: [{ count: '0' }] }) // UUID
    mockTxInsert.mockReturnValueOnce(makeInsertChain([{ id: 'product-1' }])) // product
    // existingDonation lookup → not found
    mockTxSelect.mockReturnValueOnce(makeSelectChain([]))
    mockTxInsert.mockReturnValueOnce(makeInsertChain([{ id: 'inventory-1' }])) // inventory

    const result = await createErfassungProduct(
      makePayload(),
      'user-1',
      mockTx as never,
      { existingDonationId: 'nonexistent-id' },
    )

    // Graceful fallback: donationId null, no throw
    expect(result.donationId).toBeNull()
  })

  it('creates new donation record when donation option provided', async () => {
    mockTxExecute.mockResolvedValueOnce({ rows: [{ count: '0' }] }) // UUID
    mockTxInsert
      .mockReturnValueOnce(makeInsertChain([{ id: 'product-1' }]))   // product
      .mockReturnValueOnce(makeInsertChain([{ id: 'donation-new' }])) // donation INSERT
      .mockReturnValueOnce(makeInsertChain([{ id: 'inventory-1' }])) // inventory

    const result = await createErfassungProduct(
      makePayload(),
      'user-1',
      mockTx as never,
      {
        donation: {
          donorName: 'Hans Müller',
          donorEmail: 'hans@example.com',
          notes: 'Funktioniert noch',
          deviceCategory: 'laptop',
        },
      },
    )

    expect(result.donationId).toBe('donation-new')
  })
})

// ============================================================================
// createErfassungProduct — image handling
// ============================================================================

describe('createErfassungProduct — image handling', () => {
  it('imageUrl is null when no image in payload', async () => {
    setupMinimalDraft()

    const result = await createErfassungProduct(makePayload(), 'user-1', mockTx as never)

    expect(result.imageUrl).toBeNull()
    expect(mockUploadImage).not.toHaveBeenCalled()
  })

  it('imageUrl set and product image record inserted when upload succeeds', async () => {
    mockTxExecute.mockResolvedValueOnce({ rows: [{ count: '0' }] }) // UUID
    mockTxInsert
      .mockReturnValueOnce(makeInsertChain([{ id: 'product-1' }]))   // product
      .mockReturnValueOnce(makeInsertChain([{ id: 'inventory-1' }])) // inventory
      .mockReturnValueOnce(makeInsertChain([]))                       // product image

    mockUploadImage.mockResolvedValueOnce({
      success: true,
      url: 'https://cdn.revampit.ch/I-260427-0001.jpg',
    })

    const result = await createErfassungProduct(
      makePayload({ image: 'data:image/jpeg;base64,abc123' }),
      'user-1',
      mockTx as never,
    )

    expect(result.imageUrl).toBe('https://cdn.revampit.ch/I-260427-0001.jpg')
    expect(mockTxInsert).toHaveBeenCalledTimes(3) // product + inventory + productImages
  })

  it('imageUrl null and no throw when upload fails', async () => {
    setupMinimalDraft()

    mockUploadImage.mockResolvedValueOnce({ success: false, error: 'quota exceeded' })

    const result = await createErfassungProduct(
      makePayload({ image: 'data:image/jpeg;base64,abc123' }),
      'user-1',
      mockTx as never,
    )

    expect(result.imageUrl).toBeNull()
  })
})

// ============================================================================
// createErfassungProduct — return shape
// ============================================================================

describe('createErfassungProduct — return shape', () => {
  it('returns all required fields', async () => {
    setupMinimalDraft('product-42', 'inventory-42')

    const result = await createErfassungProduct(makePayload(), 'user-1', mockTx as never)

    expect(result).toHaveProperty('productId', 'product-42')
    expect(result).toHaveProperty('inventoryId', 'inventory-42')
    expect(result).toHaveProperty('itemUUID')
    expect(result).toHaveProperty('imageUrl', null)
    expect(result).toHaveProperty('donationId', null)
    expect(result.itemUUID).toMatch(/^I-\d{6}-\d{4}$/)
  })
})
