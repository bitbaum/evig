/**
 * Marketplace checkout journey — dual-persona (user seller + admin buyer).
 *
 * Env: AUTH_TEST_USER_* (seller) + AUTH_TEST_ADMIN_* (buyer).
 * Optional: PAYREXX_WEBHOOK_SECRET — simulates Payrexx reserved webhook on prod.
 *
 * Run: npm run test:e2e:marketplace:journey
 */

import { test, expect } from '@playwright/test'
import {
  getRequesterCredentials,
  getTechnicianCredentials,
  hasDualPersonaCredentials,
  loginWithCredentials,
} from './helpers/auth'
import {
  cancelMarketplaceOrder,
  createMarketplaceListing,
  createMarketplaceOrder,
  deleteMarketplaceListing,
  fetchMarketplaceOrder,
  askListingQuestion,
  answerListingQuestion,
  fetchListingQuestions,
  isHostedPayrexxUrl,
  isMockPayrexxUrl,
  simulatePayrexxReservedWebhook,
} from './helpers/marketplace'
import { prepareE2EPage } from './helpers/ui'

test.describe('Marketplace dual-persona checkout journey', () => {
  test.setTimeout(180000)

  test.skip(
    !hasDualPersonaCredentials(),
    'Set AUTH_TEST_USER_PASSWORD + AUTH_TEST_ADMIN_PASSWORD (different accounts)',
  )

  test('user lists → admin checkout → Payrexx → both see paid order', async ({ page }) => {
    await prepareE2EPage(page)

    const seller = getTechnicianCredentials()
    const buyer = getRequesterCredentials()

    let listingId = ''
    let orderId = ''

    try {
      // 1. User (seller) creates listing
      await loginWithCredentials(page, '/dashboard/listings', seller.email, seller.password)
      ;({ listingId } = await createMarketplaceListing(page.request))

      // 2. Admin (buyer) sees buy CTA on listing detail
      await loginWithCredentials(
        page,
        `/marketplace/${listingId}`,
        buyer.email,
        buyer.password,
      )
      const buyNow = page.getByRole('button', { name: /Jetzt kaufen|Buy now/i })
      await expect(buyNow).toBeVisible({ timeout: 15000 })
      await buyNow.click()
      await page.waitForURL(new RegExp(`/marketplace/checkout/${listingId}`), {
        timeout: 15000,
      })

      // 2b. Public Q&A — buyer asks, seller answers
      await loginWithCredentials(
        page,
        `/marketplace/${listingId}`,
        buyer.email,
        buyer.password,
      )
      await page.getByRole('button', { name: /Frage stellen|Ask a question/i }).click()
      const testQuestion = 'Ist das Gerät noch verfügbar für Abholung?'
      await page.getByPlaceholder(/Akku|battery|included/i).fill(testQuestion)
      await page.getByRole('button', { name: /Frage senden|Send question/i }).click()
      await expect(page.getByText(testQuestion)).toBeVisible({ timeout: 15000 })

      const questionsBeforeAnswer = await fetchListingQuestions(page.request, listingId)
      const openQuestion = questionsBeforeAnswer.find((q) => q.question === testQuestion)
      expect(openQuestion?.status).toBe('open')

      await loginWithCredentials(
        page,
        `/marketplace/${listingId}`,
        seller.email,
        seller.password,
      )
      const testAnswer = 'Ja, Abholung in Zürich ist jederzeit möglich.'
      const answerField = page.getByPlaceholder(/öffentliche Antwort|public answer/i)
      await answerField.fill(testAnswer)
      const publishAnswer = page.getByRole('button', { name: /Antwort veröffentlichen|Publish answer/i })
      await expect(publishAnswer).toBeEnabled({ timeout: 5000 })
      await publishAnswer.click()
      await expect(page.getByText(testAnswer)).toBeVisible({ timeout: 15000 })

      const questionsAfterAnswer = await fetchListingQuestions(page.request, listingId)
      expect(questionsAfterAnswer.find((q) => q.question === testQuestion)?.status).toBe('answered')

      // 2c. Seller cannot buy own listing (must run while listing is still active)
      await loginWithCredentials(
        page,
        `/marketplace/checkout/${listingId}`,
        seller.email,
        seller.password,
      )
      await expect(page.getByRole('heading', { name: /Eigenes Inserat|Own listing/i })).toBeVisible({
        timeout: 15_000,
      })

      // 3. Admin (buyer) opens checkout (direct URL after buy CTA smoke)
      await loginWithCredentials(
        page,
        `/marketplace/checkout/${listingId}`,
        buyer.email,
        buyer.password,
      )
      await expect(page.getByRole('heading', { name: /Sichere Zahlung/i })).toBeVisible({
        timeout: 15000,
      })

      // Order create via API (same contract as checkout UI); page load confirms checkout route.
      const { orderId: createdOrderId, paymentUrl } = await createMarketplaceOrder(
        page.request,
        listingId,
      )
      orderId = createdOrderId

      let order = await fetchMarketplaceOrder(page.request, orderId)
      expect(order.status).toBe('pending_payment')

      // 3. Complete payment — mock page, webhook simulation, or gateway smoke
      if (isMockPayrexxUrl(paymentUrl)) {
        await page.goto(paymentUrl)
        await page.getByRole('button', { name: 'Jetzt bezahlen' }).click()
        await page.waitForURL(/\/marketplace\/checkout\/success/, { timeout: 60_000 })
        await expect(page.getByRole('heading', { name: /Bestellung erfolgreich/i })).toBeVisible({
          timeout: 15_000,
        })
      } else if (process.env.PAYREXX_WEBHOOK_SECRET) {
        await simulatePayrexxReservedWebhook(page.request, orderId, 100)
        await page.goto(`/marketplace/checkout/success?orderId=${orderId}`)
        await expect(page.getByRole('heading', { name: /Bestellung erfolgreich/i })).toBeVisible({
          timeout: 15_000,
        })
      } else if (isHostedPayrexxUrl(paymentUrl)) {
        await page.goto(paymentUrl)
        await expect(page).toHaveURL(/payrexx/i, { timeout: 30_000 })
        order = await fetchMarketplaceOrder(page.request, orderId)
        expect(order.status).toBe('pending_payment')
        await cancelMarketplaceOrder(page.request, orderId)
        orderId = ''
        return
      } else {
        throw new Error(`Unexpected payment URL: ${paymentUrl}`)
      }

      order = await fetchMarketplaceOrder(page.request, orderId)
      expect(order.status).toBe('paid')

      // 4. Buyer sees order
      await loginWithCredentials(page, '/dashboard/orders', buyer.email, buyer.password)
      await expect(page.getByText(/Bestellung|Order|pending|Bezahlt|paid/i).first()).toBeVisible({
        timeout: 15_000,
      })

      // 5. Seller sees order
      await loginWithCredentials(page, '/dashboard/seller', seller.email, seller.password)
      await expect(page.locator('body')).toContainText(/Bestellung|Order|Verkauf|paid|Bezahlt/i, {
        timeout: 15_000,
      })
    } finally {
      if (orderId) {
        try {
          const status = (await fetchMarketplaceOrder(page.request, orderId)).status
          if (status === 'pending_payment' || status === 'paid') {
            await cancelMarketplaceOrder(page.request, orderId)
          }
        } catch {
          /* best-effort cleanup */
        }
      }
      if (listingId) {
        try {
          await deleteMarketplaceListing(page.request, listingId)
        } catch {
          /* listing may stay reserved until order cancelled */
        }
      }
    }
  })
})
