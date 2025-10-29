// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: User-Facing Error Notifications

/**
 * Error Notification System
 * Displays user-friendly error notifications with actionable suggestions
 * Integrates with UI notification system for consistent messaging
 */

import { createLogger } from '../../utils/logger.js';
import { getErrorNotification } from './error-handler.js';

const logger = createLogger('ErrorNotifications');

/**
 * Notification types
 * @enum {string}
 */
export const NOTIFICATION_TYPE = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error'
};

/**
 * Active notifications registry
 * @type {Map<string, Object>}
 */
const activeNotifications = new Map();

/**
 * Show error notification
 * @param {Object} categorizedError - Categorized error from error-handler
 * @param {Object} options - Notification options
 * @returns {string} Notification ID
 */
export function showErrorNotification(categorizedError, options = {}) {
  const notification = getErrorNotification(categorizedError);
  
  const notificationData = {
    id: generateNotificationId(),
    type: mapSeverityToType(categorizedError.severity),
    title: notification.title,
    message: notification.message,
    actions: notification.actions,
    duration: options.duration || 5000,
    persistent: options.persistent || false,
    timestamp: Date.now()
  };
  
  logger.info(`Showing error notification: ${notification.title}`);
  
  // Store notification
  activeNotifications.set(notificationData.id, notificationData);
  
  // Send to UI
  sendNotificationToUI(notificationData);
  
  // Auto-dismiss if not persistent
  if (!notificationData.persistent) {
    setTimeout(() => {
      dismissNotification(notificationData.id);
    }, notificationData.duration);
  }
  
  return notificationData.id;
}

/**
 * Show success notification
 * @param {string} message - Success message
 * @param {Object} options - Notification options
 * @returns {string} Notification ID
 */
export function showSuccessNotification(message, options = {}) {
  const notificationData = {
    id: generateNotificationId(),
    type: NOTIFICATION_TYPE.SUCCESS,
    title: options.title || 'Success',
    message,
    actions: options.actions || [],
    duration: options.duration || 3000,
    persistent: false,
    timestamp: Date.now()
  };
  
  logger.info('Showing success notification');
  
  activeNotifications.set(notificationData.id, notificationData);
  sendNotificationToUI(notificationData);
  
  setTimeout(() => {
    dismissNotification(notificationData.id);
  }, notificationData.duration);
  
  return notificationData.id;
}

/**
 * Show info notification
 * @param {string} message - Info message
 * @param {Object} options - Notification options
 * @returns {string} Notification ID
 */
export function showInfoNotification(message, options = {}) {
  const notificationData = {
    id: generateNotificationId(),
    type: NOTIFICATION_TYPE.INFO,
    title: options.title || 'Information',
    message,
    actions: options.actions || [],
    duration: options.duration || 4000,
    persistent: options.persistent || false,
    timestamp: Date.now()
  };
  
  logger.info('Showing info notification');
  
  activeNotifications.set(notificationData.id, notificationData);
  sendNotificationToUI(notificationData);
  
  if (!notificationData.persistent) {
    setTimeout(() => {
      dismissNotification(notificationData.id);
    }, notificationData.duration);
  }
  
  return notificationData.id;
}

/**
 * Show warning notification
 * @param {string} message - Warning message
 * @param {Object} options - Notification options
 * @returns {string} Notification ID
 */
export function showWarningNotification(message, options = {}) {
  const notificationData = {
    id: generateNotificationId(),
    type: NOTIFICATION_TYPE.WARNING,
    title: options.title || 'Warning',
    message,
    actions: options.actions || [],
    duration: options.duration || 6000,
    persistent: options.persistent || false,
    timestamp: Date.now()
  };
  
  logger.warn('Showing warning notification');
  
  activeNotifications.set(notificationData.id, notificationData);
  sendNotificationToUI(notificationData);
  
  if (!notificationData.persistent) {
    setTimeout(() => {
      dismissNotification(notificationData.id);
    }, notificationData.duration);
  }
  
  return notificationData.id;
}

/**
 * Dismiss notification
 * @param {string} notificationId - ID of notification to dismiss
 */
export function dismissNotification(notificationId) {
  if (!activeNotifications.has(notificationId)) {
    return;
  }
  
  logger.debug(`Dismissing notification: ${notificationId}`);
  
  activeNotifications.delete(notificationId);
  
  // Send dismissal to UI
  sendDismissalToUI(notificationId);
}

/**
 * Dismiss all notifications
 */
export function dismissAllNotifications() {
  logger.info('Dismissing all notifications');
  
  for (const id of activeNotifications.keys()) {
    dismissNotification(id);
  }
}

