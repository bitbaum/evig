// Pin the suite's timezone BEFORE anything constructs a Date.
//
// src/lib/date-formats.ts deliberately renders every timestamp in
// Europe/Zurich (without it, a server-rendered 15:00 workshop shows 1-2h off).
// Tests then build reference dates with `new Date(2026, 4, 15, 14, 30)`, which
// is the RUNNER's local time -- so the same assertion means "14:30" on a Swiss
// laptop and "16:30" on a UTC CI runner.
process.env.TZ = 'Europe/Zurich';

import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/__tests__/**/*.{js,jsx,ts,tsx}', 'src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/cms-api/**', 'tests/e2e/**'],
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      {
        find: 'saldo-engine',
        replacement: path.resolve(__dirname, './packages/saldo/src/index.ts'),
      },
      // Matches jest's moduleNameMapper, which redirected both the bare
      // specifier and every subpath (next-intl/routing, next-intl/navigation)
      // to the same mock -- src/i18n/routing.ts and navigation.ts import those
      // submodules directly.
      {
        find: /^next-intl(\/.*)?$/,
        replacement: path.resolve(__dirname, './__mocks__/next-intl.js'),
      },
    ],
  },
});
