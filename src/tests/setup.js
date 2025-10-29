// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Test Environment Setup

/**
 * Test Environment Setup
 * Configures global test environment and mocks
 */

// Mock Chrome API globally
import { mockChromeAPI } from './mocks/chrome-api.mock.js';
import { mockStorage } from './mocks/storage.mock.js';

// Setup global chrome object
global.chrome = mockChromeAPI;

// Setup storage mocks
global.chrome.storage = mockStorage;

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Setup test timeouts
jest.setTimeout(10000); // 10 seconds

// Mock timers
jest.useFakeTimers();

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Clean up after all tests
afterAll(() => {
  jest.restoreAllMocks();
});

// Global test utilities
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.waitFor = async (condition, timeout = 5000) => {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('waitFor timeout');
    }
    await sleep(100);
  }
};

console.log('✓ Test environment setup complete');
