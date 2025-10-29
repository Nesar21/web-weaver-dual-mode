// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Storage Mocks

/**
 * Storage Mocks
 * Simplified storage mock for specific testing scenarios
 */

class StorageMock {
  constructor() {
    this.data = {};
  }

  async get(keys) {
    if (keys === null) {
      // Return all data
      return { ...this.data };
    }
    
    if (typeof keys === 'string') {
      return { [keys]: this.data[keys] };
    }
    
    if (Array.isArray(keys)) {
      return keys.reduce((acc, key) => {
        acc[key] = this.data[key];
        return acc;
      }, {});
    }
    
    if (typeof keys === 'object') {
      // Return with defaults
      return Object.keys(keys).reduce((acc, key) => {
        acc[key] = this.data[key] ?? keys[key];
        return acc;
      }, {});
    }
  }

  async set(items) {
    Object.assign(this.data, items);
  }

  async remove(keys) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    keyArray.forEach(key => delete this.data[key]);
  }

  async clear() {
    this.data = {};
  }

  // Test helpers
  getAllData() {
    return { ...this.data };
  }

  setData(data) {
    this.data = { ...data };
  }

  reset() {
    this.data = {};
  }
}

// Create instances
const localStorageMock = new StorageMock();
const syncStorageMock = new StorageMock();

export const mockStorage = {
  local: localStorageMock,
  sync: syncStorageMock
};

// Test helpers
export function resetStorage() {
  localStorageMock.reset();
  syncStorageMock.reset();
}

export function getLocalStorage() {
  return localStorageMock.getAllData();
}

export function getSyncStorage() {
  return syncStorageMock.getAllData();
}

export function setLocalStorage(data) {
  localStorageMock.setData(data);
}

export function setSyncStorage(data) {
  syncStorageMock.setData(data);
}
