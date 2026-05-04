const createNextIntlPlugin = require('next-intl/plugin')
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
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
      // Techniker unification redirects
      {
        source: '/repairers',
        destination: '/techniker',
        permanent: true,
      },
      {
        source: '/repairers/:id',
        destination: '/techniker/:id',
        permanent: true,
      },
      {
        source: '/it-hilfe/helfer',
        destination: '/techniker',
        permanent: true,
      },
      {
        source: '/it-hilfe/helfer/:id',
        destination: '/techniker/:id',
        permanent: true,
      },
      {
        source: '/profil/skills',
        destination: '/profil/techniker',
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
  },
  // Add specific CSS handling
  sassOptions: {
    includePaths: ['./src/styles'],
  },
}

module.exports = withNextIntl(nextConfig)
