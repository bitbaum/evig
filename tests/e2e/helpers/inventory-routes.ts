/**
 * Feature inventory route matrix — maps inventory # → path for dual-persona E2E.
 * SSOT paths: src/config/routes.ts
 */

import { ROUTES } from '@/config/routes'
import { UPCYCLING_NAV_ROUTE_KEYS, UPCYCLING_ROUTES } from '@/config/upcycling-routes'

/** Service slugs that expose `/services/[slug]/repair` booking pages. */
const SERVICE_REPAIR_SLUGS = [
  'computer-repair-upgrades',
  'data-recovery-transfer',
  'linux-open-source',
] as const

export interface InventoryRoute {
  id: number
  label: string
  path: string
  urlPattern?: RegExp
}

export const USER_DASHBOARD_ROUTES: InventoryRoute[] = [
  { id: 6, label: 'Profile', path: '/dashboard/profile' },
  { id: 7, label: 'Settings', path: '/dashboard/settings' },
  { id: 9, label: 'Dashboard home', path: '/dashboard' },
  { id: 11, label: 'Membership dashboard', path: '/dashboard/membership' },
  { id: 25, label: 'My IT-Hilfe requests', path: ROUTES.public.itHilfeMy, urlPattern: /\/it-hilfe\/my/ },
  { id: 26, label: 'My IT-Hilfe offers', path: ROUTES.public.itHilfeMyOffers, urlPattern: /\/it-hilfe\/my\/offers/ },
  { id: 30, label: 'Technician profile editor', path: ROUTES.public.profilTechniker, urlPattern: /techniker|profil/ },
  { id: 32, label: 'Dashboard techniker', path: '/dashboard/techniker' },
  { id: 43, label: 'My listings', path: '/dashboard/listings' },
  { id: 44, label: 'Seller dashboard', path: '/dashboard/seller' },
  { id: 45, label: 'My orders', path: '/dashboard/orders' },
  { id: 46, label: 'Favorites', path: '/dashboard/favorites' },
  { id: 55, label: 'My workshops', path: '/dashboard/workshops' },
  { id: 78, label: 'My appointments', path: '/dashboard/appointments', urlPattern: /appointments/ },
  { id: 80, label: 'Repairer appointments view', path: '/dashboard/appointments?role=repairer', urlPattern: /appointments/ },
  { id: 82, label: 'Bookings redirect', path: '/dashboard/bookings', urlPattern: /appointments/ },
  { id: 91, label: 'Messages', path: '/dashboard/messages' },
  { id: 96, label: 'Decisions list', path: '/dashboard/decisions' },
  { id: 104, label: 'Blog submissions', path: '/dashboard/blog-submissions' },
  { id: 113, label: 'My donations', path: '/dashboard/donations' },
  { id: 134, label: 'Staff timecards submit', path: '/dashboard/timecards' },
  { id: 136, label: 'Shift view', path: '/dashboard/shift' },
]

export const PUBLIC_ROUTES: InventoryRoute[] = [
  { id: 1, label: 'Register', path: ROUTES.public.register },
  { id: 4, label: 'Forgot password', path: ROUTES.public.forgotPassword },
  { id: 10, label: 'Invite', path: '/invite' },
  { id: 11, label: 'Mitglied werden', path: ROUTES.public.mitgliedWerden },
  { id: 13, label: 'IT-Hilfe hub', path: ROUTES.public.itHilfe },
  { id: 14, label: 'IT-Hilfe create', path: ROUTES.public.itHilfeCreate },
  { id: 16, label: 'IT-Hilfe browse', path: ROUTES.public.itHilfeBrowseRequests },
  { id: 28, label: 'Technician directory', path: ROUTES.public.techniker },
  { id: 36, label: 'Legacy techniker redirect', path: '/techniker', urlPattern: /\/it-hilfe\/techniker/ },
  { id: 37, label: 'Marketplace browse', path: ROUTES.public.marketplace },
  { id: 39, label: 'Marketplace search', path: '/marketplace?search=laptop' },
  { id: 40, label: 'Cart', path: '/marketplace/cart' },
  { id: 42, label: 'Sell listing', path: ROUTES.public.marketplaceSell },
  { id: 50, label: 'Legacy shop redirect', path: '/shop', urlPattern: /marketplace/ },
  { id: 51, label: 'Workshop catalog', path: ROUTES.public.workshops },
  { id: 56, label: 'Propose workshop', path: ROUTES.public.workshopsPropose },
  { id: 68, label: 'Services landing', path: ROUTES.public.services },
  { id: 69, label: 'Service category', path: '/services/hardware-recycling' },
  ...SERVICE_REPAIR_SLUGS.map(slug => ({
    id: 70,
    label: `Book repair (${slug})`,
    path: `/services/${slug}/repair`,
    urlPattern: /\/services\/[^/]+\/repair/,
  })),
  { id: 71, label: 'Open-source solutions', path: '/services/open-source-solutions' },
  ...UPCYCLING_NAV_ROUTE_KEYS.map(key => ({
    id: 116,
    label: `Upcycling ${key}`,
    path: UPCYCLING_ROUTES[key],
    urlPattern: /\/projects\/upcycling/,
  })),
  {
    id: 116,
    label: 'Upcycling Lenovo guide',
    path: UPCYCLING_ROUTES.lenovoL2251pwd,
    urlPattern: /\/projects\/upcycling/,
  },
  { id: 101, label: 'Blog index', path: ROUTES.public.blog },
  { id: 103, label: 'Blog submit', path: ROUTES.public.blogSubmit },
  { id: 112, label: 'Donate hardware', path: ROUTES.public.donate },
  { id: 117, label: 'Get involved donate', path: '/get-involved/donate' },
  { id: 118, label: 'Impressum', path: ROUTES.public.impressum },
  { id: 118, label: 'Datenschutz', path: ROUTES.public.datenschutz },
  { id: 118, label: 'AGB', path: ROUTES.public.agb },
  { id: 118, label: 'Transparenz', path: ROUTES.public.transparenz },
  { id: 119, label: 'FAQ', path: '/faq' },
  { id: 119, label: 'Contact', path: '/contact' },
  { id: 119, label: 'Support', path: '/support' },
  { id: 120, label: 'Changelog', path: ROUTES.public.changelog },
]

