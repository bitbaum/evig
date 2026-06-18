/**
 * Monitor-Upcycling mini-site routes — SSOT
 *
 * Intentionally portable: a future split to its own domain is a redirect
 * map, not a string hunt across pages and i18n hrefs.
 */

export const UPCYCLING_BASE = '/projects/upcycling' as const

export const UPCYCLING_ROUTES = {
  landing: UPCYCLING_BASE,
  applications: `${UPCYCLING_BASE}/applications`,
  gallery: `${UPCYCLING_BASE}/gallery`,
  buildYourOwn: `${UPCYCLING_BASE}/build-your-own`,
  wirkung: `${UPCYCLING_BASE}/wirkung`,
  businessplan: `${UPCYCLING_BASE}/businessplan`,
  status: `${UPCYCLING_BASE}/status`,
  lenovoL2251pwd: `${UPCYCLING_BASE}/lenovo-l2251pwd`,
  /** Interner, passwortgeschützter Akquise-Bereich (nicht in der öffentlichen Sub-Nav). */
  dossier: `${UPCYCLING_BASE}/dossier`,
} as const

export type UpcyclingRouteKey = keyof typeof UPCYCLING_ROUTES

/** Sticky sub-nav order (reading depth: explore → evidence). */
export const UPCYCLING_NAV_ROUTE_KEYS = [
  'landing',
  'applications',
  'gallery',
  'buildYourOwn',
  'wirkung',
  'businessplan',
  'status',
] as const satisfies readonly UpcyclingRouteKey[]

/** i18n keys under `projects.upcycling.nav` for each nav item. */
export const UPCYCLING_NAV_LABEL_KEYS: Record<
  (typeof UPCYCLING_NAV_ROUTE_KEYS)[number],
  'overview' | 'applications' | 'gallery' | 'buildYourOwn' | 'wirkung' | 'businessPlan' | 'status'
> = {
  landing: 'overview',
  applications: 'applications',
  gallery: 'gallery',
  buildYourOwn: 'buildYourOwn',
  wirkung: 'wirkung',
  businessplan: 'businessPlan',
  status: 'status',
}

/** Landing explore cards → route keys. */
export const UPCYCLING_EXPLORE_ROUTE_KEYS = [
  'applications',
  'gallery',
  'buildYourOwn',
] as const satisfies readonly UpcyclingRouteKey[]

/** Path prefix for model-specific guides (highlights build-your-own in sub-nav). */
export const UPCYCLING_GUIDE_PATH_PREFIX = `${UPCYCLING_BASE}/lenovo` as const

export const UPCYCLING_GALLERY_ASSET_BASE = `${UPCYCLING_BASE}/gallery` as const

/** One primary “continue reading” link per page — explore lane then evidence lane. */
export const UPCYCLING_PAGE_FLOW = {
  applications: 'gallery',
  gallery: 'buildYourOwn',
  buildYourOwn: 'wirkung',
  wirkung: 'businessplan',
  businessplan: 'status',
  lenovoL2251pwd: 'gallery',
} as const

export type UpcyclingFlowFromKey = keyof typeof UPCYCLING_PAGE_FLOW

/** Map public paths → flow keys for the next-step band. */
export const UPCYCLING_FLOW_PATH_MAP: Partial<Record<string, UpcyclingFlowFromKey>> = {
  [UPCYCLING_ROUTES.applications]: 'applications',
  [UPCYCLING_ROUTES.gallery]: 'gallery',
  [UPCYCLING_ROUTES.buildYourOwn]: 'buildYourOwn',
  [UPCYCLING_ROUTES.wirkung]: 'wirkung',
  [UPCYCLING_ROUTES.businessplan]: 'businessplan',
  [UPCYCLING_ROUTES.lenovoL2251pwd]: 'lenovoL2251pwd',
}

/** Pages that already have a dedicated interest block or are evidence-only. */
export const UPCYCLING_INTEREST_SKIP_PATHS = new Set<string>([
  UPCYCLING_ROUTES.landing,
  UPCYCLING_ROUTES.businessplan,
  UPCYCLING_ROUTES.status,
  // Interner Bereich: keine öffentlichen Marketing-Bänder.
  UPCYCLING_ROUTES.dossier,
])
