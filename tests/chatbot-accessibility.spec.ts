import { test, expect } from '@playwright/test'

test.use({
  baseURL: 'http://localhost:3000',
  viewport: { width: 1280, height: 800 },
  headless: true,
})

test.describe('Chatbot accessibility and i18n', () => {
  test('opens chat and shows localized labels', async ({ page }) => {
    await page.goto('/')

    // Open floating assistant (label localized: "Assistent" (de) or "Assistant" (en))
    await page.getByRole('button', { name: /Assistan/ }).click()

    // Send button should be localized: "Senden" (de) or "Send" (en)
    await expect(page.getByRole('button', { name: /Senden|Send/ })).toBeVisible()

    // Placeholder should include /help hint in either language
    const input = page.locator('input[type="text"]')
    const placeholder = await input.getAttribute('placeholder')
    expect(placeholder).toBeTruthy()
    expect(placeholder!).toMatch(/help|Befehle/)
  })
})

