// Pin the suite's timezone BEFORE anything constructs a Date.
//
// src/lib/date-formats.ts deliberately renders every timestamp in
// Europe/Zurich (without it, a server-rendered 15:00 workshop shows 1-2h off).
// Tests then build reference dates with `new Date(2026, 4, 15, 14, 30)`, which
// is the RUNNER's local time — so the same assertion means "14:30" on a Swiss
// laptop and "16:30" on a UTC CI runner. Six date tests were failing on every
// CI run for exactly this reason, invisibly, because the job discarded its own
// result. Pinning here rather than in each npm script keeps one source of
// truth: test, test:watch, test:coverage and test:i18n all load this config,
// and jest's worker processes inherit the env set at config-load time.
process.env.TZ = 'Europe/Zurich'

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
    // ai-kit is ESM-only ("type": "module", no require condition). Jest runs
    // CJS, so an untransformed import dies with `Unexpected token 'export'`
    // the moment anything reaches it — botsmann shipped exactly this bug
    // once. Listed here AND injected into next/jest's own generated pattern
    // below, for the same reason `cookie` needed both.
    '/node_modules/(?!(@auth|next-auth|next-intl|use-intl|cookie|ai-kit)/)',
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
// ai-kit is the same shape, imported by src/lib/hirn/health.ts and
// src/lib/ai/health.ts.
module.exports = async () => {
  const config = await buildConfig()
  config.transformIgnorePatterns = config.transformIgnorePatterns.map((pattern) =>
    pattern.includes('(?!(next-auth|') ? pattern.replace('(?!(next-auth|', '(?!(ai-kit|cookie|next-auth|') : pattern
  )
  return config
}
