import {
  UPCYCLING_FLOW_PATH_MAP,
  UPCYCLING_PAGE_FLOW,
  UPCYCLING_ROUTES,
} from '@/config/upcycling-routes'

describe('upcycling reading flow', () => {
  it('maps explore lane then evidence lane', () => {
    expect(UPCYCLING_PAGE_FLOW.applications).toBe('gallery')
    expect(UPCYCLING_PAGE_FLOW.wirkung).toBe('businessplan')
    expect(UPCYCLING_PAGE_FLOW.businessplan).toBe('status')
  })

  it('resolves flow paths to route keys', () => {
    expect(UPCYCLING_FLOW_PATH_MAP[UPCYCLING_ROUTES.businessplan]).toBe('businessplan')
    expect(UPCYCLING_ROUTES[UPCYCLING_PAGE_FLOW.businessplan]).toBe(UPCYCLING_ROUTES.status)
  })
})
