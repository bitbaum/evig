/**
 * @jest-environment node
 *
 * Tests for POST /api/uploads (withAuth)
 *
 * Behaviors locked:
 *   POST - 401, 400 (no files), 400 (invalid type), 200 (success)
 */

const mockAuth = jest.fn()

jest.mock('@/auth', () => ({
  auth: (...args: unknown[]) => mockAuth.apply(null, args),
}))

jest.mock('@/lib/api/middleware', () => ({
  withAuth: (handler: unknown) =>
    (req: Request, context?: { params?: Promise<unknown> }) =>
      mockAuth().then(async (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const { NextResponse } = jest.requireActual('next/server')
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }
        const resolvedContext = context?.params ? { params: await context.params } : undefined
        return (handler as (...a: unknown[]) => unknown)(req, session, resolvedContext)
      }),
}))

const mockUploadImageBuffer = jest.fn()

jest.mock('@/lib/storage/image-upload', () => ({
  uploadImageBuffer: (...args: unknown[]) => mockUploadImageBuffer(...args),
}))

// Mock sharp
jest.mock('sharp', () => {
  const chain = {
    metadata: jest.fn().mockResolvedValue({ format: 'jpeg' }),
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('optimized')),
  }
  return jest.fn().mockReturnValue(chain)
})

// Mock path.join to return predictable paths
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  join: (...args: string[]) => args.join('/'),
  extname: (filename: string) => {
    const parts = filename.split('.')
    return parts.length > 1 ? '.' + parts[parts.length - 1] : ''
  },
  basename: (filename: string, ext?: string) => {
    const base = filename.split('/').pop() || filename
    return ext ? base.replace(ext, '') : base
  },
}))

jest.mock('@/lib/api/helpers', () => {
  const { NextResponse } = jest.requireActual('next/server')
  return {
    apiSuccess: (data: unknown, status = 200) => NextResponse.json({ success: true, data }, { status }),
    apiError: (_err: unknown, msg: string, status = 500) => NextResponse.json({ success: false, error: msg }, { status }),
    apiBadRequest: (msg: string, details?: unknown) => NextResponse.json({ success: false, error: msg, details }, { status: 400 }),
  }
})

jest.mock('@/lib/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}))

jest.mock('@/config/error-messages', () => ({
  ERROR_MESSAGES: { INTERNAL_SERVER_ERROR: 'Server error' },
}))

jest.mock('@/config/limits', () => ({
  FILE_SIZE_LIMITS: { UPLOAD_MAX: 10 * 1024 * 1024 }, // 10MB
}))

jest.mock('@/config/marketplace', () => ({
  MARKETPLACE_LIMITS: { MAX_IMAGES: 8 },
}))

import { NextRequest } from 'next/server'
import { POST } from '../route'

const MOCK_SESSION = {
  user: { id: 'user-1', email: 'user@example.com', name: 'Test User', isStaff: false, staffPermissions: [] as string[] },
  expires: '2027-01-01',
}

function makeJpegFile(name = 'photo.jpg'): File {
  const content = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]) // JPEG magic bytes
  return new File([content], name, { type: 'image/jpeg' })
}

function makePngFile(name = 'image.png'): File {
  const content = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
  return new File([content], name, { type: 'image/png' })
}

function makeRequest(formData: FormData): NextRequest {
  return new NextRequest('http://localhost/api/uploads', {
    method: 'POST',
    body: formData,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue(MOCK_SESSION)
  mockUploadImageBuffer.mockImplementation((_buffer: Buffer, filename: string, folder: string) =>
    Promise.resolve({ success: true, url: `https://media.example/${folder}/${filename}` }),
  )
})

describe('POST /api/uploads — unauthenticated', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null)
    const formData = new FormData()
    const res = await POST(makeRequest(formData))
    expect(res.status).toBe(401)
  })
})

describe('POST /api/uploads — validation', () => {
  it('returns 400 when no files are uploaded', async () => {
    const formData = new FormData()
    // Add a non-file field
    formData.append('field', 'value')
    const res = await POST(makeRequest(formData))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Keine Dateien hochgeladen')
  })

  it('returns 400 when file type is not allowed', async () => {
    const badFile = new File(['<script>alert(1)</script>'], 'evil.svg', { type: 'image/svg+xml' })
    const formData = new FormData()
    formData.append('files', badFile)
    const res = await POST(makeRequest(formData))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Nur JPEG, PNG, WebP und GIF sind erlaubt')
  })

  it('returns 400 for double extension filenames', async () => {
    const badFile = new File(['data'], 'file.jpg.exe', { type: 'image/jpeg' })
    const formData = new FormData()
    formData.append('files', badFile)
    const res = await POST(makeRequest(formData))
    expect(res.status).toBe(400)
  })

  it('returns 400 when more than 8 files are uploaded', async () => {
    const formData = new FormData()
    for (let i = 0; i < 9; i++) {
      formData.append('files', makeJpegFile(`photo${i}.jpg`))
    }
    const res = await POST(makeRequest(formData))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Maximal 8 Bilder erlaubt')
  })
})

describe('POST /api/uploads — success', () => {
  it('returns 200 with URLs for uploaded images', async () => {
    const formData = new FormData()
    formData.append('files', makeJpegFile('photo.jpg'))

    const res = await POST(makeRequest(formData))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.urls).toHaveLength(1)
    expect(body.data.images).toHaveLength(1)
    expect(body.data.images[0]).toHaveProperty('original')
    expect(body.data.images[0]).toHaveProperty('thumbnail')
    expect(body.data.images[0]).toHaveProperty('medium')
    expect(body.data.urls[0]).toMatch(/^https:\/\/media\.example\/users\/user-1\//)
    expect(mockUploadImageBuffer).toHaveBeenCalledTimes(3)
  })

  it('returns 200 with multiple uploaded files', async () => {
    const formData = new FormData()
    formData.append('file1', makeJpegFile('photo1.jpg'))
    formData.append('file2', makePngFile('image2.png'))

    const res = await POST(makeRequest(formData))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.urls).toHaveLength(2)
    expect(body.data.images).toHaveLength(2)
  })
})
