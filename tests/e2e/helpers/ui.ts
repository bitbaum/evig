import type { Page } from '@playwright/test'

const CONSENT_KEY = 'cookie_consent'
const CONSENT_VALUE = 'accepted'

/** Prevent the cookie dialog from blocking clicks in E2E. */
export async function prepareE2EPage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('cookie_consent', 'accepted')
    } catch {
      /* ignore */
    }
  })
}

/** Dismiss the essential-cookies banner if it still appears. */
export async function dismissCookieBanner(page: Page): Promise<void> {
  await page.evaluate(
    ([key, value]) => {
      try {
        localStorage.setItem(key, value)
        window.dispatchEvent(new StorageEvent('storage'))
      } catch {
        /* ignore */
      }
    },
    [CONSENT_KEY, CONSENT_VALUE] as const,
  )

  const dialog = page.getByRole('dialog', { name: /Cookie/i })
  if (!(await dialog.isVisible({ timeout: 1000 }).catch(() => false))) return

  await dialog.getByRole('button', { name: /Verstanden|Got it|Accept/i }).click()
  await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => undefined)
}
