// jest.setup.cjs
const util = require('util');
require('jest-fetch-mock').enableMocks();

// Add TextEncoder and TextDecoder to global scope for tests
global.TextEncoder = util.TextEncoder;
global.TextDecoder = util.TextDecoder;

// Set up fetch mock - using require syntax
global.fetch = require('jest-fetch-mock');

// Mock console methods if needed
// global.console = {
//   ...console,
//   log: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Mock environment variables for tests
global.process = {
  env: {
    NF_API_KEY: 'test-api-key',
    NF_BASE_URL: 'https://api.test.infactory.ai',
  },
};
