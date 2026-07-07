/**
 * Tests for admin/inventory-actions.ts — product publish/unpublish and image update.
 *
 * Mission-relevant: publishing a product makes it visible to recipients on the
 * internal marketplace. If publishProduct creates a duplicate listing instead of
 * updating the existing one, products appear twice. If updateProductImage returns
 * null silently, staff doesn't know the upload failed.
 *
 * Behaviors locked:
 *   publishProduct
 *   - returns early without insert/update when productInfo not found
 *   - returns early without insert/update when inventoryItem not found
 *   - updates existing listing when one exists
 *   - creates new listing when none exists
 *
 *   unpublishProduct
 *   - updates listing to DRAFT status when inventory item found
 *   - skips DB update when inventory item not found
 *
 *   updateProductImage
 *   - returns null when upload fails
 *   - inserts new image record when no existing image
 *   - updates existing image record when one exists
 *   - deletes old Vercel blob when replacing existing image
 *   - does NOT call deleteImage for non-Vercel URLs
 */

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

function makeChain(result: unknown = []) {
  const resolved = Promise.resolve(result)
  const chain: Record<string, unknown> = {}
  chain.select = jest.fn().mockReturnValue(chain)
  chain.from = jest.fn().mockReturnValue(chain)
  chain.where = jest.fn().mockReturnValue(chain)
  chain.update = jest.fn().mockReturnValue(chain)
  chain.set = jest.fn().mockReturnValue(chain)
  chain.insert = jest.fn().mockReturnValue(chain)
  chain.values = jest.fn().mockReturnValue(chain)
  chain.then = (resolved as Promise<unknown>).then.bind(resolved)
  chain.catch = (resolved as Promise<unknown>).catch.bind(resolved)
  chain.finally = (resolved as Promise<unknown>).finally.bind(resolved)
  return chain
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDbSelect = jest.fn(() => makeChain([]))
const mockDbUpdate = jest.fn(() => makeChain())
const mockDbInsert = jest.fn(() => makeChain())

jest.mock('@/db', () => ({
  db: {
    select: (...args: unknown[]) => mockDbSelect.apply(null, args),
    update: (...args: unknown[]) => mockDbUpdate.apply(null, args),
    insert: (...args: unknown[]) => mockDbInsert.apply(null, args),
  },
}))

jest.mock('@/db/schema/inventory', () => ({
  aiExtractedProducts: {
    id: 'aep_id', brand: 'aep_brand', productName: 'aep_productName',
    shortDescription: 'aep_shortDesc', estimatedPriceChf: 'aep_estimatedPriceChf',
    itemUuid: 'aep_itemUuid', status: 'aep_status', updatedAt: 'aep_updatedAt',
  },
  inventoryItems: { id: 'ii_id', aiProductId: 'ii_aiProductId' },
  marketplaceListings: {
    id: 'ml_id', inventoryItemId: 'ml_inventoryItemId',
    platform: 'ml_platform', status: 'ml_status',
    publishedAt: 'ml_publishedAt', updatedAt: 'ml_updatedAt',
    title: 'ml_title', description: 'ml_description',
    priceChf: 'ml_priceChf', createdBy: 'ml_createdBy',
  },
  productImages: {
    id: 'pi_id', productId: 'pi_productId', isPrimary: 'pi_isPrimary',
    filePath: 'pi_filePath', filename: 'pi_filename', updatedAt: 'pi_updatedAt',
    uploadedBy: 'pi_uploadedBy', uploadStatus: 'pi_uploadStatus',
  },
}))

jest.mock('drizzle-orm', () => ({
  ...jest.requireActual('drizzle-orm'),
  eq: jest.fn().mockReturnValue({ __eq: true }),
  and: jest.fn().mockReturnValue({ __and: true }),
}))

const mockUploadImage = jest.fn()
const mockDeleteImage = jest.fn()

jest.mock('@/lib/storage/image-upload', () => ({
  uploadImage: (...args: unknown[]) => mockUploadImage.apply(null, args),
  deleteImage: (...args: unknown[]) => mockDeleteImage.apply(null, args),
}))

jest.mock('@/config/marketplace-status', () => ({
  PRODUCT_STATUS: { APPROVED: 'approved' },
  MARKETPLACE_STATUS: { PUBLISHED: 'published', DRAFT: 'draft' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

// publishProduct/unpublishProduct now delegate the actual listing create/refresh/
// remove to the unified-marketplace helpers (the old inline marketplace_listings
// insert/update is gone). Those helpers have their own tests; here we only assert
// the orchestration: inventory lookup → delegate (or skip when not found).
const mockPublishRevampitListing = jest.fn().mockResolvedValue('listing-1')
const mockUnpublishRevampitListing = jest.fn().mockResolvedValue(undefined)

jest.mock('@/lib/marketplace/publish-revampit-listing', () => ({
  publishRevampitListing: (...args: unknown[]) => mockPublishRevampitListing.apply(null, args),
  unpublishRevampitListing: (...args: unknown[]) => mockUnpublishRevampitListing.apply(null, args),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { publishProduct, unpublishProduct, updateProductImage } from '../inventory-actions'

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
  mockDbSelect.mockImplementation(() => makeChain([]))
  mockDbUpdate.mockImplementation(() => makeChain())
  mockDbInsert.mockImplementation(() => makeChain())
  mockUploadImage.mockResolvedValue({ success: true, url: 'https://cdn.example.com/product.jpg' })
  mockDeleteImage.mockResolvedValue(undefined)
})

// ============================================================================
// publishProduct
// ============================================================================

describe('publishProduct', () => {
  it('approves the product but skips publishing when inventoryItem not found', async () => {
    // First (and only) select is the inventory-item lookup → not found.
    mockDbSelect.mockReturnValueOnce(makeChain([]))

    await publishProduct('product-1', 'user-1')

    // Status approval still runs, but no listing is created.
    expect(mockDbUpdate).toHaveBeenCalledTimes(1) // status approval
    expect(mockPublishRevampitListing).not.toHaveBeenCalled()
  })

  it('delegates to publishRevampitListing when inventoryItem found', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([{ id: 'inv-1' }])) // inventory item

    await publishProduct('product-1', 'user-1')

    expect(mockDbUpdate).toHaveBeenCalledTimes(1) // status approval
    expect(mockPublishRevampitListing).toHaveBeenCalledTimes(1)
    expect(mockPublishRevampitListing).toHaveBeenCalledWith(expect.anything(), 'inv-1')
  })
})

// ============================================================================
// unpublishProduct
// ============================================================================

describe('unpublishProduct', () => {
  it('delegates to unpublishRevampitListing when inventory item found', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([{ id: 'inv-1' }]))

    await unpublishProduct('product-1', 'user-1')

    expect(mockUnpublishRevampitListing).toHaveBeenCalledTimes(1)
    expect(mockUnpublishRevampitListing).toHaveBeenCalledWith(expect.anything(), 'inv-1')
  })

  it('skips unpublish when inventory item not found', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([]))

    await unpublishProduct('product-1', 'user-1')

    expect(mockUnpublishRevampitListing).not.toHaveBeenCalled()
  })
})

