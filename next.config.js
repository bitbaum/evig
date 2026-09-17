const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Move the dev-only build/error indicator out of the bottom-left default, where
  // it sits on top of the mobile bottom nav. (Dev only — never shipped to prod.)
  devIndicators: {
    position: 'top-left',
  },
  // next-auth v5 beta ships as ESM with an internal circular dependency that leaves
  // React = null inside webpack's static-generation workers. Forcing transpilation
  // makes webpack process it as CJS in the same pass as the app, which resolves the
  // initialization order and prevents the React-null crash during build.
  transpilePackages: ['next-auth', '@auth/core'],
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
      // Cloudflare R2 — where all content images actually live (S3_PUBLIC_URL,
      // bucket revampit-media). Without this the optimizer rejects R2 URLs,
      // which is why `unoptimized` was scattered across image components.
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    // Deck URLs (`/presentations/<slug>`) are intentionally NOT rewritten to the
    // static index.html here: an `afterFiles` rewrite is matched BEFORE dynamic
    // app routes, which would bypass the access gate. Instead the route handler
    // `src/app/presentations/[slug]/route.ts` owns the URL — it enforces each
    // deck's `audience` and serves the file from public/ (same fs pattern the
    // blog uses for content/posts). Nested assets + /_assets stay static.
    return [];
  },
  async headers() {
    // Security headers on every response. Shape follows the fleet reference
    // implementation, aoz-begleitung/next.config.js. Everything in this list is
    // inert for rendering: it constrains sniffing, framing, referrer detail,
    // transport and device APIs — never what a page is allowed to load.
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // SAMEORIGIN, not DENY: nothing here is meant to be embedded on another
      // site (no embed route, no OG/preview frame), and the two <iframe>s we do
      // render — the deliverable preview in /d/[token] and in the admin review
      // — only ever load SAME-ORIGIN urls (`isInternalPreview` is
      // `url.startsWith('/')`), so SAMEORIGIN leaves both working.
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      // camera=(self), microphone=(self) — deliberately NOT the empty
      // `camera=(), microphone=()`. An empty allowlist denies the feature to
      // EVERY origin including this one, so the browser never prompts and
      // getUserMedia rejects immediately with NotAllowedError. That would
      // silently break meeting recording (components/admin/protocols/
      // RecordButton.tsx, hooks/useVoiceRecording.ts) and the live product
      // camera (hooks/useAIProductAnalysis.ts startCamera, components/
      // erfassung/ImageCapture.tsx). `(self)` permits only this origin, so the
      // browser still asks the person — which is their decision to make.
      // geolocation stays fully denied: nothing here uses it.
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=()' },
      // REPORT-ONLY on purpose, and it must stay that way until it has been
      // observed. An enforcing Content-Security-Policy blocks SILENTLY: a
      // policy one source short breaks a stylesheet, an image or a third-party
      // script with nothing on screen to explain it. Report-Only asks the
      // browser to report what WOULD have been blocked and block nothing, so
      // this header cannot change how any page looks or behaves.
      //
      // What has to be observed before it could ever become an enforcing
      // `Content-Security-Policy`:
      //   1. a report sink is actually wired up (report-to / report-uri) —
      //      today nothing collects these reports;
      //   2. zero violations over real traffic covering the public site, the
      //      admin surfaces, the marketplace (R2 / S3 images), the embedded
      //      FleetCrown feedback widget script, and the static presentation
      //      decks under /presentations;
      //   3. 'unsafe-inline' and 'unsafe-eval' replaced by per-request nonces —
      //      while they are present script-src is largely decorative.
      {
        key: 'Content-Security-Policy-Report-Only',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fleetcrown.orangecat.ch https://loki.orangecat.ch",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "media-src 'self' blob: data: https:",
          "connect-src 'self' https://fleetcrown.orangecat.ch https://loki.orangecat.ch https://*.r2.dev https://*.amazonaws.com",
          "frame-src 'self'",
          "frame-ancestors 'self'",
          "base-uri 'self'",
          "form-action 'self'",
          "object-src 'none'",
        ].join('; '),
      },
    ];

    return [
      { source: '/(.*)', headers: securityHeaders },
      {
        // Prevent search engines from indexing presentations (unlisted, share-by-link only)
        source: '/presentations/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
  async redirects() {
    return [
      // Redirect old Hirn paths to new Analyse paths
      {
        source: '/admin/hirn/finanzen',
        destination: '/admin/analyse/finanzen',
        permanent: true,
      },
      {
        source: '/admin/hirn/kennzahlen',
        destination: '/admin/analyse/kennzahlen',
        permanent: true,
      },
      {
        source: '/admin/hirn/wirkung',
        destination: '/admin/analyse/wirkung',
        permanent: true,
      },
      {
        source: '/admin/hirn/transparenz',
        destination: '/admin/analyse/transparenz',
        permanent: true,
      },
      // Redirect old AI page to main Hirn page
      {
        source: '/admin/hirn/ai',
        destination: '/admin/hirn',
        permanent: true,
      },
      // Decisions — member-friendly URL aliases
      {
        source: '/decisions',
        destination: '/admin/decisions',
        permanent: false,
      },
      {
        source: '/decisions/:id',
        destination: '/admin/decisions/:id',
        permanent: false,
      },
      // Techniker — canonical paths live under IT-Hilfe hub
      {
        source: '/repairers',
        destination: '/it-hilfe/techniker',
        permanent: true,
      },
      {
        source: '/repairers/:id',
        destination: '/it-hilfe/techniker/:id',
        permanent: true,
      },
      {
        source: '/techniker',
        destination: '/it-hilfe/techniker',
        permanent: true,
      },
      {
        source: '/techniker/:id',
        destination: '/it-hilfe/techniker/:id',
        permanent: true,
      },
      {
        source: '/it-hilfe/helfer',
        destination: '/it-hilfe/techniker',
        permanent: true,
      },
      {
        source: '/it-hilfe/helfer/:id',
        destination: '/it-hilfe/techniker/:id',
        permanent: true,
      },
      {
        source: '/profil/skills',
        destination: '/profil/techniker',
        permanent: true,
      },
      // Shop - the online shop is the marketplace. Keep old URLs as
      // /support consolidated into the canonical donate page (its unique
      // channels — Ko-fi, GitHub Sponsors, contribute — now live there).
      {
        source: '/support',
        destination: '/get-involved/donate',
        permanent: true,
      },
      {
        source: '/:locale(en|fr|it|es|ja|ko|ru)/support',
        destination: '/:locale/get-involved/donate',
        permanent: true,
      },
      // hard redirects so crawlers and users do not render a parallel
      // shop shell before landing on products.
      {
        source: '/shop',
        destination: '/marketplace',
        permanent: true,
      },
      {
        source: '/:locale(en|fr|it|es|ja|ko|ru)/shop',
        destination: '/:locale/marketplace',
        permanent: true,
      },
      {
        source: '/shop/search',
        destination: '/marketplace',
        permanent: true,
      },
      {
        source: '/:locale(en|fr|it|es|ja|ko|ru)/shop/search',
        destination: '/:locale/marketplace',
        permanent: true,
      },
      {
        source: '/shop/category/business-laptops',
        destination: '/marketplace?category=10',
        permanent: true,
      },
      {
        source: '/:locale(en|fr|it|es|ja|ko|ru)/shop/category/business-laptops',
        destination: '/:locale/marketplace?category=10',
        permanent: true,
      },
      {
        source: '/shop/category/:slug',
        destination: '/marketplace',
        permanent: true,
      },
      {
        source: '/:locale(en|fr|it|es|ja|ko|ru)/shop/category/:slug',
        destination: '/:locale/marketplace',
        permanent: true,
      },
      {
        source: '/shop/product/:uuid',
        destination: '/marketplace',
        permanent: true,
      },
      {
        source: '/:locale(en|fr|it|es|ja|ko|ru)/shop/product/:uuid',
        destination: '/:locale/marketplace',
        permanent: true,
      },
    ];
  },
  webpack: (config, { isServer, dev }) => {
    // Handle fs module for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }

    // Reduce file watching load in dev to avoid EMFILE errors
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        ignored: [
          '**/.git/**',
          '**/.next/**',
          '**/node_modules/**',
          '**/.swc/**',
          '**/logs/**',
          '**/playwright-report/**',
          '**/test-results/**',
          '**/postgres-init/**',
          '**/cms-api/**',
          '**/examples/**',
          '**/packages/**',
        ],
        followSymlinks: false,
      };
    }
    return config;
  },
  // Enable static optimization
  output: 'standalone',
  // Ensure proper CSS handling
  experimental: {
    optimizeCss: process.env.NODE_ENV === 'production',
    // The proxy (src/proxy.ts) makes Next buffer every request body, capped
    // at 10 MB by default — larger bodies are silently TRUNCATED ("Unexpected
    // end of form"), which broke every meeting-audio upload above 10 MB.
    // Raise the cap above FILE_SIZE_LIMITS.AUDIO_MAX (250 MB) so protocol
    // recordings reach /api/protocols/[id]/process-sources intact.
    proxyClientMaxBodySize: '260mb',
  },
  // Add specific CSS handling
  sassOptions: {
    includePaths: ['./src/styles'],
  },
};

module.exports = withNextIntl(nextConfig);
