const createNextIntlPlugin = require('next-intl/plugin')
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ],
  },
  async rewrites() {
    return [
      // Serve static presentations from public/ with clean URLs
      {
        source: '/presentations/:slug',
        destination: '/presentations/:slug/index.html',
      },
    ];
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
  // Skip Next's in-build TypeScript pass (~3 min). Type-safety is enforced by
  // `npm run typecheck`, which scripts/selfhost-deploy-revampit.sh runs IN
  // PARALLEL with the build (on the spare core) and which aborts the deploy on
  // any error. Same coverage, but the ~3.5min tsc overlaps the build instead of
  // adding to it. Do NOT remove the deploy gate while keeping this flag.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Enable static optimization
  output: 'standalone',
  // Ensure proper CSS handling
  experimental: {
    optimizeCss: process.env.NODE_ENV === 'production',
  },
  // Add specific CSS handling
  sassOptions: {
    includePaths: ['./src/styles'],
  },
}

module.exports = withNextIntl(nextConfig)
