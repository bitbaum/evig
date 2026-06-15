import { orderPublishedGuides, UPCYCLING_GUIDE_SLUGS } from '@/data/upcycling-guides'

describe('upcycling guides SSOT', () => {
  it('orders i18n rows by published slug list', () => {
    const items = orderPublishedGuides([
      { slug: 'other', model: 'Other' },
      { slug: 'lenovo-l2251pwd', model: 'Lenovo L2251pwd' },
    ])
    expect(items.map((g) => g.slug)).toEqual(['lenovo-l2251pwd'])
  })

  it('matches gallery documented model', () => {
    expect(UPCYCLING_GUIDE_SLUGS).toContain('lenovo-l2251pwd')
  })
})
