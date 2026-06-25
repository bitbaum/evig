/**
 * Staff protocols journey — create → JSON import → review → finalize.
 *
 * Uses POST /process-notes with valid structured_notes JSON (no LLM on prod).
 * Env: AUTH_TEST_ADMIN_*
 * Run: npm run test:e2e:protocols:journey
 */

import { test, expect } from '@playwright/test'
import {
  ADMIN_TEST_EMAIL,
  ADMIN_TEST_PASSWORD,
  USER_TEST_EMAIL,
  USER_TEST_PASSWORD,
  hasDualPersonaCredentials,
  loginWithCredentials,
} from './helpers/auth'
import { expectAdminRouteBlocked } from './helpers/route-smoke'
import {
  PROTOCOL_STATUS,
  buildE2EProtocolTitle,
  buildE2EStructuredNotes,
  createProtocol,
  fetchProtocol,
  finalizeProtocol,
  importProtocolStructuredNotes,
  tryFinalizeProtocol,
} from './helpers/protocols'

test.describe('Admin protocols staff journey', () => {
  test.setTimeout(120000)

  test.skip(!ADMIN_TEST_PASSWORD, 'Set AUTH_TEST_ADMIN_PASSWORD')

  test('admin creates protocol → imports JSON notes → finalizes (API + UI)', async ({
    page,
  }) => {
    const title = buildE2EProtocolTitle()
    const summary =
      'E2E-Zusammenfassung: Teamsitzung automatisch importiert, bereit zur Freigabe.'

    await loginWithCredentials(page, '/admin/protocols', ADMIN_TEST_EMAIL, ADMIN_TEST_PASSWORD)
    await expect(page.getByRole('heading', { name: 'Protokolle', level: 1 })).toBeVisible({
      timeout: 15000,
    })

    const created = await createProtocol(page.request, title)

    let detail = await fetchProtocol(page.request, created.id)
    expect(detail.status).toBe(PROTOCOL_STATUS.DRAFT)

    const blocked = await tryFinalizeProtocol(page.request, created.id)
    expect(blocked.ok).toBe(false)

    const notes = buildE2EStructuredNotes(summary)
    await importProtocolStructuredNotes(page.request, created.id, notes)

    detail = await fetchProtocol(page.request, created.id)
    expect(detail.status).toBe(PROTOCOL_STATUS.REVIEW)
    expect(detail.structured_notes?.summary).toBe(summary)
    expect(detail.structured_notes?.topics).toHaveLength(1)

    await page.goto(`/admin/protocols/${created.id}`)
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('main').getByText('Zur Überprüfung').first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Zusammenfassung' })).toBeVisible()
    await expect(page.getByText(summary)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Protokoll abschliessen' })).toBeVisible()

    await finalizeProtocol(page.request, created.id)

    detail = await fetchProtocol(page.request, created.id)
    expect(detail.status).toBe(PROTOCOL_STATUS.FINALIZED)

    await page.goto(`/admin/protocols/${created.id}`)
    await expect(page.getByRole('main').getByText('Abgeschlossen').first()).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByRole('button', { name: 'Protokoll abschliessen' })).toHaveCount(0)

    if (hasDualPersonaCredentials()) {
      await loginWithCredentials(page, '/dashboard', USER_TEST_EMAIL, USER_TEST_PASSWORD)
      await expectAdminRouteBlocked(page, '/admin/protocols')
    }
  })
})
