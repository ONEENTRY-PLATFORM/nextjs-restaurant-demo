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
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  // Integration tests hit the live OneEntry backend, so the default `npm test`
  // skips them. Run them explicitly with `npm run test:integration`.
  testPathIgnorePatterns: ['/node_modules/', '/__tests__/integration/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default createJestConfig(config);
