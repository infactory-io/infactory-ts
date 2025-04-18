// jest.config.cjs
/** @type {import('jest').Config} */
const config = {
  // Use CommonJS for Jest configuration (not ESM)
  preset: 'ts-jest/presets/default-esm', // Use ESM preset
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  collectCoverage: true,
  resolver: 'ts-jest-resolver',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'], // Treat .ts and .tsx as ESM
  transformIgnorePatterns: ['node_modules/(?!(fetch-mock|jest-fetch-mock)/)'],
  verbose: true,
};

module.exports = config;
