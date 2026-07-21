/**
 * Tests for downscaleImage — pre-upload image compression.
 *
 * The canvas encode path needs a real browser, so here we lock the safe
 * passthrough guarantees that matter for correctness: a caller can ALWAYS
 * upload whatever comes back, and non-raster / unreadable inputs are never
 * mangled or thrown on.
 */

import { downscaleImage } from '../downscale'

describe('downscaleImage — safe passthrough', () => {
  it('returns a non-image data URL unchanged (nothing to downscale)', async () => {
    const input = 'data:text/plain;base64,aGVsbG8='
    await expect(downscaleImage(input)).resolves.toBe(input)
  })

  it('returns a plain (non data-URL) string unchanged', async () => {
    await expect(downscaleImage('not-a-data-url')).resolves.toBe('not-a-data-url')
  })

  it('never rejects on an unreadable blob — resolves to a usable string', async () => {
    // A Blob whose type is not image/* takes the passthrough branch after the
    // FileReader produces its data URL; the result must be a string.
    const blob = new Blob(['plain text'], { type: 'text/plain' })
    const result = await downscaleImage(blob)
    expect(typeof result).toBe('string')
  })
})
