/**
 * Streaming multipart parser for large uploads.
 *
 * WHY NOT request.formData(): Next's undici-based parser fails with
 * "TypeError: Failed to parse body as FormData." for bodies above ~10 MB
 * (verified empirically against Next 16 in dev AND prod, 2026-07-16) — which
 * silently capped protocol audio uploads far below the documented 250 MB
 * limit. busboy parses the same multipart stream without that ceiling.
 *
 * Scope: only routes that accept big files need this; small-form routes can
 * keep using request.formData().
 */

import Busboy from 'busboy'
import { Readable } from 'node:stream'
import { FILE_SIZE_LIMITS } from '@/config/limits'

export interface ParsedMultipartFile {
  /** Form field name the file was sent under (e.g. 'audio', 'textFile'). */
  field: string
  file: File
}

export interface ParsedMultipart {
  /** Text fields; repeated names accumulate in order. */
  fields: Record<string, string[]>
  files: ParsedMultipartFile[]
}

export class MultipartLimitError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MultipartLimitError'
  }
}

/**
 * Parse a multipart/form-data request by streaming it through busboy.
 * Files are buffered in memory (same behavior request.formData() had) and
 * returned as standard File objects so downstream code is unchanged.
 *
 * @throws MultipartLimitError when a file exceeds maxFileBytes
 * @throws Error when the body is missing or not multipart
 */
export async function parseMultipart(
  request: Request,
  opts?: { maxFileBytes?: number },
): Promise<ParsedMultipart> {
  const contentType = request.headers.get('content-type') || ''
  if (!contentType.includes('multipart/form-data')) {
    throw new Error(`Expected multipart/form-data, got: ${contentType || 'no content-type'}`)
  }
  if (!request.body) {
    throw new Error('Request has no body')
  }

  const maxFileBytes = opts?.maxFileBytes ?? FILE_SIZE_LIMITS.AUDIO_MAX

  const fields: Record<string, string[]> = {}
  const files: ParsedMultipartFile[] = []

  const busboy = Busboy({
    headers: { 'content-type': contentType },
    limits: { fileSize: maxFileBytes },
  })

  const done = new Promise<void>((resolve, reject) => {
    busboy.on('field', (name, value) => {
      ;(fields[name] ??= []).push(value)
    })

    busboy.on('file', (name, stream, info) => {
      const chunks: Buffer[] = []
      stream.on('data', (chunk: Buffer) => chunks.push(chunk))
      stream.on('limit', () => {
        const maxMb = Math.round(maxFileBytes / (1024 * 1024))
        reject(new MultipartLimitError(`Datei zu gross (maximal ${maxMb} MB): ${info.filename}`))
        stream.resume()
      })
      stream.on('end', () => {
        files.push({
          field: name,
          file: new File([new Uint8Array(Buffer.concat(chunks))], info.filename || 'upload.bin', {
            type: info.mimeType || 'application/octet-stream',
          }),
        })
      })
      stream.on('error', reject)
    })

    busboy.on('error', reject)
    busboy.on('finish', resolve)
  })

  // Web ReadableStream → Node stream → busboy. The cast bridges the DOM vs
  // node:stream/web ReadableStream type mismatch; at runtime they're the same.
  Readable.fromWeb(request.body as import('node:stream/web').ReadableStream<Uint8Array>).pipe(busboy)

  await done

  return { fields, files }
}
