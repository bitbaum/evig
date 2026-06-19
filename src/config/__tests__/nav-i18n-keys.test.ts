/**
 * Guard: every nav i18n key the config references must resolve in the
 * canonical (de) locale.
 *
 * Why this exists: nav items carry a German `name` fallback, so a renamed-but-
 * unmapped `nameKey` does NOT crash and does NOT show a raw key — it silently
 * renders the German fallback to *every* locale (a non-German visitor sees
 * German nav labels) while logging MISSING_MESSAGE at runtime. tsc, eslint and
 * the rest of the suite are all blind to it; only the live console showed it.
 *
 * This test reproduces the exact reconciliation that caught that regression
 * (12 broken keys, PR #153) so it can never silently come back: collect every
 * `nameKey`/`descriptionKey` reachable from the navigation config and assert
 * each one exists under `nav.items` in messages/de.json.
 */

import deMessages from '../../../messages/de.json'
import { mainNavigation, type NavigationItem } from '../navigation'
import { buildMarktplatzNavigationItems } from '../customer-journeys'

function collectKeys(items: NavigationItem[], acc: Set<string>): void {
  for (const item of items) {
    if (item.nameKey) acc.add(item.nameKey)
    if (item.descriptionKey) acc.add(item.descriptionKey)
    if (item.subItems?.length) collectKeys(item.subItems, acc)
  }
}

describe('navigation i18n keys', () => {
  it('every nameKey/descriptionKey resolves in the canonical de locale', () => {
    const referenced = new Set<string>()
    collectKeys(mainNavigation, referenced)
    // The marketplace mega-menu is built lazily; include it explicitly in case
    // it is ever detached from mainNavigation's subItems.
    collectKeys(buildMarktplatzNavigationItems(), referenced)

    const navItems = (deMessages as { nav?: { items?: Record<string, string> } }).nav?.items ?? {}
    const missing = [...referenced].filter((k) => !(k in navItems)).sort()

    expect(missing).toEqual([])
  })
})
