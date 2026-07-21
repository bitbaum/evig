const createNextIntlPlugin = require('next-intl/plugin')
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

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
    return [
      {
        // Prevent search engines from indexing presentations (unlisted, share-by-link only)
        source: '/presentations/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
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
    middlewareClientMaxBodySize: '260mb',
  },
  // Add specific CSS handling
  sassOptions: {
    includePaths: ['./src/styles'],
  },
}

module.exports = withNextIntl(nextConfig)
