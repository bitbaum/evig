/**
 * @jest-environment node
 */

/**
 * Image upload tests — Hetzner Object Storage (S3) with a dev local-fs fallback.
 *
 * The S3 SDK and `fs` are mocked so the tests never touch the network or disk.
 */

const mockSend = jest.fn()

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(() => ({ send: mockSend })),
  PutObjectCommand: jest.fn((input: unknown) => ({ __cmd: 'put', input })),
  DeleteObjectCommand: jest.fn((input: unknown) => ({ __cmd: 'delete', input })),
}))

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}))

import {
  uploadImage,
  deleteImage,
  generateImageFilename,
  isStorageConfigured,
} from '../image-upload'

const S3_ENV = {
  S3_ENDPOINT: 'https://fsn1.example.com',
  S3_REGION: 'fsn1',
  S3_BUCKET: 'revampit-media',
  S3_ACCESS_KEY_ID: 'key',
  S3_SECRET_ACCESS_KEY: 'secret',
  S3_PUBLIC_URL: 'https://media.example.com',
} as const

function setS3Env() {
  Object.assign(process.env, S3_ENV)
}
function clearS3Env() {
  for (const k of Object.keys(S3_ENV)) delete process.env[k]
}

const SAMPLE = 'data:image/png;base64,iVBORw0KGgo='

describe('image-upload', () => {
  beforeEach(() => {
    mockSend.mockReset()
    mockSend.mockResolvedValue({})
    clearS3Env()
  })

  describe('generateImageFilename', () => {
    it('returns <uuid>.jpg for the primary image', () => {
      expect(generateImageFilename('I-260101-0001')).toBe('I-260101-0001.jpg')
    })
    it('appends _<n> for additional images', () => {
      expect(generateImageFilename('I-260101-0001', 2)).toBe('I-260101-0001_2.jpg')
    })
  })

  describe('isStorageConfigured', () => {
    it('is false without S3 env', () => {
      expect(isStorageConfigured()).toBe(false)
    })
    it('is true with the full S3 env', () => {
      setS3Env()
      expect(isStorageConfigured()).toBe(true)
    })
  })

  describe('uploadImage', () => {
    it('uploads to S3 and returns the public URL when configured', async () => {
      setS3Env()
      const res = await uploadImage(SAMPLE, 'x.jpg', 'products')
      expect(res.success).toBe(true)
      expect(res.url).toBe('https://media.example.com/products/x.jpg')
      expect(mockSend).toHaveBeenCalledTimes(1)
    })

    it('falls back to local filesystem in dev when S3 is not configured', async () => {
      const res = await uploadImage(SAMPLE, 'x.jpg', 'products')
      expect(res.success).toBe(true)
      expect(res.url).toBe('/uploads/products/x.jpg')
      expect(mockSend).not.toHaveBeenCalled()
    })
  })

  describe('deleteImage', () => {
    it('deletes an S3 object addressed by its public URL', async () => {
      setS3Env()
      const ok = await deleteImage('https://media.example.com/products/x.jpg')
      expect(ok).toBe(true)
      expect(mockSend).toHaveBeenCalledTimes(1)
    })
    it('ignores unknown URLs gracefully', async () => {
      const ok = await deleteImage('https://somewhere-else.example/x.jpg')
      expect(ok).toBe(true)
      expect(mockSend).not.toHaveBeenCalled()
    })
  })
})
