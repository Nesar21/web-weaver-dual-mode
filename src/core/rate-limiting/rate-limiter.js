// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Rate Limiter Main Controller

/**
 * Rate Limiter Main Controller
 * Coordinates RPM and RPD tracking, enforces limits, and manages throttling
 * Integrates with UI for countdown timers and progress bars
 */

import { getRateLimitForModel } from '../../utils/config-loader.js';
import { createLogger, logRateLimit } from '../../utils/logger.js';
import { get, set, STORAGE_TYPE } from '../storage/storage-manager.js';
import { showRateLimitWarning } from '../error-handling/notifications.js';

const logger = createLogger('RateLimiter');

/**
 * In-memory RPM tracking
 * @type {Map<string, Object>}
 */
const rpmTracking = new Map();

/**
 * Check if request is allowed under rate limits
 * @param {string} modelId - Model ID to check limits for
 * @returns {Promise<Object>} Result {allowed: boolean, reason: string|null, waitTime: number}
 */
export async function checkRateLimit(modelId) {
  try {
    // Get rate limit config for model
    const limitConfig = await getRateLimitForModel(modelId);
    
    if (!limitConfig) {
      // No limits configured (e.g., Chrome AI)
      logRateLimit('check', { modelId, result: 'no_limits' });
      return { allowed: true, reason: null, waitTime: 0 };
    }
    
    // Check RPM limit
    const rpmCheck = await checkRPM(modelId, limitConfig.rpm);
    if (!rpmCheck.allowed) {
      logRateLimit('block', { modelId, type: 'rpm', ...rpmCheck });
      return rpmCheck;
    }
    
    // Check RPD limit
    const rpdCheck = await checkRPD(modelId, limitConfig.rpd);
    if (!rpdCheck.allowed) {
      logRateLimit('block', { modelId, type: 'rpd', ...rpdCheck });
      return rpdCheck;
    }
    
    logRateLimit('check', { modelId, result: 'allowed' });
    return { allowed: true, reason: null, waitTime: 0 };
    
  } catch (error) {
    logger.error('Rate limit check failed', error, { modelId });
    // Allow on error to avoid blocking legitimate requests
    return { allowed: true, reason: null, waitTime: 0 };
  }
}

/**
 * Record a request (increment counters)
 * @param {string} modelId - Model ID
 * @returns {Promise<void>}
 */
export async function recordRequest(modelId) {
  try {
    const limitConfig = await getRateLimitForModel(modelId);
    
    if (!limitConfig) {
      return; // No tracking needed
    }
    
    // Record RPM
    await recordRPM(modelId);
    
    // Record RPD
    await recordRPD(modelId);
    
    logger.debug(`Request recorded for ${modelId}`);
    
    // Check if approaching limits (for warnings)
    await checkWarningThresholds(modelId, limitConfig);
    
  } catch (error) {
    logger.error('Failed to record request', error, { modelId });
  }
}

/**
 * Get current rate limit status
 * @param {string} modelId - Model ID
 * @returns {Promise<Object>} Status {rpm: Object, rpd: Object}
 */
export async function getRateLimitStatus(modelId) {
  try {
    const limitConfig = await getRateLimitForModel(modelId);
    
    if (!limitConfig) {
      return {
        rpm: { current: 0, limit: Infinity, percentage: 0 },
        rpd: { current: 0, limit: Infinity, percentage: 0 }
      };
    }
    
    const rpmCurrent = await getCurrentRPM(modelId);
    const rpdCurrent = await getCurrentRPD(modelId);
    
    return {
      rpm: {
        current: rpmCurrent,
        limit: limitConfig.rpm.limit,
        percentage: Math.round((rpmCurrent / limitConfig.rpm.limit) * 100)
      },
      rpd: {
        current: rpdCurrent,
        limit: limitConfig.rpd.limit,
        percentage: Math.round((rpdCurrent / limitConfig.rpd.limit) * 100)
      }
    };
    
  } catch (error) {
    logger.error('Failed to get rate limit status', error, { modelId });
    return {
      rpm: { current: 0, limit: 0, percentage: 0 },
      rpd: { current: 0, limit: 0, percentage: 0 }
    };
  }
}

/**
 * Check RPM limit
 * @param {string} modelId - Model ID
 * @param {Object} rpmConfig - RPM configuration
 * @returns {Promise<Object>} Check result
 * @private
 */
async function checkRPM(modelId, rpmConfig) {
  const current = await getCurrentRPM(modelId);
  
  if (current >= rpmConfig.limit) {
    const waitTime = await getTimeUntilRPMReset(modelId);
    return {
      allowed: false,
      reason: 'RPM limit exceeded',
      waitTime,
      limitType: 'rpm'
    };
  }
  
  return { allowed: true, reason: null, waitTime: 0 };
}

/**
 * Check RPD limit
 * @param {string} modelId - Model ID
 * @param {Object} rpdConfig - RPD configuration
 * @returns {Promise<Object>} Check result
 * @private
 */
async function checkRPD(modelId, rpdConfig) {
  const current = await getCurrentRPD(modelId);
  
  if (current >= rpdConfig.limit) {
    const waitTime = await getTimeUntilRPDReset();
    return {
      allowed: false,
      reason: 'Daily limit exceeded',
      waitTime,
      limitType: 'rpd'
    };
  }
  
  return { allowed: true, reason: null, waitTime: 0 };
}

/**
 * Get current RPM count
 * @param {string} modelId - Model ID
 * @returns {Promise<number>} Current RPM count
 * @private
 */
