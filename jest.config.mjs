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
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

export default createJestConfig(config);