export const ADMIN_ROUTES: InventoryRoute[] = [
  { id: 35, label: 'Admin IT-Hilfe', path: ROUTES.admin.itHilfe, urlPattern: /\/admin\/it-hilfe/ },
  { id: 49, label: 'Admin marketplace', path: ROUTES.admin.marketplace, urlPattern: /\/admin\/marketplace/ },
  { id: 57, label: 'Admin workshops', path: ROUTES.admin.workshops, urlPattern: /\/admin\/workshops/ },
  { id: 58, label: 'Create workshop', path: ROUTES.admin.workshopsNew, urlPattern: /\/admin\/workshops\/new/ },
  { id: 59, label: 'Workshop instances', path: ROUTES.admin.workshopsInstances, urlPattern: /\/admin\/workshops\/instances/ },
  { id: 85, label: 'Admin appointments', path: ROUTES.admin.appointments, urlPattern: /\/admin\/appointments/ },
  { id: 88, label: 'Repairer applications', path: '/admin/repairer-applications' },
  { id: 98, label: 'Admin decisions', path: ROUTES.admin.decisions, urlPattern: /\/admin\/decisions/ },
  { id: 98, label: 'New decision', path: ROUTES.admin.decisionNew, urlPattern: /\/admin\/decisions\/new/ },
  { id: 105, label: 'Admin blog CMS', path: ROUTES.admin.contentBlog, urlPattern: /\/admin\/content\/blog/ },
  { id: 106, label: 'Admin pages CMS', path: ROUTES.admin.contentPages, urlPattern: /\/admin\/content\/pages/ },
  { id: 107, label: 'Admin categories', path: ROUTES.admin.categories, urlPattern: /\/admin\/content\/categories/ },
  { id: 108, label: 'Media library', path: ROUTES.admin.contentMedia, urlPattern: /\/admin\/content\/media/ },
  { id: 109, label: 'Content submissions', path: ROUTES.admin.contentSubmissions, urlPattern: /\/admin\/content\/submissions/ },
  { id: 110, label: 'Approvals hub', path: ROUTES.admin.approvals, urlPattern: /\/admin\/approvals/ },
  { id: 111, label: 'Reviews moderation', path: '/admin/reviews' },
  { id: 114, label: 'Admin donations', path: '/admin/donations' },
  { id: 115, label: 'Admin projects', path: ROUTES.admin.projects, urlPattern: /\/admin\/projects/ },
  { id: 122, label: 'Admin dashboard', path: ROUTES.admin.dashboard, urlPattern: /\/admin/ },
  { id: 123, label: 'Erfassung', path: ROUTES.admin.erfassung, urlPattern: /\/admin\/erfassung/ },
  { id: 124, label: 'Products', path: ROUTES.admin.products, urlPattern: /\/admin\/products/ },
  { id: 125, label: 'Intake pipeline', path: '/admin/intake' },
  { id: 126, label: 'Locations', path: ROUTES.admin.locations, urlPattern: /\/admin\/locations/ },
  { id: 127, label: 'Admin services', path: ROUTES.admin.services, urlPattern: /\/admin\/services/ },
  { id: 128, label: 'Tasks', path: ROUTES.admin.tasks, urlPattern: /\/admin\/tasks/ },
  { id: 128, label: 'Task projects', path: ROUTES.admin.taskProjects, urlPattern: /\/admin\/tasks\/projects/ },
  { id: 129, label: 'Protocols', path: ROUTES.admin.protocols, urlPattern: /\/admin\/protocols/ },
  { id: 130, label: 'Team HR', path: ROUTES.admin.team, urlPattern: /\/admin\/team/ },
  { id: 131, label: 'Team approvals', path: '/admin/team/approvals' },
  { id: 132, label: 'Users admin', path: ROUTES.admin.users, urlPattern: /\/admin\/users/ },
  { id: 133, label: 'Membership approvals', path: '/admin/membership' },
  { id: 135, label: 'Admin timecards', path: '/admin/timecards', urlPattern: /\/admin\/timecards/ },
  { id: 138, label: 'Payroll', path: '/admin/payroll' },
  { id: 139, label: 'Analytics', path: '/admin/analytics' },
  { id: 140, label: 'Analyse', path: ROUTES.admin.analyse, urlPattern: /\/admin\/analyse/ },
  { id: 141, label: 'Hirn AI', path: ROUTES.admin.hirn, urlPattern: /\/admin\/hirn/ },
  { id: 142, label: 'Admin settings', path: ROUTES.admin.settings, urlPattern: /\/admin\/settings/ },
  { id: 143, label: 'Team help / permissions', path: '/admin/team/help' },
]

