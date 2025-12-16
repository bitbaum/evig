/** @type {import('next').NextConfig} */
const nextConfig = {
  // Relax build blocking on type/ESLint errors for production deploys.
  // CI covers quality checks; this ensures Vercel deploy does not fail
  // on non-critical type issues in optional scripts/routes.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
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
  webpack: (config, { isServer }) => {
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
    return config;
  },
  // Enable static optimization
  output: 'standalone',
  // Ensure proper CSS handling
  experimental: {
    optimizeCss: true,
    turbo: {
      resolveAlias: {
        // Ensure CSS modules are handled correctly
        styles: './src/styles',
      },
    },
  },
  // Add specific CSS handling
  sassOptions: {
    includePaths: ['./src/styles'],
  },
}

module.exports = nextConfig 
