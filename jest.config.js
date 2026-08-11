const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/pages/_app.tsx',
    '!src/pages/_document.tsx',
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  moduleDirectories: ['node_modules', '<rootDir>/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@auth|next-auth|next-intl|use-intl|cookie)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^saldo-engine$': '<rootDir>/packages/saldo/src/index.ts',
    '^next-auth$': '<rootDir>/node_modules/next-auth',
    '^next-auth/react$': '<rootDir>/node_modules/next-auth/react',
    '^next-auth/(.*)$': '<rootDir>/node_modules/next-auth/$1',
    '^next-intl$': '<rootDir>/__mocks__/next-intl.js',
    '^next-intl/(.*)$': '<rootDir>/__mocks__/next-intl.js',
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/cms-api/',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
const buildConfig = createJestConfig(customJestConfig)

// next/jest PREPENDS its own transformIgnorePatterns, and patterns are OR'd —
// if any one matches, the file is never transformed. So an allowlist entry in
// customJestConfig above cannot rescue an ESM-only package on its own; the
// package must also be injected into next/jest's generated allowlist here.
// cookie v2 is pure ESM ("type": "module") and is imported by src/lib/auth.
module.exports = async () => {
  const config = await buildConfig()
  config.transformIgnorePatterns = config.transformIgnorePatterns.map((pattern) =>
    pattern.includes('(?!(next-auth|') ? pattern.replace('(?!(next-auth|', '(?!(cookie|next-auth|') : pattern
  )
  return config
}
