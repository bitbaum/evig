/**
 * ROUTES — SSOT for all application paths.
 *
 * Static routes are plain strings. Dynamic routes are functions.
 * Never hardcode paths in components — import from here.
 */
export const ROUTES = {
  admin: {
    dashboard:          '/admin',
    erfassung:          '/admin/erfassung',
    erfassungNew:       '/admin/erfassung/new',
    products:           '/admin/products',
    product:            (id: string) => `/admin/products/${id}`,
    productFactsheet:   (id: string) => `/admin/products/${id}/factsheet`,
    decisions:          '/admin/decisions',
    decisionNew:        '/admin/decisions/new',
    decision:           (id: string) => `/admin/decisions/${id}`,
    protocols:          '/admin/protocols',
    protocolNew:        '/admin/protocols/new',
    protocol:           (id: string) => `/admin/protocols/${id}`,
    approvals:          '/admin/approvals',
    users:              '/admin/users',
    user:               (id: string) => `/admin/users/${id}`,
    tasks:              '/admin/tasks',
    team:               '/admin/team',
    teamActivity:       '/admin/team/activity',
    workshops:          '/admin/workshops',
    services:           '/admin/services',
    itHilfe:            '/admin/it-hilfe',
    marketplace:        '/admin/marketplace',
    listing:            (id: string) => `/admin/marketplace/${id}`,
    hirn:               '/admin/hirn',
    categories:         '/admin/content/categories',
    blog:               '/admin/content/blog',
    settings:           '/admin/settings',
  },
  public: {
    home:               '/',
    shop:               '/shop',
    itHilfe:            '/it-hilfe',
    techniker:          '/techniker',
    blog:               '/blog',
    blogPost:           (slug: string) => `/blog/${slug}`,
    profil:             '/profil',
    profilTechniker:    '/profil/techniker',
    login:              '/auth/login',
    register:           '/auth/register',
  },
} as const
