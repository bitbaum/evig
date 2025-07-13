/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'strapi.revampit.ch',
        pathname: '/uploads/**',
      },
    ],
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
  compiler: {
    styledComponents: true
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