/**
 * Every navigation link must actually go somewhere.
 *
 * Two nav entries shipped for months with `href=""`, because they read from
 * `EXTERNAL_LINKS.shopware` and `EXTERNAL_LINKS.wiki` — both empty strings for
 * an org that has neither a Shopware storefront nor a wiki. Neither
 * `MegaMenuContent` nor `MobileMenuNav` filters empty hrefs, so they rendered
 * as `<a href="" target="_blank">`: the first item of the Marktplatz menu, and
 * one of four items under Lernen, each opening a blank duplicate of the
 * current page in a new tab.
 *
 * Nothing could catch that. It is not a missing key (the labels exist), not a
 * broken route (there is no route), and not a type error (`''` is a valid
 * string). Only opening the menu and clicking would reveal it — which is why
 * it survived a rebrand and several audits.
 *
 * This is the gate for that class. It runs against the real exported tree, so
 * it also covers the derived builders (`buildServicesNavigationItems`,
 * `buildMarktplatzNavigationItems`) — an empty href reintroduced through
 * SERVICE_CONFIGS or CUSTOMER_JOURNEYS fails here too.
 */

import { mainNavigation, type NavigationItem } from '@/config/navigation'

/** Flatten the tree so sub-items are checked alongside their parents. */
function allItems(items: readonly NavigationItem[]): NavigationItem[] {
  return items.flatMap((item) => [item, ...allItems(item.subItems ?? [])])
}

const label = (i: NavigationItem) => i.nameKey ?? i.name

describe('navigation links resolve', () => {
  const items = allItems(mainNavigation)

  it('sweeps a non-trivial tree', () => {
    // A sweep over an empty tree passes trivially. Fail loudly instead.
    expect(items.length).toBeGreaterThan(15)
  })

  it('every href is present and non-empty', () => {
    const empty = items
      .filter((i) => typeof i.href !== 'string' || i.href.trim() === '')
      .map((i) => `${label(i)} → renders as <a href="">, which goes nowhere`)
    expect(empty).toEqual([])
  })

  it('every href is an internal path or an absolute URL', () => {
    const malformed = items
      .filter((i) => typeof i.href === 'string' && i.href.trim() !== '')
      .filter((i) => !/^(\/|https?:\/\/)/.test(i.href))
      .map((i) => `${label(i)} → "${i.href}" is neither an internal path nor an absolute URL`)
    expect(malformed).toEqual([])
  })

  it('nothing marked external points at an internal path', () => {
    const wrong = items
      .filter((i) => i.external && i.href.startsWith('/'))
      .map((i) => `${label(i)} → ${i.href} is marked external but is internal`)
    expect(wrong).toEqual([])
  })
})