/** Every admin list route — non-staff must be turned away. */
export const ADMIN_BLOCK_CHECK_ROUTES = ADMIN_ROUTES.map(r => r.path)

import type { DynamicSmokeIds } from './route-smoke'

export function dynamicUserRoutes(ids: DynamicSmokeIds): InventoryRoute[] {
  const routes: InventoryRoute[] = []
  if (ids.listingId) {
    routes.push({ id: 38, label: 'Listing detail', path: ROUTES.public.marketplaceListing(ids.listingId) })
    routes.push({ id: 41, label: 'Checkout page', path: ROUTES.public.marketplaceCheckout(ids.listingId) })
  }
  if (ids.itHilfeRequestId) {
    routes.push({ id: 18, label: 'IT-Hilfe request detail', path: ROUTES.public.itHilfeRequest(ids.itHilfeRequestId) })
    routes.push({ id: 19, label: 'IT-Hilfe request edit', path: `${ROUTES.public.itHilfeRequest(ids.itHilfeRequestId)}/edit` })
  }
  if (ids.technicianProfileId) {
    routes.push({ id: 29, label: 'Technician public profile', path: ROUTES.public.technicianProfile(ids.technicianProfileId) })
  }
  if (ids.workshopSlug) {
    routes.push({ id: 52, label: 'Workshop detail', path: `/workshops/${ids.workshopSlug}` })
  }
  if (ids.appointmentId) {
    routes.push({ id: 79, label: 'Appointment detail', path: `/dashboard/appointments/${ids.appointmentId}` })
    routes.push({ id: 83, label: 'Booking detail redirect', path: `/dashboard/bookings/${ids.appointmentId}`, urlPattern: /appointments/ })
  }
  if (ids.blogSlug) {
    routes.push({ id: 102, label: 'Blog post', path: ROUTES.public.blogPost(ids.blogSlug) })
  }
  return routes
}

export function dynamicAdminRoutes(ids: DynamicSmokeIds): InventoryRoute[] {
  const routes: InventoryRoute[] = []
  if (ids.adminAppointmentId) {
    routes.push({ id: 86, label: 'Admin appointment detail', path: ROUTES.admin.appointment(ids.adminAppointmentId) })
  }
  return routes
}

/** When dynamic IDs are missing, smoke parent surfaces (empty-state OK). */
export function emptyStateFallbackRoutes(ids: DynamicSmokeIds): InventoryRoute[] {
  const routes: InventoryRoute[] = []
  if (!ids.listingId) {
    routes.push({ id: 38, label: 'Marketplace browse (no listing id)', path: '/marketplace' })
  }
  if (!ids.workshopSlug) {
    routes.push({ id: 52, label: 'Workshop catalog (no slug)', path: '/workshops' })
  }
  if (!ids.appointmentId) {
    routes.push({ id: 79, label: 'Appointments list (no detail id)', path: '/dashboard/appointments' })
  }
  if (!ids.adminAppointmentId) {
    routes.push({ id: 86, label: 'Admin appointments list (no detail id)', path: '/admin/appointments' })
  }
  if (!ids.technicianProfileId) {
    routes.push({ id: 29, label: 'Technician directory (no profile id)', path: '/it-hilfe/techniker' })
  }
  return routes
}
