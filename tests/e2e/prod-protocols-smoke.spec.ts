/**
 * Prod protocols smoke — full audio pipeline against a LIVE deployment.
 *
 * Drives the real browser flow an admin uses: log in, upload a spoken-audio
 * fixture on /admin/protocols/new, submit, wait for transcription (Groq,
 * chunked via ffmpeg for >24 MB files) + AI structuring, assert the protocol
 * reaches review with a summary, then delete it again (cleanup).
 *
 * NOT part of the local CI journey suite (name lacks `journey`). Run via the
 * "Prod protocols smoke" GitHub workflow (workflow_dispatch), which generates
 * the speech fixtures with espeak-ng + ffmpeg and supplies credentials.
 *
 * Required env:
 *   PROTOCOLS_SMOKE_AUDIO      — comma-separated audio fixture paths
 *   AUTH_TEST_ADMIN_PASSWORD   — staff account password
 *   PLAYWRIGHT_BASE_URL        — target deployment
 * If any are missing every test skips (safe under `npx playwright test tests/`).
 */

import { test, expect, type Page } from '@playwright/test'
import path from 'node:path'
import fs from 'node:fs'
import { loginWithCredentials, ADMIN_TEST_EMAIL, ADMIN_TEST_PASSWORD } from './helpers/auth'

const fixtures = (process.env.PROTOCOLS_SMOKE_AUDIO || '')
  .split(',')
  .map((p) => p.trim())
  .filter(Boolean)

const configured = fixtures.length > 0 && Boolean(ADMIN_TEST_PASSWORD)

// Upload + transcode + chunked transcription + AI structuring for a long
// recording legitimately takes minutes.
const PIPELINE_TIMEOUT_MS = 8 * 60 * 1000

async function deleteProtocolViaUi(page: Page) {
  await page.getByRole('button', { name: 'Löschen' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Löschen' }).click()
  await page.waitForURL(/\/admin\/protocols(\?|$)/, { timeout: 60_000 })
}

test.describe('prod protocols smoke — audio pipeline', () => {
  test.skip(!configured, 'Set PROTOCOLS_SMOKE_AUDIO and AUTH_TEST_ADMIN_PASSWORD to run')

  for (const fixture of fixtures) {
    const label = path.basename(fixture)

    test(`audio → transcript → review → delete (${label})`, async ({ page }) => {
      test.setTimeout(PIPELINE_TIMEOUT_MS + 120_000)
      const sizeMb = (fs.statSync(fixture).size / (1024 * 1024)).toFixed(1)

      await loginWithCredentials(page, '/admin/protocols/new', ADMIN_TEST_EMAIL, ADMIN_TEST_PASSWORD)

      // Traceable title so any leftover row is clearly test data.
      await page.getByRole('button', { name: /Sitzungsdetails/ }).click()
      await page.locator('#title').fill(`E2E Smoke ${label} ${Date.now()}`)

      // Drop the audio into the (hidden) SourceUploader input; chip appears.
      await page.locator('input[type="file"][multiple]').setInputFiles(fixture)
      await expect(page.getByText(label)).toBeVisible()

      await page.getByRole('button', { name: /Protokoll erstellen/ }).click()

      // The create page redirects to the detail page when processing finishes
      // (with ?processing=failed appended when it did not).
      await page.waitForURL(/\/admin\/protocols\/[0-9a-f-]{36}/, { timeout: PIPELINE_TIMEOUT_MS })

      if (page.url().includes('processing=failed')) {
        // Leave the row visible for diagnosis, but fail loudly with the reason.
        const reason = new URL(page.url()).searchParams.get('error') || 'unbekannt'
        throw new Error(`Processing failed for ${label} (${sizeMb} MB): ${reason}`)
      }

      // Review state with real structured output.
      await expect(page.getByText('Zur Überprüfung').first()).toBeVisible({ timeout: 30_000 })
      await expect(page.getByRole('heading', { name: 'Zusammenfassung' })).toBeVisible()

      await deleteProtocolViaUi(page)
    })
  }
})
