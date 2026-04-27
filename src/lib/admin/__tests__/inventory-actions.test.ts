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
    select: (...args: unknown[]) => mockDbSelect(...args),
    update: (...args: unknown[]) => mockDbUpdate(...args),
    insert: (...args: unknown[]) => mockDbInsert(...args),
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
  uploadImage: (...args: unknown[]) => mockUploadImage(...args),
  deleteImage: (...args: unknown[]) => mockDeleteImage(...args),
}))

jest.mock('@/config/marketplace-status', () => ({
  PRODUCT_STATUS: { APPROVED: 'approved' },
  MARKETPLACE_STATUS: { PUBLISHED: 'published', DRAFT: 'draft' },
}))

jest.mock('@/config/shop', () => ({
  MARKETPLACE_LISTING_PLATFORM: { INTERNAL: 'internal' },
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
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
  it('returns early (no insert/update on listing) when productInfo not found', async () => {
    // update (status change) → then productInfo select returns []
    mockDbSelect
      .mockReturnValueOnce(makeChain([]))  // productInfo → not found

    await publishProduct('product-1', 'user-1')

    expect(mockDbInsert).not.toHaveBeenCalled()
    // only 1 update (status change), no listing update
    expect(mockDbUpdate).toHaveBeenCalledTimes(1) // status update still runs
  })

  it('returns early when inventoryItem not found', async () => {
    mockDbSelect
      .mockReturnValueOnce(makeChain([{ brand: 'Dell', productName: 'Latitude', shortDescription: 'Laptop', estimatedPriceChf: '299' }]))
      .mockReturnValueOnce(makeChain([]))  // inventoryItem → not found

    await publishProduct('product-1', 'user-1')

    expect(mockDbInsert).not.toHaveBeenCalled()
  })

  it('updates existing listing when one exists', async () => {
    mockDbSelect
      .mockReturnValueOnce(makeChain([{ brand: 'Dell', productName: 'Latitude', shortDescription: '', estimatedPriceChf: '299' }]))
      .mockReturnValueOnce(makeChain([{ id: 'inv-1' }]))          // inventory item
      .mockReturnValueOnce(makeChain([{ id: 'listing-existing' }]))  // existing listing

    await publishProduct('product-1', 'user-1')

    expect(mockDbUpdate).toHaveBeenCalledTimes(2) // status + listing
    expect(mockDbInsert).not.toHaveBeenCalled()
  })

  it('creates new listing when none exists', async () => {
    mockDbSelect
      .mockReturnValueOnce(makeChain([{ brand: 'HP', productName: 'EliteBook', shortDescription: '', estimatedPriceChf: '250' }]))
      .mockReturnValueOnce(makeChain([{ id: 'inv-1' }]))  // inventory item
      .mockReturnValueOnce(makeChain([]))                  // no existing listing

    await publishProduct('product-1', 'user-1')

    expect(mockDbInsert).toHaveBeenCalledTimes(1)
  })
})

// ============================================================================
// unpublishProduct
// ============================================================================

describe('unpublishProduct', () => {
  it('updates listing to DRAFT when inventory item found', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([{ id: 'inv-1' }]))

    await unpublishProduct('product-1', 'user-1')

    expect(mockDbUpdate).toHaveBeenCalledTimes(1)
  })

  it('skips DB update when inventory item not found', async () => {
    mockDbSelect.mockReturnValueOnce(makeChain([]))

    await unpublishProduct('product-1', 'user-1')

    expect(mockDbUpdate).not.toHaveBeenCalled()
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

  it('deletes old Vercel blob when replacing an existing image', async () => {
    const oldUrl = 'https://abc.blob.vercel-storage.com/old.jpg'
    mockDbSelect
      .mockReturnValueOnce(makeChain([{ id: 'img-1', filePath: oldUrl }]))
      .mockReturnValueOnce(makeChain([{ itemUuid: 'I-240101-0001' }]))

    await updateProductImage('prod-1', 'base64data', 'user-1')

    expect(mockDeleteImage).toHaveBeenCalledWith(oldUrl)
  })

  it('does NOT call deleteImage for non-Vercel URLs', async () => {
    mockDbSelect
      .mockReturnValueOnce(makeChain([{ id: 'img-1', filePath: 'https://other-cdn.com/old.jpg' }]))
      .mockReturnValueOnce(makeChain([{ itemUuid: 'I-240101-0001' }]))

    await updateProductImage('prod-1', 'base64data', 'user-1')

    expect(mockDeleteImage).not.toHaveBeenCalled()
  })
})
