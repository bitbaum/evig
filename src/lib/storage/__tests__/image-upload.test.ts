/**
 * @jest-environment node
 */

/**
 * Tests for the image upload helper (lib/storage/image-upload.ts).
 *
 * Every donor product photo flows through this module — a regression
 * here breaks the marketplace UX. Two storage backends:
 *
 *   - Production: Vercel Blob storage (when BLOB_READ_WRITE_TOKEN is set)
 *   - Development: local filesystem under public/uploads/<folder>/
 *
 * Four exports:
 *   isBlobConfigured()         — env-var check
 *   uploadImage(b64, name, ?folder) — base64 parse, content-type detect,
 *                                     branch to blob or local fs
 *   deleteImage(url)           — URL pattern detect → blob.del or fs.unlink
 *   generateImageFilename(uuid, ?index) — pure naming helper
 */

const mockPut = jest.fn()
const mockDel = jest.fn()
const mockExistsSync = jest.fn()
const mockMkdirSync = jest.fn()
const mockWriteFileSync = jest.fn()
const mockUnlinkSync = jest.fn()

jest.mock('@vercel/blob', () => ({
  put: (...args: unknown[]) => mockPut(...args),
  del: (...args: unknown[]) => mockDel(...args),
}))

jest.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  unlinkSync: (...args: unknown[]) => mockUnlinkSync(...args),
}))

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

import {
  isBlobConfigured,
  uploadImage,
  deleteImage,
  generateImageFilename,
} from '../image-upload'

const ORIGINAL_TOKEN = process.env.BLOB_READ_WRITE_TOKEN
const TINY_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

beforeEach(() => {
  mockPut.mockReset()
  mockDel.mockReset()
  mockExistsSync.mockReset()
  mockMkdirSync.mockReset()
  mockWriteFileSync.mockReset()
  mockUnlinkSync.mockReset()
  delete process.env.BLOB_READ_WRITE_TOKEN
})

afterAll(() => {
  if (ORIGINAL_TOKEN === undefined) delete process.env.BLOB_READ_WRITE_TOKEN
  else process.env.BLOB_READ_WRITE_TOKEN = ORIGINAL_TOKEN
})

// ============================================================================
// isBlobConfigured
// ============================================================================

describe('isBlobConfigured', () => {
  it('returns false when BLOB_READ_WRITE_TOKEN is unset', () => {
    expect(isBlobConfigured()).toBe(false)
  })

  it('returns true when BLOB_READ_WRITE_TOKEN is set (any non-empty value)', () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_xxx'
    expect(isBlobConfigured()).toBe(true)
  })

  it('returns false when BLOB_READ_WRITE_TOKEN is empty string', () => {
    process.env.BLOB_READ_WRITE_TOKEN = ''
    expect(isBlobConfigured()).toBe(false)
  })
})

// ============================================================================
// generateImageFilename — pure
// ============================================================================

describe('generateImageFilename', () => {
  it('uses the bare uuid + .jpg when index is 0 (default)', () => {
    expect(generateImageFilename('I-260204-0001')).toBe('I-260204-0001.jpg')
  })

  it('appends _N when index > 0 (multi-image products)', () => {
    expect(generateImageFilename('I-260204-0001', 1)).toBe('I-260204-0001_1.jpg')
    expect(generateImageFilename('I-260204-0001', 5)).toBe('I-260204-0001_5.jpg')
  })

  it('explicit index=0 is the same as omitted (no _0 suffix)', () => {
    expect(generateImageFilename('I-260204-0001', 0)).toBe('I-260204-0001.jpg')
  })
})

// ============================================================================
// uploadImage — blob storage path
// ============================================================================

describe('uploadImage — Vercel Blob (production)', () => {
  beforeEach(() => {
    process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_test'
    mockPut.mockResolvedValue({ url: 'https://abc.blob.vercel-storage.com/products/img.jpg' })
  })

  it('calls put() with pathname=<folder>/<filename> and addRandomSuffix=false', async () => {
    await uploadImage(TINY_PNG_BASE64, 'I-260204-0001.jpg')

    expect(mockPut).toHaveBeenCalledTimes(1)
    const [pathname, , options] = mockPut.mock.calls[0]
    expect(pathname).toBe('products/I-260204-0001.jpg')
    // Critical: addRandomSuffix=false keeps filenames predictable so we
    // can compute the URL deterministically from the item_uuid
    expect(options).toMatchObject({
      access: 'public',
      contentType: 'image/jpeg',
      addRandomSuffix: false,
    })
  })

  it('uses custom folder when provided', async () => {
    await uploadImage(TINY_PNG_BASE64, 'avatar.jpg', 'profiles')
    const [pathname] = mockPut.mock.calls[0]
    expect(pathname).toBe('profiles/avatar.jpg')
  })

  it('returns the URL from the blob put() response', async () => {
    mockPut.mockResolvedValueOnce({ url: 'https://x.blob.vercel-storage.com/products/foo.jpg' })
    const result = await uploadImage(TINY_PNG_BASE64, 'foo.jpg')
    expect(result).toEqual({
      success: true,
      url: 'https://x.blob.vercel-storage.com/products/foo.jpg',
    })
  })

  it('extracts contentType from the data URL prefix when present', async () => {
    const dataUrl = `data:image/png;base64,${TINY_PNG_BASE64}`
    await uploadImage(dataUrl, 'foo.jpg')
    const [, , options] = mockPut.mock.calls[0]
    expect(options.contentType).toBe('image/png')
  })

  it('defaults contentType to image/jpeg when no data URL prefix', async () => {
    await uploadImage(TINY_PNG_BASE64, 'foo.jpg')
    const [, , options] = mockPut.mock.calls[0]
    expect(options.contentType).toBe('image/jpeg')
  })

  it('strips the data URL prefix before decoding base64 (does not double-encode)', async () => {
    const dataUrl = `data:image/png;base64,${TINY_PNG_BASE64}`
    await uploadImage(dataUrl, 'foo.jpg')
    const [, buffer] = mockPut.mock.calls[0]
    // Verify the decoded buffer matches the raw base64 (not the full data URL)
    const expected = Buffer.from(TINY_PNG_BASE64, 'base64')
    expect(Buffer.compare(buffer, expected)).toBe(0)
  })

  it('returns success=false with error message when blob put() throws', async () => {
    mockPut.mockRejectedValueOnce(new Error('blob quota exceeded'))
    const result = await uploadImage(TINY_PNG_BASE64, 'foo.jpg')
    expect(result).toEqual({ success: false, error: 'blob quota exceeded' })
  })

  it('handles non-Error throws gracefully', async () => {
    mockPut.mockRejectedValueOnce('weird non-Error throw')
    const result = await uploadImage(TINY_PNG_BASE64, 'foo.jpg')
    expect(result).toEqual({ success: false, error: 'Unknown upload error' })
  })
})

