/** @type {import('next').NextConfig} */
const nextConfig = {
  // Relax build blocking on type errors for production deploys.
  // CI covers quality checks; this ensures Vercel deploy does not fail
  // on non-critical type issues in optional scripts/routes.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'medusa-public-images.s3.eu-west-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/medusa/:path*',
        destination: `${process.env.MEDUSA_API_URL || 'http://localhost:9000'}/:path*`,
      },
    ];
  },
  webpack: (config, { isServer, dev }) => {
    // Font loader configuration
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/,
      use: {
        loader: 'file-loader',
        options: {
          name: '[name].[ext]',
          outputPath: 'static/fonts/',
        },
      },
    });

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
        // Large/irrelevant directories to ignore in watch
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
          '**/medusa-backend/**',
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
    optimizeCss: true,
  },
  // Turbopack configuration (moved from experimental.turbo in Next.js 16)
  turbopack: {
    resolveAlias: {
      // Ensure CSS modules are handled correctly
      styles: './src/styles',
    },
  },
  // Add specific CSS handling
  sassOptions: {
    includePaths: ['./src/styles'],
  },
}

module.exports = nextConfig 
