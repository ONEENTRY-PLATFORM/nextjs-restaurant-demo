import nextJest from 'next/jest.js';

/**
 * Integration jest config — runs the real-network OneEntry/Stripe tests under the `node`
 * environment, separate from the default (jsdom) unit suite.
 *
 * These tests hit the live OneEntry backend (sign in, create orders, open Stripe sessions), so they
 * are deliberately kept OUT of the default `npm test` run — and therefore out of the `prebuild` hook
 * — by a distinct `testMatch` (`**\/integration\/**\/*.integration.test.ts`). Run them on demand with
 * `npm run test:integration`. Same `next/jest` base as the unit config: SWC transform, `.env`/
 * `.env.local` loading, and the `@/` alias.
 */
const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.integration.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Live network + order creation; give each test room beyond the default 5s.
  testTimeout: 60_000,
};

export default createJestConfig(config);
