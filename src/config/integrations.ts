/**
 * Third-party service endpoints used by RevampIT.
 *
 * SSOT for any external URL we hit from app code — avoids hard-coded
 * service hostnames scattered across components. If we ever switch
 * providers (e.g. self-host a QR image generator) it's a one-line edit.
 */

/** QR-code image generator. Defaults to goqr.me's free API; can be
 *  pointed at a self-hosted instance via NEXT_PUBLIC_QR_BASE_URL. */
export const QR_IMAGE_BASE_URL =
  process.env.NEXT_PUBLIC_QR_BASE_URL ?? 'https://api.qrserver.com/v1/create-qr-code/'

/** Default foreground colour for generated QR codes (hex without the
 *  '#', as required by the goqr API). Mirrors globals.css
 *  --primitive-green-600 — visual consistency is intentional; the
 *  service does not accept CSS-var names so a hex is unavoidable here. */
export const QR_FG_COLOR = '16a34a'
export const QR_BG_COLOR = 'ffffff'

/**
 * Build the image URL for a QR code encoding `data`.
 * Used by the products factsheet (printable sales label) and could be
 * reused for other A4-print artefacts in the future.
 */
export function buildQrImageUrl(data: string, size = 200): string {
  const url = new URL(QR_IMAGE_BASE_URL)
  url.searchParams.set('size', `${size}x${size}`)
  url.searchParams.set('data', data)
  url.searchParams.set('bgcolor', QR_BG_COLOR)
  url.searchParams.set('color', QR_FG_COLOR)
  return url.toString()
}
