// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Cache Management

/**
 * Cache Manager
 * Manages cached extraction results with TTL
 */

import { createLogger } from '../../utils/logger.js';

const logger = createLogger('CacheManager');
const CACHE_PREFIX = 'cache_';
const DEFAULT_TTL = 3600000; // 1 hour

/**
 * Save to cache
 * @param {string} key - Cache key
 * @param {*} data - Data to cache
 * @param {number} ttl - Time to live in ms
 */
export async function set(key, data, ttl = DEFAULT_TTL) {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl
    };
    
    await chrome.storage.local.set({
      [CACHE_PREFIX + key]: cacheEntry
    });
    
    logger.debug(`Cached: ${key} (TTL: ${ttl}ms)`);
  } catch (error) {
    logger.error('Cache set failed', error);
  }
}

/**
 * Get from cache
 * @param {string} key - Cache key
 * @returns {*} Cached data or null
 */
export async function get(key) {
  try {
    const result = await chrome.storage.local.get(CACHE_PREFIX + key);
    const cacheEntry = result[CACHE_PREFIX + key];
    
    if (!cacheEntry) {
      return null;
    }
    
    // Check if expired
    const age = Date.now() - cacheEntry.timestamp;
    if (age > cacheEntry.ttl) {
      await remove(key);
      logger.debug(`Cache expired: ${key}`);
      return null;
    }
    
    logger.debug(`Cache hit: ${key}`);
    return cacheEntry.data;
    
  } catch (error) {
    logger.error('Cache get failed', error);
    return null;
  }
}

/**
 * Remove from cache
 * @param {string} key - Cache key
 */
export async function remove(key) {
  try {
    await chrome.storage.local.remove(CACHE_PREFIX + key);
    logger.debug(`Cache removed: ${key}`);
  } catch (error) {
    logger.error('Cache remove failed', error);
  }
}

/**
 * Clear all cache
 */
export async function clear() {
  try {
    const all = await chrome.storage.local.get(null);
    const cacheKeys = Object.keys(all).filter(k => k.startsWith(CACHE_PREFIX));
    
    await chrome.storage.local.remove(cacheKeys);
    logger.info(`Cache cleared: ${cacheKeys.length} items`);
  } catch (error) {
    logger.error('Cache clear failed', error);
  }
}
