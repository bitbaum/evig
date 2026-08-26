/**
 * Locks the SSOT contract: both service menus are derived from
 * SERVICE_CONFIGS and cannot drift from the actual service pages.
 *
 * The `navGroup` half of this exists because placement drifted for real. Linux
 * and the open-source registry belong under Lernen — they are teaching
 * material — but they are also services with a `/services/*` page, so a first
 * attempt hardcoded them into the Lernen menu while SERVICE_CONFIGS still fed
 * them to Dienstleistungen. One item, two menus, two lists to keep in step.
 * The last test below is the one that would have caught it.
 */
import {
  buildServicesNavigationItems,
  buildLearnServiceNavigationItems,
} from '@/config/services-nav'
import { SERVICE_CONFIGS } from '@/app/[locale]/services/data'

describe('service navigation is derived from SERVICE_CONFIGS', () => {
  const serviceItems = buildServicesNavigationItems()
  const serviceLinks = serviceItems.filter((it) => !it.isSection)
  const learnLinks = buildLearnServiceNavigationItems()
  const allLinks = [...serviceLinks, ...learnLinks]

  it('sweeps a non-empty catalogue', () => {
    // A sweep over zero services passes every assertion below trivially.
    expect(SERVICE_CONFIGS.length).toBeGreaterThan(2)
    expect(allLinks.length).toBeGreaterThan(2)
  })

  it('lists exactly the available services, each in its declared group', () => {
    const expected = (group: string) =>
      SERVICE_CONFIGS.filter((s) => s.available && s.navGroup === group)
        .map((s) => s.key)
        .sort()

    expect(serviceLinks.map((it) => it.nameKey).sort()).toEqual(expected('services'))
    expect(learnLinks.map((it) => it.nameKey).sort()).toEqual(expected('learn'))
  })

  it('derives every href from SERVICE_CONFIGS (no hardcoded paths)', () => {
    const hrefByKey = new Map(SERVICE_CONFIGS.map((s) => [s.key, s.href]))
    for (const link of allLinks) {
      expect(link.href).toBe(hrefByKey.get(link.nameKey!))
    }
  })

  it('omits unavailable services from both menus', () => {
    const unavailable = SERVICE_CONFIGS.filter((s) => !s.available).map((s) => s.key)
    for (const key of unavailable) {
      expect(allLinks.some((it) => it.nameKey === key)).toBe(false)
    }
  })

  it('pairs each link with a matching description key', () => {
    for (const link of allLinks) {
      expect(link.descriptionKey).toBe(`${link.nameKey}Desc`)
    }
  })

  /**
   * The drift guard. A service belongs to exactly one menu — never both (two
   * lists to maintain, which is how it broke) and never neither (a page with
   * no way in).
   */
  it('puts every available service in exactly one menu', () => {
    const counts = new Map<string, number>()
    for (const link of allLinks) {
      counts.set(link.nameKey!, (counts.get(link.nameKey!) ?? 0) + 1)
    }

    const misplaced = SERVICE_CONFIGS.filter((s) => s.available)
      .map((s) => ({ key: s.key, seen: counts.get(s.key) ?? 0 }))
      .filter((s) => s.seen !== 1)
      .map((s) => `${s.key} appears in ${s.seen} menus (expected exactly 1)`)

    expect(misplaced).toEqual([])
  })
})
