/**
 * Locks the SSOT contract: the services mega-menu is derived from
 * SERVICE_CONFIGS and cannot drift from the actual service pages.
 */
import { buildServicesNavigationItems } from '@/config/services-nav'
import { SERVICE_CONFIGS } from '@/app/[locale]/services/data'

describe('buildServicesNavigationItems', () => {
  const items = buildServicesNavigationItems()
  const links = items.filter((it) => !it.isSection)

  it('lists exactly the available, non-soon services', () => {
    const expected = SERVICE_CONFIGS
      .filter((s) => s.available && s.categoryKey !== 'soon')
      .map((s) => s.key)
      .sort()
    expect(links.map((it) => it.nameKey).sort()).toEqual(expected)
  })

  it('derives every href from SERVICE_CONFIGS (no hardcoded paths)', () => {
    const hrefByKey = new Map(SERVICE_CONFIGS.map((s) => [s.key, s.href]))
    for (const link of links) {
      expect(link.href).toBe(hrefByKey.get(link.nameKey!))
    }
  })

  it('omits unavailable / "soon" services', () => {
    const soonKeys = SERVICE_CONFIGS
      .filter((s) => !s.available || s.categoryKey === 'soon')
      .map((s) => s.key)
    for (const key of soonKeys) {
      expect(links.some((it) => it.nameKey === key)).toBe(false)
    }
  })

  it('groups under hardware + software section headers', () => {
    const sections = items.filter((it) => it.isSection).map((it) => it.nameKey)
    expect(sections).toEqual(['hardware', 'software'])
  })

  it('pairs each link with a matching description key', () => {
    for (const link of links) {
      expect(link.descriptionKey).toBe(`${link.nameKey}Desc`)
    }
  })
})
