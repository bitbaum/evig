/**
 * Workshop proposal review journey — user submits, admin approves + rejects.
 *
 * Env: AUTH_TEST_USER_* + AUTH_TEST_ADMIN_*
 * Run: npm run test:e2e:workshops:proposal:journey
 */

import { test, expect } from '@playwright/test'
import {
  getRequesterCredentials,
  getTechnicianCredentials,
  hasDualPersonaCredentials,
  loginWithCredentials,
} from './helpers/auth'
import {
  fetchWorkshopProposalAdmin,
  reviewWorkshopProposal,
  submitWorkshopProposal,
} from './helpers/workshop-proposals'

test.describe('Workshop proposal dual-persona journey', () => {
  test.setTimeout(180000)

  test.skip(
    !hasDualPersonaCredentials(),
    'Set AUTH_TEST_USER_PASSWORD + AUTH_TEST_ADMIN_PASSWORD (different accounts)',
  )

  test('user proposes → admin reviews detail → approve + reject', async ({ page }) => {
    const user = getTechnicianCredentials()
    const admin = getRequesterCredentials()

    let approveId = ''
    let rejectId = ''
    let approveTitle = ''

    try {
      await loginWithCredentials(page, '/workshops/propose', user.email, user.password)
      ;({ proposalId: approveId, title: approveTitle } = await submitWorkshopProposal(
        page.request,
      ))
      ;({ proposalId: rejectId } = await submitWorkshopProposal(page.request, {
        title: `${approveTitle} (Reject)`,
      }))

      await loginWithCredentials(
        page,
        `/admin/workshops/proposals/${approveId}`,
        admin.email,
        admin.password,
      )
      await expect(page.getByRole('heading', { name: approveTitle })).toBeVisible({
        timeout: 15_000,
      })
      await expect(page.getByText(/pending|ausstehend/i).first()).toBeVisible({
        timeout: 15_000,
      })

      await reviewWorkshopProposal(page.request, approveId, 'approve', 'E2E genehmigt')
      let proposal = await fetchWorkshopProposalAdmin(page.request, approveId)
      expect(proposal.status).toBe('approved')

      await page.reload()
      await expect(page.getByText(/Genehmigt|approved/i).first()).toBeVisible({
        timeout: 15_000,
      })

      await loginWithCredentials(page, '/admin/workshops', admin.email, admin.password)
      await expect(page.getByText(approveTitle).first()).toBeVisible({ timeout: 15_000 })

      await reviewWorkshopProposal(
        page.request,
        rejectId,
        'reject',
        'E2E Test — automatisch abgelehnt',
      )
      proposal = await fetchWorkshopProposalAdmin(page.request, rejectId)
      expect(proposal.status).toBe('rejected')

      await loginWithCredentials(page, '/dashboard', user.email, user.password)
      await page.goto('/dashboard/workshops')
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 15_000 })
    } finally {
      /* Approved workshop remains on prod — intentional smoke artifact */
    }
  })
})
