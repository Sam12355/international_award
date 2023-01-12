/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Replace real Prisma client with mock in all tests
    '(.*)config/database$': '<rootDir>/tests/mocks/prisma',
    // Replace storage service to avoid fs operations
    '(.*)services/storage\\.service$': '<rootDir>/tests/mocks/storage',
  },
  setupFiles: ['<rootDir>/tests/setup.ts'],
  testMatch: ['**/*.test.ts'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/config/**',
  ],
  coverageDirectory: 'coverage',
  testTimeout: 15000,
};