// ============================================================================
// updateProductImage
// ============================================================================

describe('updateProductImage', () => {
  it('returns null when upload fails', async () => {
    mockUploadImage.mockResolvedValueOnce({ success: false })
    // existing image: none, product info
    mockDbSelect
      .mockReturnValueOnce(makeChain([]))  // no existing image
      .mockReturnValueOnce(makeChain([{ itemUuid: 'I-240101-0001' }]))

    const result = await updateProductImage('prod-1', 'base64data', 'user-1')

    expect(result).toBeNull()
    expect(mockDbInsert).not.toHaveBeenCalled()
  })

  it('inserts new image record when no existing image', async () => {
    mockDbSelect
      .mockReturnValueOnce(makeChain([]))                          // no existing image
      .mockReturnValueOnce(makeChain([{ itemUuid: 'I-240101-0001' }]))

    const result = await updateProductImage('prod-1', 'base64data', 'user-1')

    expect(result).toBe('https://cdn.example.com/product.jpg')
    expect(mockDbInsert).toHaveBeenCalledTimes(1)
    expect(mockDbUpdate).not.toHaveBeenCalled()
  })

  it('updates existing image record when one exists', async () => {
    mockDbSelect
      .mockReturnValueOnce(makeChain([{ id: 'img-1', filePath: 'https://other.com/old.jpg' }]))
      .mockReturnValueOnce(makeChain([{ itemUuid: 'I-240101-0001' }]))

    const result = await updateProductImage('prod-1', 'base64data', 'user-1')

    expect(result).toBe('https://cdn.example.com/product.jpg')
    expect(mockDbUpdate).toHaveBeenCalledTimes(1)
    expect(mockDbInsert).not.toHaveBeenCalled()
  })

  it('deletes the old object when the new upload lands at a different URL', async () => {
    // Upload resolves to cdn.example.com/product.jpg (beforeEach default); old key differs.
    const oldUrl = 'https://other-cdn.com/old.jpg'
    mockDbSelect
      .mockReturnValueOnce(makeChain([{ id: 'img-1', filePath: oldUrl }]))
      .mockReturnValueOnce(makeChain([{ itemUuid: 'I-240101-0001' }]))

    await updateProductImage('prod-1', 'base64data', 'user-1')

    expect(mockDeleteImage).toHaveBeenCalledWith(oldUrl)
  })

  it('does NOT call deleteImage when the re-upload overwrites the same URL', async () => {
    // Deterministic <itemUuid>.jpg keys mean a re-upload usually returns the same
    // URL — no stale object to clean up.
    const sameUrl = 'https://cdn.example.com/product.jpg'
    mockDbSelect
      .mockReturnValueOnce(makeChain([{ id: 'img-1', filePath: sameUrl }]))
      .mockReturnValueOnce(makeChain([{ itemUuid: 'I-240101-0001' }]))

    await updateProductImage('prod-1', 'base64data', 'user-1')

    expect(mockDeleteImage).not.toHaveBeenCalled()
  })
})
