/**
 * Client-side image downscaling (SSOT for pre-upload compression).
 *
 * Phone photos routinely weigh 3–12 MB. Sent verbatim as a base64 data URL
 * they inflate ~33% in JSON, crawl over mobile uplinks, and blow past the
 * vision providers' per-request image ceilings — which is exactly why photo
 * analysis returned "Analyse fehlgeschlagen". Downscaling to a sane long-edge
 * and re-encoding as JPEG makes the upload small, fast and within provider
 * limits while keeping enough detail for the model to read labels.
 *
 * Browser-only (uses <img> + canvas). On the server, or if the browser cannot
 * decode the file, it returns the original data URL untouched — never throws.
 */

export interface DownscaleOptions {
  /** Longest edge in pixels after scaling. Labels stay legible at ~1600. */
  maxEdge?: number
  /** JPEG quality 0–1 for the first encode pass. */
  quality?: number
  /** Target byte ceiling for the encoded image; quality steps down to meet it. */
  maxBytes?: number
}

const DEFAULTS: Required<DownscaleOptions> = {
  maxEdge: 1600,
  quality: 0.82,
  // ~2.6 MB of base64 ≈ ~1.9 MB binary — comfortably under the vision
  // providers' base64 image limits with headroom for the JSON envelope.
  maxBytes: 2_600_000,
}

/** Approximate decoded byte length of a base64 data URL without allocating it. */
function dataUrlByteLength(dataUrl: string): number {
  const comma = dataUrl.indexOf(',')
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  // 4 base64 chars -> 3 bytes; ignore padding for an estimate.
  return Math.floor((b64.length * 3) / 4)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('decode-failed'))
    img.src = src
  })
}

function readAsDataUrl(input: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('read-failed'))
    reader.readAsDataURL(input)
  })
}

/**
 * Downscale/compress an image to a JPEG data URL.
 *
 * @param input A File/Blob or an existing data-URL string.
 * @returns A JPEG data URL. Falls back to the original data URL if the
 *          environment or file can't be processed — callers can always upload
 *          the result as-is.
 */
export async function downscaleImage(
  input: Blob | string,
  options: DownscaleOptions = {},
): Promise<string> {
  const opts = { ...DEFAULTS, ...options }

  // Normalise to a data URL up front so every return path yields something
  // uploadable, even when canvas/DOM isn't available (SSR, tests).
  let originalDataUrl: string
  try {
    originalDataUrl = typeof input === 'string' ? input : await readAsDataUrl(input)
  } catch {
    // Can't even read it — hand back whatever we were given.
    return typeof input === 'string' ? input : ''
  }

  // Only raster images are downscalable; anything else passes through.
  if (typeof document === 'undefined' || !originalDataUrl.startsWith('data:image/')) {
    return originalDataUrl
  }

  try {
    const img = await loadImage(originalDataUrl)
    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height
    if (!width || !height) return originalDataUrl

    const longest = Math.max(width, height)
    const scale = longest > opts.maxEdge ? opts.maxEdge / longest : 1

    // Nothing to gain: already small and already a JPEG within budget.
    const alreadyJpeg = originalDataUrl.startsWith('data:image/jpeg')
    if (scale === 1 && alreadyJpeg && dataUrlByteLength(originalDataUrl) <= opts.maxBytes) {
      return originalDataUrl
    }

    const targetW = Math.max(1, Math.round(width * scale))
    const targetH = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) return originalDataUrl
    ctx.drawImage(img, 0, 0, targetW, targetH)

    // Encode, then step quality down until under the byte budget (floor 0.5
    // so labels stay readable). Guarantees a bounded upload regardless of
    // how noisy the source photo is.
    let quality = opts.quality
    let out = canvas.toDataURL('image/jpeg', quality)
    while (dataUrlByteLength(out) > opts.maxBytes && quality > 0.5) {
      quality -= 0.12
      out = canvas.toDataURL('image/jpeg', quality)
    }

    // Never return something larger than we started with.
    return dataUrlByteLength(out) < dataUrlByteLength(originalDataUrl) ? out : originalDataUrl
  } catch {
    return originalDataUrl
  }
}
