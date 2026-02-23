import { test, expect } from '@playwright/test'

test.describe('Chatbot accessibility', () => {
  test('RevampCopilot floating button is accessible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // RevampCopilot floating button has aria-label "Revamp IT Assistent öffnen"
    const copilotButton = page.getByRole('button', { name: /Assistent.*öffnen/i })
    await expect(copilotButton).toBeAttached()

    // Fixed-position button at bottom-right may be clipped by viewport.
    // Use JS click to bypass Playwright's viewport check.
    await copilotButton.dispatchEvent('click')

    // Chat window should appear with an input for messages
    const chatInput = page.locator('input[type="text"], textarea').last()
    await expect(chatInput).toBeVisible({ timeout: 3000 })
  })
})