async function getCurrentRPM(modelId) {
  const key = `rpm_${modelId}`;
  
  if (!rpmTracking.has(key)) {
    return 0;
  }
  
  const tracking = rpmTracking.get(key);
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  
  // Filter requests within last minute
  const recentRequests = tracking.requests.filter(timestamp => timestamp > oneMinuteAgo);
  
  // Update tracking
  tracking.requests = recentRequests;
  rpmTracking.set(key, tracking);
  
  return recentRequests.length;
}

/**
 * Get current RPD count
 * @param {string} modelId - Model ID
 * @returns {Promise<number>} Current RPD count
 * @private
 */
async function getCurrentRPD(modelId) {
  const key = `rpd_${modelId}`;
  const today = getTodayKey();
  
  const data = await get(key, STORAGE_TYPE.LOCAL) || {};
  
  if (data.date !== today) {
    // New day, reset counter
    return 0;
  }
  
  return data.count || 0;
}

/**
 * Record RPM request
 * @param {string} modelId - Model ID
 * @returns {Promise<void>}
 * @private
 */
async function recordRPM(modelId) {
  const key = `rpm_${modelId}`;
  const now = Date.now();
  
  if (!rpmTracking.has(key)) {
    rpmTracking.set(key, { requests: [] });
  }
  
  const tracking = rpmTracking.get(key);
  tracking.requests.push(now);
  
  // Clean old requests (older than 1 minute)
  const oneMinuteAgo = now - 60000;
  tracking.requests = tracking.requests.filter(timestamp => timestamp > oneMinuteAgo);
  
  rpmTracking.set(key, tracking);
}

/**
 * Record RPD request
 * @param {string} modelId - Model ID
 * @returns {Promise<void>}
 * @private
 */
async function recordRPD(modelId) {
  const key = `rpd_${modelId}`;
  const today = getTodayKey();
  
  const data = await get(key, STORAGE_TYPE.LOCAL) || {};
  
  if (data.date !== today) {
    // New day, reset counter
    data.date = today;
    data.count = 0;
  }
  
  data.count++;
  await set(key, data, STORAGE_TYPE.LOCAL);
}

/**
 * Get time until RPM reset (seconds)
 * @param {string} modelId - Model ID
 * @returns {Promise<number>} Seconds until reset
 * @private
 */
async function getTimeUntilRPMReset(modelId) {
  const key = `rpm_${modelId}`;
  
  if (!rpmTracking.has(key)) {
    return 0;
  }
  
  const tracking = rpmTracking.get(key);
  if (tracking.requests.length === 0) {
    return 0;
  }
  
  const oldestRequest = Math.min(...tracking.requests);
  const resetTime = oldestRequest + 60000; // 60 seconds after oldest request
  const now = Date.now();
  
  return Math.max(0, Math.ceil((resetTime - now) / 1000));
}

/**
 * Get time until RPD reset (seconds)
 * @returns {Promise<number>} Seconds until midnight UTC
 * @private
 */
async function getTimeUntilRPDReset() {
  const now = new Date();
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);
  
  const diff = midnight.getTime() - now.getTime();
  return Math.ceil(diff / 1000);
}

/**
 * Get today's date key (YYYY-MM-DD UTC)
 * @returns {string} Date key
 * @private
 */
function getTodayKey() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Check warning thresholds and show notifications
 * @param {string} modelId - Model ID
 * @param {Object} limitConfig - Limit configuration
 * @returns {Promise<void>}
 * @private
 */
async function checkWarningThresholds(modelId, limitConfig) {
  const status = await getRateLimitStatus(modelId);
  
  // Check RPM warning threshold
  if (status.rpm.current >= limitConfig.rpm.warning_threshold) {
    const remaining = limitConfig.rpm.limit - status.rpm.current;
    showRateLimitWarning('RPM', remaining);
  }
  
  // Check RPD warning threshold
  if (status.rpd.current >= limitConfig.rpd.warning_threshold) {
    const remaining = limitConfig.rpd.limit - status.rpd.current;
    showRateLimitWarning('RPD', remaining);
  }
}

/**
 * Reset rate limits for model (for testing/admin)
 * @param {string} modelId - Model ID
 * @returns {Promise<void>}
 */
export async function resetRateLimits(modelId) {
  // Clear RPM
  const rpmKey = `rpm_${modelId}`;
  rpmTracking.delete(rpmKey);
  
  // Clear RPD
  const rpdKey = `rpd_${modelId}`;
  await set(rpdKey, { date: getTodayKey(), count: 0 }, STORAGE_TYPE.LOCAL);
  
  logger.info(`Rate limits reset for ${modelId}`);
}

// TEST SCENARIOS:
// 1. Check rate limit with no limits configured (Chrome AI)
// 2. Check rate limit within limits (allowed)
// 3. Check rate limit with RPM exceeded (blocked)
// 4. Check rate limit with RPD exceeded (blocked)
// 5. Record request increments both RPM and RPD
// 6. RPM counter resets after 60 seconds
// 7. RPD counter resets at midnight UTC
// 8. Get rate limit status with current counts and percentages
// 9. Warning notification shown at threshold (90% of limit)
// 10. Multiple requests tracked correctly in same minute
// 11. Old RPM requests (>60s) filtered out
// 12. RPD persists across extension reloads (local storage)
// 13. Time until RPM reset calculated correctly
// 14. Time until RPD reset calculated correctly (seconds to midnight UTC)
// 15. Reset rate limits clears both RPM and RPD