/**
 * Get active notifications
 * @returns {Array<Object>} Array of active notifications
 */
export function getActiveNotifications() {
  return Array.from(activeNotifications.values());
}

/**
 * Send notification to UI
 * @param {Object} notification - Notification data
 * @private
 */
function sendNotificationToUI(notification) {
  // Send message to popup/content script
  chrome.runtime.sendMessage({
    type: 'SHOW_NOTIFICATION',
    notification
  }).catch(error => {
    // Popup may not be open, log but don't throw
    logger.debug('Failed to send notification to UI', error.message);
  });
}

/**
 * Send dismissal to UI
 * @param {string} notificationId - Notification ID
 * @private
 */
function sendDismissalToUI(notificationId) {
  chrome.runtime.sendMessage({
    type: 'DISMISS_NOTIFICATION',
    notificationId
  }).catch(error => {
    logger.debug('Failed to send dismissal to UI', error.message);
  });
}

/**
 * Map severity to notification type
 * @param {string} severity - Error severity
 * @returns {string} Notification type
 * @private
 */
function mapSeverityToType(severity) {
  const mapping = {
    'info': NOTIFICATION_TYPE.INFO,
    'warning': NOTIFICATION_TYPE.WARNING,
    'error': NOTIFICATION_TYPE.ERROR,
    'critical': NOTIFICATION_TYPE.ERROR
  };
  
  return mapping[severity] || NOTIFICATION_TYPE.ERROR;
}

/**
 * Generate unique notification ID
 * @returns {string} Notification ID
 * @private
 */
function generateNotificationId() {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Show extraction progress notification
 * @param {string} status - Progress status
 * @returns {string} Notification ID
 */
export function showExtractionProgress(status) {
  return showInfoNotification(status, {
    title: 'Extracting...',
    persistent: true
  });
}

/**
 * Show extraction complete notification
 * @param {number} itemCount - Number of items extracted
 * @param {number} duration - Extraction duration in ms
 * @returns {string} Notification ID
 */
export function showExtractionComplete(itemCount, duration) {
  const message = `Extracted ${itemCount} item${itemCount !== 1 ? 's' : ''} in ${Math.round(duration / 1000)}s`;
  return showSuccessNotification(message, {
    title: 'Extraction Complete'
  });
}

/**
 * Show rate limit warning
 * @param {string} limitType - Type of limit (RPM or RPD)
 * @param {number} remaining - Remaining requests
 * @returns {string} Notification ID
 */
export function showRateLimitWarning(limitType, remaining) {
  const message = `Approaching ${limitType} limit. ${remaining} requests remaining.`;
  return showWarningNotification(message, {
    title: 'Rate Limit Warning',
    actions: [
      {
        label: 'View Limits',
        type: 'action',
        action: 'view_rate_limits'
      }
    ]
  });
}

/**
 * Show API key required notification
 * @returns {string} Notification ID
 */
export function showAPIKeyRequired() {
  return showWarningNotification(
    'Gemini Cloud API requires an API key. Please add your key in settings.',
    {
      title: 'API Key Required',
      persistent: true,
      actions: [
        {
          label: 'Open Settings',
          type: 'action',
          action: 'open_settings'
        },
        {
          label: 'Get Free API Key',
          type: 'link',
          url: 'https://makersuite.google.com/app/apikey'
        }
      ]
    }
  );
}

/**
 * Show Chrome AI unavailable notification
 * @returns {string} Notification ID
 */
export function showChromeAIUnavailable() {
  return showInfoNotification(
    'Chrome Built-in AI is not available. Using Gemini Cloud API instead.',
    {
      title: 'AI Provider Changed',
      actions: [
        {
          label: 'Setup Chrome AI',
          type: 'link',
          url: 'chrome://flags/#optimization-guide-on-device-model'
        }
      ]
    }
  );
}

// TEST SCENARIOS:
// 1. Show error notification with categorized error
// 2. Show success notification
// 3. Show info notification
// 4. Show warning notification
// 5. Auto-dismiss non-persistent notifications after duration
// 6. Persistent notifications remain until manually dismissed
// 7. Dismiss specific notification by ID
// 8. Dismiss all notifications at once
// 9. Get list of active notifications
// 10. Notification sent to UI via chrome.runtime.sendMessage
// 11. Map severity to notification type correctly
// 12. Generate unique notification IDs
// 13. Show extraction progress notification (persistent)
// 14. Show extraction complete notification
// 15. Show rate limit warning with actions
// 16. Show API key required notification (persistent, with actions)
// 17. Show Chrome AI unavailable notification
