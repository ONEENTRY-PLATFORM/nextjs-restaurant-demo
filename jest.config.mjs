import nextJest from 'next/jest.js';

/**
 * Loads SWC transformer, .env files, and the same module-name mapping
 * (CSS/images/`@/` alias) that `next build` uses, so tests run in an
 * environment that mirrors the app.
 */
const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jest-environment-jsdom',
  // Unit tests live in tests/jest/ (jsdom). Integration tests (tests/integration/, live network) run
  // separately via `npm run test:integration` and are excluded by this match — keeping them out of
  // the `prebuild` hook so a build never creates real OneEntry orders.
  testMatch: ['**/tests/jest/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default createJestConfig(config);
