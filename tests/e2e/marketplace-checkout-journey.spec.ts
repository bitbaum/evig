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
  deleteMarketplaceListing,
  fetchMarketplaceOrder,
  isHostedPayrexxUrl,
  isMockPayrexxUrl,
  simulatePayrexxReservedWebhook,
} from './helpers/marketplace'

test.describe('Marketplace dual-persona checkout journey', () => {
  test.setTimeout(180000)

  test.skip(
    !hasDualPersonaCredentials(),
    'Set AUTH_TEST_USER_PASSWORD + AUTH_TEST_ADMIN_PASSWORD (different accounts)',
  )

  test('user lists → admin checkout → Payrexx → both see paid order', async ({ page }) => {
    const seller = getTechnicianCredentials()
    const buyer = getRequesterCredentials()

    let listingId = ''
    let orderId = ''

    try {
      // 1. User (seller) creates listing
      await loginWithCredentials(page, '/dashboard/listings', seller.email, seller.password)
      ;({ listingId } = await createMarketplaceListing(page.request))

      // 2. Admin (buyer) opens checkout
      await loginWithCredentials(
        page,
        `/marketplace/checkout/${listingId}`,
        buyer.email,
        buyer.password,
      )
      await expect(page.getByRole('heading', { name: /Sichere Zahlung/i })).toBeVisible({
        timeout: 15000,
      })

      const payButton = page.getByRole('button', { name: /Weiter zur Zahlung/i })
      await expect(payButton).toBeEnabled()

      const orderResponsePromise = page.waitForResponse(
        res =>
          res.url().includes('/api/marketplace/orders') &&
          res.request().method() === 'POST' &&
          res.status() < 500,
        { timeout: 60_000 },
      )

      await payButton.click()
      const orderResponse = await orderResponsePromise
      const orderBody = (await orderResponse.json()) as {
        success: boolean
        data?: { orderId: string; paymentUrl: string }
        error?: string
      }

      if (!orderBody.success) {
        const payrexxNotReady =
          orderBody.error?.includes('Payrexx') ||
          orderBody.error?.includes('Online-Zahlung')
        if (payrexxNotReady) {
          await expect(
            page.getByRole('alert').filter({ hasText: /Payrexx|Online-Zahlung/i }),
          ).toBeVisible({ timeout: 15_000 })
          await loginWithCredentials(
            page,
            `/marketplace/checkout/${listingId}`,
            seller.email,
            seller.password,
          )
          await expect(page.getByRole('heading', { name: 'Eigenes Inserat' })).toBeVisible({
            timeout: 15_000,
          })
          return
        }
        throw new Error(orderBody.error || 'order create failed')
      }

      orderId = orderBody.data!.orderId
      const paymentUrl = orderBody.data!.paymentUrl

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

      // 6. User cannot buy own listing
      await loginWithCredentials(
        page,
        `/marketplace/checkout/${listingId}`,
        seller.email,
        seller.password,
      )
      await expect(page.getByRole('heading', { name: 'Eigenes Inserat' })).toBeVisible({
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
