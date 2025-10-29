// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Storage Manager

/**
 * Storage Manager
 * Abstraction layer for Chrome storage (session and local)
 * Provides unified interface for reading/writing extension data
 */

import { createLogger, logStorage } from '../../utils/logger.js';

const logger = createLogger('StorageManager');

/**
 * Storage types
 * @enum {string}
 */
export const STORAGE_TYPE = {
  SESSION: 'session',
  LOCAL: 'local'
};

/**
 * Get data from storage
 * @param {string} key - Storage key
 * @param {string} storageType - Storage type (session or local)
 * @returns {Promise<any>} Stored value or null if not found
 */
export async function get(key, storageType = STORAGE_TYPE.LOCAL) {
  try {
    const storage = getStorageArea(storageType);
    const result = await storage.get(key);
    
    const value = result[key] !== undefined ? result[key] : null;
    logStorage('read', key, true);
    
    return value;
  } catch (error) {
    logger.error('Get failed', error, { key, storageType });
    logStorage('read', key, false, error);
    throw error;
  }
}

/**
 * Set data in storage
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @param {string} storageType - Storage type (session or local)
 * @returns {Promise<void>}
 */
export async function set(key, value, storageType = STORAGE_TYPE.LOCAL) {
  try {
    const storage = getStorageArea(storageType);
    await storage.set({ [key]: value });
    
    logStorage('write', key, true);
    logger.debug(`Set: ${key} in ${storageType}`);
  } catch (error) {
    logger.error('Set failed', error, { key, storageType });
    logStorage('write', key, false, error);
    throw error;
  }
}

/**
 * Remove data from storage
 * @param {string} key - Storage key
 * @param {string} storageType - Storage type (session or local)
 * @returns {Promise<void>}
 */
export async function remove(key, storageType = STORAGE_TYPE.LOCAL) {
  try {
    const storage = getStorageArea(storageType);
    await storage.remove(key);
    
    logStorage('delete', key, true);
    logger.debug(`Removed: ${key} from ${storageType}`);
  } catch (error) {
    logger.error('Remove failed', error, { key, storageType });
    logStorage('delete', key, false, error);
    throw error;
  }
}

/**
 * Get multiple keys from storage
 * @param {Array<string>} keys - Array of storage keys
 * @param {string} storageType - Storage type (session or local)
 * @returns {Promise<Object>} Object with key-value pairs
 */
export async function getMultiple(keys, storageType = STORAGE_TYPE.LOCAL) {
  try {
    const storage = getStorageArea(storageType);
    const result = await storage.get(keys);
    
    logger.debug(`Get multiple: ${keys.join(', ')} from ${storageType}`);
    return result;
  } catch (error) {
    logger.error('Get multiple failed', error, { keys, storageType });
    throw error;
  }
}

/**
 * Set multiple key-value pairs in storage
 * @param {Object} items - Object with key-value pairs
 * @param {string} storageType - Storage type (session or local)
 * @returns {Promise<void>}
 */
export async function setMultiple(items, storageType = STORAGE_TYPE.LOCAL) {
  try {
    const storage = getStorageArea(storageType);
    await storage.set(items);
    
    logger.debug(`Set multiple: ${Object.keys(items).join(', ')} in ${storageType}`);
  } catch (error) {
    logger.error('Set multiple failed', error, { items, storageType });
    throw error;
  }
}

/**
 * Clear all data from storage
 * @param {string} storageType - Storage type (session or local)
 * @returns {Promise<void>}
 */
export async function clear(storageType = STORAGE_TYPE.LOCAL) {
  try {
    const storage = getStorageArea(storageType);
    await storage.clear();
    
    logger.warn(`Cleared all data from ${storageType}`);
  } catch (error) {
    logger.error('Clear failed', error, { storageType });
    throw error;
  }
}

/**
 * Get all data from storage
 * @param {string} storageType - Storage type (session or local)
 * @returns {Promise<Object>} All stored data
 */
export async function getAll(storageType = STORAGE_TYPE.LOCAL) {
  try {
    const storage = getStorageArea(storageType);
    const result = await storage.get(null);
    
    logger.debug(`Get all from ${storageType}`);
    return result;
  } catch (error) {
    logger.error('Get all failed', error, { storageType });
    throw error;
  }
}

/**
 * Check if key exists in storage
 * @param {string} key - Storage key
 * @param {string} storageType - Storage type (session or local)
 * @returns {Promise<boolean>} True if key exists
 */
