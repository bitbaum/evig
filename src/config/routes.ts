/**
 * ROUTES — SSOT for all application paths.
 *
 * Static routes are plain strings. Dynamic routes are functions.
 * Never hardcode paths in components — import from here.
 */
export const ROUTES = {
  admin: {
    dashboard:          '/admin',
    // Product capture is one step inside Geräte-Eingang. The legacy
    // /admin/erfassung route remains render-compatible for old bookmarks.
    erfassung:          '/admin/intake/capture',
    erfassungNew:       '/admin/intake/capture',
    // Printable A4 sales label for a captured device (re-homed from the
    // removed legacy /admin/products tree — the print view is a live feature).
    erfassungFactsheet: (id: string) => `/admin/erfassung/${id}/factsheet`,
    intake:             '/admin/intake',
    intakeCapture:      '/admin/intake/capture',
    // Small printable QR device label (physical ↔ digital link): scan at any
    // workstation to open the device's pipeline detail.
    intakeLabel:        (id: string) => `/admin/intake/${id}/label`,
    // The pipeline detail view is query-param addressed — this is the URL the
    // label QR encodes.
    intakeDetail:       (id: string) => `/admin/intake?detail=${id}`,
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
    taskNew:            '/admin/tasks/new',
    task:               (id: string) => `/admin/tasks/${id}`,
    taskProjects:       '/admin/tasks/projects',
    taskProjectNew:     '/admin/tasks/projects/new',
    taskProject:        (id: string) => `/admin/tasks/projects/${id}`,
    deliverables:       '/admin/deliverables',
    deliverableNew:     '/admin/deliverables/new',
    deliverable:        (id: string) => `/admin/deliverables/${id}`,
    projects:           '/admin/projects',
    project:            (slug: string) => `/admin/projects/${slug}`,
    team:               '/admin/team',
    teamActivity:       '/admin/team/activity',
    zeiterfassung:      '/admin/zeiterfassung',
    // Deep-link into a specific timecard period (history sidebar → editor).
    zeiterfassungPeriod: (periodType: string, periodStart: string) =>
      `/admin/zeiterfassung?period_type=${encodeURIComponent(periodType)}&period_date=${encodeURIComponent(periodStart)}`,
    teams:              '/admin/teams',
    teamsNew:           '/admin/teams/new',
    teamsAssignment:    '/admin/teams/assignment',
    teamBySlug:         (slug: string) => `/admin/teams/${slug}`,
    teamEdit:           (slug: string) => `/admin/teams/${slug}/edit`,
    hrVacancies:        '/admin/hr/vacancies',
    hrVacancyNew:       '/admin/hr/vacancies/new',
    hrVacancy:            (id: string) => `/admin/hr/vacancies/${id}`,
    hrApplications:     '/admin/hr/applications',
    hrApplicationsForPosting: (postingId: string) =>
      `/admin/hr/applications?job_posting_id=${encodeURIComponent(postingId)}`,
    hrApplication:        (id: string) => `/admin/hr/applications/${id}`,
    tasksForUser:       (userId: string) =>
      `/admin/tasks?assigned_to=${encodeURIComponent(userId)}`,
    workshops:          '/admin/workshops',
    // Workshop creation happens via the proposal flow on the workshops admin
    // home — there is no standalone create form.
    workshopsNew:       '/admin/workshops',
    workshopsInstances: '/admin/workshops/instances',
    workshopInstance:   (id: string) => `/admin/workshops/instances/${id}`,
    workshopProposal:   (id: string) => `/admin/workshops/proposals/${id}`,
    services:           '/admin/services',
    serviceNew:         '/admin/services/new',
    appointments:       '/admin/appointments',
    appointment:        (id: string) => `/admin/appointments/${id}`,
    itHilfe:            '/admin/it-hilfe',
    marketplace:        '/admin/marketplace',
    listing:            (id: string) => `/admin/marketplace/${id}`,
    hirn:               '/admin/hirn',
    content:            '/admin/content',
    contentSubmissions: '/admin/content/submissions',
    contentBlog:        '/admin/content/blog',
    contentBlogNew:     '/admin/content/blog/new',
    contentBlogComments: '/admin/content/blog/comments',
    categories:         '/admin/content/categories',
    categoryNew:        '/admin/content/categories/new',
    contentPages:       '/admin/content/pages',
    contentPageNew:     '/admin/content/pages/new',
    contentPage:        (id: string) => `/admin/content/pages/${id}`,
    contentMedia:       '/admin/content/media',
    locations:          '/admin/locations',
    locationNew:        '/admin/locations/new',
    location:           (id: string) => `/admin/locations/${id}`,
    analyse:            '/admin/analyse',
    analyseFinanzen:    '/admin/analyse/finanzen',
    analyseKennzahlen:  '/admin/analyse/kennzahlen',
    analyseWirkung:     '/admin/analyse/wirkung',
    analyseTransparenz: '/admin/analyse/transparenz',
    settings:           '/admin/settings',
  },
  public: {
    home:                     '/',
    /** Online shop canonical route. Legacy /shop URLs redirect here. */
    shop:                     '/marketplace',
    services:                 '/services',
    soFunktioniert:           '/so-funktionierts',
    reparaturbonus:           '/reparaturbonus',
    marketplace:              '/marketplace',
    marketplaceSell:          '/marketplace/sell',
    marketplaceListing:       (id: string) => `/marketplace/${id}`,
    marketplaceCheckout:      (id: string) => `/marketplace/checkout/${id}`,
    seller:                   (id: string) => `/sellers/${id}`,
    member:                   (id: string) => `/members/${id}`,
    itHilfe:                  '/it-hilfe',
    itHilfeBrowseRequests:    '/it-hilfe/anfragen',
    itHilfeCreate:            '/it-hilfe/create',
    itHilfeMy:                '/it-hilfe/my',
    itHilfeMyOffers:          '/it-hilfe/my/offers',
    itHilfeRequest:           (id: string) => `/it-hilfe/${id}`,
    /** Technician directory — lives under IT-Hilfe hub (not a separate product). */
    techniker:                '/it-hilfe/techniker',
    technicianProfile:        (id: string) => `/it-hilfe/techniker/${id}`,
    blog:                     '/blog',
    blogPost:                 (slug: string) => `/blog/${slug}`,
    blogSubmit:               '/blog/submit',
    workshops:                '/workshops',
    workshopsPropose:         '/workshops/propose',
    profil:                   '/profil',
    profilTechniker:          '/profil/techniker',
    login:                    '/auth/login',
    register:                 '/auth/register',
    forgotPassword:           '/auth/forgot-password',
    // Donate hardware — the mission inflow. RevampIT exists because
    // people donate working computers; surface this from anywhere via
    // ROUTES.public.donate rather than the deeper /get-involved/donate.
    donate:                   '/get-involved/donate',
    // Legal + membership pages — surface in the footer SSOT instead of
    // being hardcoded across components. Add new public pages here.
    impressum:                '/impressum',
    datenschutz:              '/datenschutz',
    agb:                      '/agb',
    transparenz:              '/transparenz',
    transparenzKennzahlen:    '/transparenz/kennzahlen',
    transparenzCo2:           '/transparenz/co2',
    mitgliedWerden:           '/mitglied-werden',
    careers:                  '/karriere',
    careerPosting:            (slug: string) => `/karriere/${slug}`,
    getInvolved:              '/get-involved',
    changelog:                '/changelog',
  },
} as const
