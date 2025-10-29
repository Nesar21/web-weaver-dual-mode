// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Rate Limit Throttle UI

/**
 * Rate Limit Throttle UI
 * Manages countdown timers, wait messages, and quota displays
 * Provides real-time feedback when rate limits are hit
 */

import { createLogger } from '../../utils/logger.js';
import { formatCountdown, formatRateLimitDisplay } from '../../utils/formatters.js';
import { getRateLimitStatus } from './rate-limiter.js';

const logger = createLogger('ThrottleUI');

/**
 * Active countdown timers
 * @type {Map<string, number>}
 */
const activeCountdowns = new Map();

/**
 * Show wait UI with countdown
 * @param {string} limitType - Limit type (rpm or rpd)
 * @param {number} waitTimeSeconds - Wait time in seconds
 * @param {Function} onComplete - Callback when countdown completes
 * @returns {string} Countdown ID
 */
export function showWaitUI(limitType, waitTimeSeconds, onComplete) {
  const countdownId = `countdown_${limitType}_${Date.now()}`;
  
  logger.info(`Starting countdown: ${limitType}, ${waitTimeSeconds}s`);
  
  // Send initial wait message to UI
  sendWaitMessageToUI({
    id: countdownId,
    limitType,
    waitTime: waitTimeSeconds,
    message: getWaitMessage(limitType, waitTimeSeconds)
  });
  
  // Start countdown
  let remaining = waitTimeSeconds;
  
  const intervalId = setInterval(() => {
    remaining--;
    
    if (remaining <= 0) {
      clearInterval(intervalId);
      activeCountdowns.delete(countdownId);
      
      logger.info(`Countdown complete: ${countdownId}`);
      
      // Send completion message to UI
      sendCountdownCompleteToUI(countdownId);
      
      // Call completion callback
      if (onComplete) {
        onComplete();
      }
    } else {
      // Update countdown in UI
      sendCountdownUpdateToUI(countdownId, remaining);
    }
  }, 1000);
  
  activeCountdowns.set(countdownId, intervalId);
  
  return countdownId;
}

/**
 * Cancel countdown timer
 * @param {string} countdownId - Countdown ID to cancel
 */
export function cancelCountdown(countdownId) {
  if (!activeCountdowns.has(countdownId)) {
    return;
  }
  
  const intervalId = activeCountdowns.get(countdownId);
  clearInterval(intervalId);
  activeCountdowns.delete(countdownId);
  
  logger.debug(`Countdown cancelled: ${countdownId}`);
  
  // Send cancellation to UI
  sendCountdownCancelToUI(countdownId);
}

/**
 * Get wait message based on limit type
 * @param {string} limitType - Limit type (rpm or rpd)
 * @param {number} waitTime - Wait time in seconds
 * @returns {string} Wait message
 * @private
 */
function getWaitMessage(limitType, waitTime) {
  if (limitType === 'rpm') {
    return `Rate limit reached. Next extraction available in ${formatCountdown(waitTime)}.`;
  } else if (limitType === 'rpd') {
    const hours = Math.floor(waitTime / 3600);
    const minutes = Math.floor((waitTime % 3600) / 60);
    return `Daily quota exhausted. Resets at midnight UTC (${hours}h ${minutes}m remaining).`;
  }
  
  return `Rate limit reached. Please wait ${formatCountdown(waitTime)}.`;
}

/**
 * Update rate limit display
 * @param {string} modelId - Model ID
 * @returns {Promise<Object>} Display data for UI
 */
export async function updateRateLimitDisplay(modelId) {
  try {
    const status = await getRateLimitStatus(modelId);
    
    const displayData = {
      modelId,
      rpm: {
        current: status.rpm.current,
        limit: status.rpm.limit,
        percentage: status.rpm.percentage,
        display: formatRateLimitDisplay(status.rpm.current, status.rpm.limit, 'RPM'),
        progressColor: getProgressColor(status.rpm.percentage)
      },
      rpd: {
        current: status.rpd.current,
        limit: status.rpd.limit,
        percentage: status.rpd.percentage,
        display: formatRateLimitDisplay(status.rpd.current, status.rpd.limit, 'RPD'),
        progressColor: getProgressColor(status.rpd.percentage)
      }
    };
    
    // Send to UI
    sendRateLimitDisplayToUI(displayData);
    
    return displayData;
    
  } catch (error) {
    logger.error('Failed to update rate limit display', error, { modelId });
    return null;
  }
}

/**
 * Get progress bar color based on percentage
 * @param {number} percentage - Usage percentage (0-100)
 * @returns {string} CSS color
 * @private
 */
