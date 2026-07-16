/**
 * Staff CMS journey — blog draft → publish → public view.
 *
 * Env: AUTH_TEST_ADMIN_*
 * Run: npm run test:e2e:cms:journey
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
  buildE2EBlogContent,
  buildE2EBlogSlug,
  buildE2EBlogTitle,
  createBlogDraft,
  fetchBlogPost,
  publishBlogPost,
} from './helpers/cms'

test.describe('Admin CMS staff journey', () => {
  test.setTimeout(120000)

  test.skip(!ADMIN_TEST_PASSWORD, 'Set AUTH_TEST_ADMIN_PASSWORD')

  test('admin creates blog draft → publishes → visible on public blog (API + UI)', async ({
    page,
  }) => {
    const title = buildE2EBlogTitle()
    const slug = buildE2EBlogSlug()
    const content = buildE2EBlogContent()

    await loginWithCredentials(page, '/admin/content/blog', ADMIN_TEST_EMAIL, ADMIN_TEST_PASSWORD)
    await expect(page.getByRole('heading', { name: 'Blog-Artikel', level: 1 })).toBeVisible({
      timeout: 15000,
    })

    const created = await createBlogDraft(page.request, title, slug, content)
    expect(created.slug).toBe(slug)

    let post = await fetchBlogPost(page.request, created.id)
    expect(post.is_published).toBe(false)
    expect(post.title).toBe(title)
    expect(post.content).toBe(content)

    await page.goto(`/admin/content/blog/${created.id}`)
    await expect(page.getByRole('heading', { name: 'Artikel bearbeiten', level: 1 })).toBeVisible({
      timeout: 15000,
    })
    await expect(page.getByPlaceholder('Titel des Artikels')).toHaveValue(title)
    await expect(page.getByRole('button', { name: 'Veröffentlichen' })).toBeVisible()

    await publishBlogPost(page.request, created.id)

    post = await fetchBlogPost(page.request, created.id)
    expect(post.is_published).toBe(true)
    expect(post.published_at).toBeTruthy()

    await page.goto(`/admin/content/blog/${created.id}`)
    await expect(page.getByRole('main').getByText('Veröffentlicht').first()).toBeVisible({
      timeout: 15000,
    })

    await page.goto(`/blog/${slug}`)
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible({
      timeout: 15000,
    })
    // .first(): the body text can also appear in the excerpt/teaser block.
    await expect(page.getByText(content).first()).toBeVisible()

    if (hasDualPersonaCredentials()) {
      await loginWithCredentials(page, '/dashboard', USER_TEST_EMAIL, USER_TEST_PASSWORD)
      await expectAdminRouteBlocked(page, '/admin/content/blog')
    }
  })
})