export async function has(key, storageType = STORAGE_TYPE.LOCAL) {
  try {
    const value = await get(key, storageType);
    return value !== null;
  } catch (error) {
    logger.error('Has check failed', error, { key, storageType });
    return false;
  }
}

/**
 * Get storage area based on type
 * @param {string} storageType - Storage type
 * @returns {Object} Chrome storage area
 * @private
 */
function getStorageArea(storageType) {
  if (storageType === STORAGE_TYPE.SESSION) {
    return chrome.storage.session;
  }
  return chrome.storage.local;
}

/**
 * Add storage change listener
 * @param {Function} callback - Callback function (changes, areaName)
 * @returns {Function} Cleanup function to remove listener
 */
export function addChangeListener(callback) {
  chrome.storage.onChanged.addListener(callback);
  
  return () => {
    chrome.storage.onChanged.removeListener(callback);
  };
}

/**
 * Get storage usage (bytes used)
 * @param {string} storageType - Storage type (session or local)
 * @returns {Promise<number>} Bytes used
 */
export async function getBytesInUse(storageType = STORAGE_TYPE.LOCAL) {
  try {
    const storage = getStorageArea(storageType);
    
    if (typeof storage.getBytesInUse === 'function') {
      const bytes = await storage.getBytesInUse(null);
      return bytes;
    }
    
    // Fallback: estimate size
    const all = await getAll(storageType);
    const jsonString = JSON.stringify(all);
    return new Blob([jsonString]).size;
  } catch (error) {
    logger.error('Get bytes in use failed', error, { storageType });
    return 0;
  }
}

/**
 * Save settings to storage
 * @param {Object} settings - Settings object
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  await set('settings', settings, STORAGE_TYPE.LOCAL);
  logger.info('Settings saved');
}

/**
 * Load settings from storage
 * @returns {Promise<Object|null>} Settings object or null
 */
export async function loadSettings() {
  const settings = await get('settings', STORAGE_TYPE.LOCAL);
  logger.debug('Settings loaded', settings ? 'found' : 'not found');
  return settings;
}

/**
 * Save extraction history
 * @param {Object} extraction - Extraction result
 * @returns {Promise<void>}
 */
export async function saveExtractionHistory(extraction) {
  const history = await get('extraction_history', STORAGE_TYPE.LOCAL) || [];
  
  // Add timestamp
  extraction.timestamp = Date.now();
  
  // Add to history
  history.unshift(extraction);
  
  // Limit history size (from settings)
  const settings = await loadSettings();
  const maxItems = settings?.storage?.max_history_items || 50;
  const trimmed = history.slice(0, maxItems);
  
  await set('extraction_history', trimmed, STORAGE_TYPE.LOCAL);
  logger.debug('Extraction added to history');
}

/**
 * Get extraction history
 * @param {number} limit - Maximum number of items to return
 * @returns {Promise<Array>} Array of extraction results
 */
export async function getExtractionHistory(limit = 50) {
  const history = await get('extraction_history', STORAGE_TYPE.LOCAL) || [];
  return history.slice(0, limit);
}

/**
 * Clear extraction history
 * @returns {Promise<void>}
 */
export async function clearExtractionHistory() {
  await remove('extraction_history', STORAGE_TYPE.LOCAL);
  logger.info('Extraction history cleared');
}

/**
 * Cleanup old data based on settings
 * @returns {Promise<void>}
 */
export async function cleanupOldData() {
  const settings = await loadSettings();
  
  if (!settings?.storage?.auto_cleanup) {
    return;
  }
  
  const cleanupDays = settings.storage.cleanup_days || 30;
  const cutoffTime = Date.now() - (cleanupDays * 24 * 60 * 60 * 1000);
  
  // Clean history
  const history = await get('extraction_history', STORAGE_TYPE.LOCAL) || [];
  const filtered = history.filter(item => item.timestamp > cutoffTime);
  
  if (filtered.length < history.length) {
    await set('extraction_history', filtered, STORAGE_TYPE.LOCAL);
    logger.info(`Cleaned up ${history.length - filtered.length} old history items`);
  }
}

// TEST SCENARIOS:
// 1. Get/set values in local storage
// 2. Get/set values in session storage
// 3. Remove values from storage
// 4. Get multiple keys at once
// 5. Set multiple key-value pairs at once
// 6. Clear all data from storage
// 7. Get all data from storage
// 8. Check if key exists (has)
// 9. Add storage change listener
// 10. Get bytes in use (storage quota)
// 11. Save and load settings
// 12. Save extraction to history (with timestamp)
// 13. Get extraction history with limit
// 14. Clear extraction history
// 15. Cleanup old data based on retention policy
