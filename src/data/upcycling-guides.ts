import { UPCYCLING_ROUTES } from '@/config/upcycling-routes'

/** Published model guides — slug SSOT; copy lives in i18n keyed by slug. */
export const UPCYCLING_GUIDE_SLUGS = ['lenovo-l2251pwd'] as const

export type UpcyclingGuideSlug = (typeof UPCYCLING_GUIDE_SLUGS)[number]

export const UPCYCLING_GUIDE_ROUTES: Record<UpcyclingGuideSlug, string> = {
  'lenovo-l2251pwd': UPCYCLING_ROUTES.lenovoL2251pwd,
}

export function isUpcyclingGuideSlug(slug: string): slug is UpcyclingGuideSlug {
  return (UPCYCLING_GUIDE_SLUGS as readonly string[]).includes(slug)
}

/** Keep i18n guide rows aligned with published slugs (SSOT order). */
export function orderPublishedGuides<T extends { slug: string }>(items: T[]): T[] {
  const bySlug = new Map(items.map((item) => [item.slug, item]))
  return UPCYCLING_GUIDE_SLUGS.flatMap((slug) => {
    const item = bySlug.get(slug)
    return item ? [item] : []
  })
}