function getProgressColor(percentage) {
  if (percentage >= 90) {
    return '#ef4444'; // Red (danger)
  } else if (percentage >= 70) {
    return '#f59e0b'; // Orange (warning)
  } else if (percentage >= 50) {
    return '#eab308'; // Yellow (caution)
  } else {
    return '#10b981'; // Green (safe)
  }
}

/**
 * Show rate limit suggestion (switch model)
 * @param {string} currentModel - Current model ID
 * @param {string} suggestedModel - Suggested alternative model
 * @returns {void}
 */
export function showModelSwitchSuggestion(currentModel, suggestedModel) {
  logger.info(`Suggesting model switch: ${currentModel} → ${suggestedModel}`);
  
  sendModelSwitchSuggestionToUI({
    currentModel,
    suggestedModel,
    message: `Consider switching to ${suggestedModel} for more available requests.`
  });
}

/**
 * Send wait message to UI
 * @param {Object} data - Wait data
 * @private
 */
function sendWaitMessageToUI(data) {
  chrome.runtime.sendMessage({
    type: 'RATE_LIMIT_WAIT',
    data
  }).catch(error => {
    logger.debug('Failed to send wait message to UI', error.message);
  });
}

/**
 * Send countdown update to UI
 * @param {string} countdownId - Countdown ID
 * @param {number} remaining - Remaining seconds
 * @private
 */
function sendCountdownUpdateToUI(countdownId, remaining) {
  chrome.runtime.sendMessage({
    type: 'COUNTDOWN_UPDATE',
    data: {
      id: countdownId,
      remaining,
      formatted: formatCountdown(remaining)
    }
  }).catch(error => {
    logger.debug('Failed to send countdown update', error.message);
  });
}

/**
 * Send countdown complete to UI
 * @param {string} countdownId - Countdown ID
 * @private
 */
function sendCountdownCompleteToUI(countdownId) {
  chrome.runtime.sendMessage({
    type: 'COUNTDOWN_COMPLETE',
    data: { id: countdownId }
  }).catch(error => {
    logger.debug('Failed to send countdown complete', error.message);
  });
}

/**
 * Send countdown cancel to UI
 * @param {string} countdownId - Countdown ID
 * @private
 */
function sendCountdownCancelToUI(countdownId) {
  chrome.runtime.sendMessage({
    type: 'COUNTDOWN_CANCEL',
    data: { id: countdownId }
  }).catch(error => {
    logger.debug('Failed to send countdown cancel', error.message);
  });
}

/**
 * Send rate limit display to UI
 * @param {Object} displayData - Display data
 * @private
 */
function sendRateLimitDisplayToUI(displayData) {
  chrome.runtime.sendMessage({
    type: 'RATE_LIMIT_DISPLAY',
    data: displayData
  }).catch(error => {
    logger.debug('Failed to send rate limit display', error.message);
  });
}

/**
 * Send model switch suggestion to UI
 * @param {Object} suggestion - Suggestion data
 * @private
 */
function sendModelSwitchSuggestionToUI(suggestion) {
  chrome.runtime.sendMessage({
    type: 'MODEL_SWITCH_SUGGESTION',
    data: suggestion
  }).catch(error => {
    logger.debug('Failed to send model switch suggestion', error.message);
  });
}

/**
 * Cleanup all active countdowns
 * Called on extension unload or reset
 */
export function cleanupCountdowns() {
  logger.info('Cleaning up all active countdowns');
  
  for (const [id, intervalId] of activeCountdowns.entries()) {
    clearInterval(intervalId);
    sendCountdownCancelToUI(id);
  }
  
  activeCountdowns.clear();
}

/**
 * Get active countdowns
 * @returns {Array<string>} Array of countdown IDs
 */
export function getActiveCountdowns() {
  return Array.from(activeCountdowns.keys());
}

// TEST SCENARIOS:
// 1. Show wait UI with RPM countdown (60 seconds)
// 2. Show wait UI with RPD countdown (hours remaining)
// 3. Countdown updates every second
// 4. Countdown completes and calls onComplete callback
// 5. Cancel countdown before completion
// 6. Update rate limit display with current status
// 7. Progress bar color changes based on usage (green < 50%, yellow < 70%, orange < 90%, red >= 90%)
// 8. Show model switch suggestion
// 9. Multiple simultaneous countdowns tracked
// 10. Cleanup all countdowns on reset
// 11. Get list of active countdown IDs
// 12. Messages sent to UI via chrome.runtime.sendMessage
// 13. Format countdown timer (MM:SS)
// 14. Format rate limit display (current/limit unit)
// 15. Wait message varies by limit type