// ============================================================================
// uploadImage — local filesystem path (development)
// ============================================================================

describe('uploadImage — local filesystem (development fallback)', () => {
  it('does NOT call put() when blob is not configured', async () => {
    mockExistsSync.mockReturnValue(true)
    await uploadImage(TINY_PNG_BASE64, 'foo.jpg')
    expect(mockPut).not.toHaveBeenCalled()
  })

  it('writes the decoded buffer to public/uploads/<folder>/<filename>', async () => {
    mockExistsSync.mockReturnValue(true)
    await uploadImage(TINY_PNG_BASE64, 'I-260204-0001.jpg', 'products')

    expect(mockWriteFileSync).toHaveBeenCalledTimes(1)
    const [filepath, buffer] = mockWriteFileSync.mock.calls[0]
    expect(filepath).toContain('public/uploads/products/I-260204-0001.jpg')
    const expected = Buffer.from(TINY_PNG_BASE64, 'base64')
    expect(Buffer.compare(buffer, expected)).toBe(0)
  })

  it('creates the uploads folder if it does not exist (recursive=true)', async () => {
    mockExistsSync.mockReturnValue(false)
    await uploadImage(TINY_PNG_BASE64, 'foo.jpg', 'products')

    expect(mockMkdirSync).toHaveBeenCalledTimes(1)
    expect(mockMkdirSync.mock.calls[0][0]).toContain('public/uploads/products')
    expect(mockMkdirSync.mock.calls[0][1]).toEqual({ recursive: true })
  })

  it('skips mkdir when the folder already exists', async () => {
    mockExistsSync.mockReturnValue(true)
    await uploadImage(TINY_PNG_BASE64, 'foo.jpg')
    expect(mockMkdirSync).not.toHaveBeenCalled()
  })

  it('returns the public-relative URL (not the absolute filepath)', async () => {
    mockExistsSync.mockReturnValue(true)
    const result = await uploadImage(TINY_PNG_BASE64, 'I-260204-0001.jpg', 'products')

    expect(result).toEqual({
      success: true,
      url: '/uploads/products/I-260204-0001.jpg',
    })
  })

  it('returns success=false when fs.writeFileSync throws (disk full, perms)', async () => {
    mockExistsSync.mockReturnValue(true)
    mockWriteFileSync.mockImplementationOnce(() => {
      throw new Error('EACCES: permission denied')
    })

    const result = await uploadImage(TINY_PNG_BASE64, 'foo.jpg')
    expect(result.success).toBe(false)
    expect(result.error).toContain('EACCES')
  })
})

// ============================================================================
// deleteImage
// ============================================================================

describe('deleteImage — Vercel Blob URLs', () => {
  it('calls blob.del() for blob.vercel-storage.com URLs', async () => {
    mockDel.mockResolvedValueOnce(undefined)
    const result = await deleteImage('https://x.blob.vercel-storage.com/products/foo.jpg')
    expect(mockDel).toHaveBeenCalledWith('https://x.blob.vercel-storage.com/products/foo.jpg')
    expect(result).toBe(true)
  })

  it('returns false when blob.del() throws', async () => {
    mockDel.mockRejectedValueOnce(new Error('not found'))
    expect(await deleteImage('https://x.blob.vercel-storage.com/foo.jpg')).toBe(false)
  })
})

describe('deleteImage — local /uploads/ paths', () => {
  it('unlinks the local file when it exists', async () => {
    mockExistsSync.mockReturnValue(true)
    const result = await deleteImage('/uploads/products/foo.jpg')
    expect(mockUnlinkSync).toHaveBeenCalledTimes(1)
    expect(mockUnlinkSync.mock.calls[0][0]).toContain('public/uploads/products/foo.jpg')
    expect(result).toBe(true)
  })

  it('returns true (no-op) when the local file does not exist', async () => {
    mockExistsSync.mockReturnValue(false)
    const result = await deleteImage('/uploads/products/missing.jpg')
    expect(mockUnlinkSync).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('returns false when fs.unlinkSync throws', async () => {
    mockExistsSync.mockReturnValue(true)
    mockUnlinkSync.mockImplementationOnce(() => {
      throw new Error('EACCES')
    })
    expect(await deleteImage('/uploads/foo.jpg')).toBe(false)
  })
})

describe('deleteImage — unknown URL patterns', () => {
  it('returns true (no-op) for URLs that match neither pattern', async () => {
    // External URLs (e.g. supplier-hosted images) should be left alone,
    // not crash the delete flow
    const result = await deleteImage('https://example.com/foo.jpg')
    expect(mockDel).not.toHaveBeenCalled()
    expect(mockUnlinkSync).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })
})
