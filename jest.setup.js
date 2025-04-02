// Add any global test setup here
global.fetch = jest.fn();
global.console = {
  ...console,
  // Uncomment to ignore specific console methods during tests
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
