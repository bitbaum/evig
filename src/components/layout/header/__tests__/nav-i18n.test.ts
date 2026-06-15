import { navItemDescription, navItemLabel } from '@/components/layout/header/nav-i18n'

describe('nav-i18n', () => {
  const t = (key: string) => {
    const map: Record<string, string> = {
      'items.projectMonitorUpcycling': 'Monitor-Upcycling',
      projectMonitorUpcycling: 'SHOULD NOT USE',
      'items.projects': 'Projekte',
      projects: 'Projekte (top)',
    }
    return map[key] ?? `nav.${key}`
  }

  it('prefers nav.items for dropdown keys', () => {
    expect(navItemLabel(t, 'projectMonitorUpcycling')).toBe('Monitor-Upcycling')
  })

  it('falls back to top-level nav keys', () => {
    expect(navItemLabel(t, 'projects')).toBe('Projekte')
  })

  it('resolves descriptions under nav.items', () => {
    const td = (key: string) =>
      key === 'items.projectMonitorUpcyclingDesc' ? 'Aktiv · …' : key
    expect(navItemDescription(td, 'projectMonitorUpcyclingDesc')).toBe('Aktiv · …')
  })
})
