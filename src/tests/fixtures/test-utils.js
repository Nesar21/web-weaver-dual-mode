// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Test Utilities

/**
 * Test Utility Functions
 * Helper functions for writing tests
 */

/**
 * Create mock extraction result
 */
export function createMockExtractionResult(overrides = {}) {
  return {
    success: true,
    data: [],
    metadata: {
      itemCount: 0,
      contentType: 'auto',
      extractionMode: 'extract_all',
      duration: 1000,
      timestamp: new Date().toISOString()
    },
    qualityScore: 85,
    ...overrides
  };
}

/**
 * Create mock settings
 */
export function createMockSettings(overrides = {}) {
  return {
    ai_provider: {
      selected_provider: 'chrome_ai',
      selected_model: {
        chrome_ai: 'gemini_nano',
        gemini_cloud: 'gemini-2.0-flash-lite'
      }
    },
    extraction: {
      mode: 'extract_all',
      content_type: 'auto',
      timeout_seconds: 60,
      screenshot: {
        enabled: false
      }
    },
    smart_features: {
      quality_score: { enabled: false },
      deduplication: { enabled: false }
    },
    preprocessing: {
      remove_scripts: true,
      remove_styles: true,
      remove_comments: true
    },
    advanced: {
      log_level: 'info',
      debug_mode: false,
      audio_feedback: false
    },
    ...overrides
  };
}

/**
 * Create mock error
 */
export function createMockError(type = 'generic', message = 'Test error') {
  const error = new Error(message);
  
  switch (type) {
    case 'network':
      error.name = 'NetworkError';
      break;
    case 'timeout':
      error.name = 'TimeoutError';
      break;
    case 'parsing':
      error.name = 'SyntaxError';
      break;
    case 'rate_limit':
      error.status = 429;
      break;
    case 'auth':
      error.status = 401;
      break;
  }
  
  return error;
}

/**
 * Wait for condition to be true
 */
export async function waitForCondition(condition, timeout = 5000) {
  const start = Date.now();
  
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error('Condition timeout');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Mock console methods
 */
export function mockConsole() {
  const original = { ...console };
  
  console.log = jest.fn();
  console.debug = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  
  return {
    restore: () => {
      Object.assign(console, original);
    }
  };
}

/**
 * Create mock chrome message response
 */
export function createMockMessageResponse(success = true, data = {}) {
  return {
    success,
    data,
    error: success ? null : 'Test error'
  };
}

/**
 * Simulate delay
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert object matches shape
 */
export function assertObjectShape(obj, shape) {
  for (const [key, value] of Object.entries(shape)) {
    if (!(key in obj)) {
      throw new Error(`Missing key: ${key}`);
    }
    
    if (typeof value === 'object' && value !== null) {
      assertObjectShape(obj[key], value);
    } else if (typeof obj[key] !== value) {
      throw new Error(`Type mismatch for ${key}: expected ${value}, got ${typeof obj[key]}`);
    }
  }
}

/**
 * Create mock HTML document
 */
export function createMockDocument(html) {
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

/**
 * Generate random string
 */
export function randomString(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create test snapshot
 */
export function createSnapshot(data) {
  return JSON.stringify(data, null, 2);
}

/**
 * Compare snapshots
 */
export function compareSnapshots(snapshot1, snapshot2) {
  return snapshot1 === snapshot2;
}
