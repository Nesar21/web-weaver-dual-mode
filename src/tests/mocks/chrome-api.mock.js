// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Chrome API Mocks

/**
 * Chrome API Mocks
 * Mock implementation of Chrome Extension APIs for testing
 */

// Storage mock
const storageData = {
  local: {},
  sync: {},
  session: {}
};

const storageMock = {
  local: {
    get: jest.fn((keys) => {
      return Promise.resolve(
        typeof keys === 'string'
          ? { [keys]: storageData.local[keys] }
          : keys.reduce((acc, key) => {
              acc[key] = storageData.local[key];
              return acc;
            }, {})
      );
    }),
    set: jest.fn((items) => {
      Object.assign(storageData.local, items);
      return Promise.resolve();
    }),
    remove: jest.fn((keys) => {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach(key => delete storageData.local[key]);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      storageData.local = {};
      return Promise.resolve();
    })
  },
  sync: {
    get: jest.fn((keys) => {
      return Promise.resolve(
        typeof keys === 'string'
          ? { [keys]: storageData.sync[keys] }
          : keys.reduce((acc, key) => {
              acc[key] = storageData.sync[key];
              return acc;
            }, {})
      );
    }),
    set: jest.fn((items) => {
      Object.assign(storageData.sync, items);
      return Promise.resolve();
    }),
    remove: jest.fn((keys) => {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach(key => delete storageData.sync[key]);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      storageData.sync = {};
      return Promise.resolve();
    })
  }
};

// Runtime mock
const runtimeMock = {
  lastError: null,
  sendMessage: jest.fn((message, callback) => {
    // Simulate async message passing
    setTimeout(() => {
      if (callback) {
        callback({ success: true, data: {} });
      }
    }, 0);
  }),
  onMessage: {
    addListener: jest.fn(),
    removeListener: jest.fn()
  },
  getURL: jest.fn((path) => `chrome-extension://fake-id/${path}`),
  getManifest: jest.fn(() => ({
    name: 'Web Weaver Lightning',
    version: '1.0.0',
    manifest_version: 3
  }))
};

// Tabs mock
const tabsMock = {
  query: jest.fn(() => Promise.resolve([
    { id: 1, url: 'https://example.com', active: true }
  ])),
  get: jest.fn((tabId) => Promise.resolve({
    id: tabId,
    url: 'https://example.com',
    active: true
  })),
  create: jest.fn((createProperties) => Promise.resolve({
    id: 2,
    url: createProperties.url,
    active: true
  })),
  update: jest.fn((tabId, updateProperties) => Promise.resolve({
    id: tabId,
    ...updateProperties
  })),
  sendMessage: jest.fn((tabId, message, callback) => {
    if (callback) {
      callback({ success: true });
    }
  })
};

// Downloads mock
const downloadsMock = {
  download: jest.fn((options) => Promise.resolve(1)),
  onChanged: {
    addListener: jest.fn()
  }
};

// Scripting mock
const scriptingMock = {
  executeScript: jest.fn(() => Promise.resolve([{ result: true }]))
};

// Complete Chrome API mock
export const mockChromeAPI = {
  storage: storageMock,
  runtime: runtimeMock,
  tabs: tabsMock,
  downloads: downloadsMock,
  scripting: scriptingMock
};

// Helper to reset all mocks
export function resetChromeMocks() {
  storageData.local = {};
  storageData.sync = {};
  storageData.session = {};
  
  jest.clearAllMocks();
}

// Helper to set storage data
export function setStorageData(area, data) {
  Object.assign(storageData[area], data);
}

// Helper to get storage data
export function getStorageData(area) {
  return { ...storageData[area] };
}
