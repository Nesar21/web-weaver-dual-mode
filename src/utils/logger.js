// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Logging Utility

/**
 * Logging Utility
 * Provides structured logging with levels, prefixes, and debug mode support
 * Respects user's debug_mode setting from configuration
 */

/**
 * Log levels in order of severity
 * @enum {string}
 */
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

/**
 * Current log level (loaded from settings)
 * @type {string}
 */
let currentLogLevel = LOG_LEVELS.ERROR;

/**
 * Debug mode flag (loaded from settings)
 * @type {boolean}
 */
let debugMode = false;

/**
 * Log level priority for filtering
 * @type {Object}
 */
const LOG_PRIORITY = {
  [LOG_LEVELS.DEBUG]: 0,
  [LOG_LEVELS.INFO]: 1,
  [LOG_LEVELS.WARN]: 2,
  [LOG_LEVELS.ERROR]: 3
};

/**
 * Initialize logger with settings
 * @param {Object} settings - Logger settings
 * @param {string} settings.log_level - Minimum log level to display
 * @param {boolean} settings.debug_mode - Enable debug mode
 */
export function initLogger(settings) {
  if (settings.log_level && LOG_LEVELS[settings.log_level.toUpperCase()]) {
    currentLogLevel = settings.log_level;
  }

  if (typeof settings.debug_mode === 'boolean') {
    debugMode = settings.debug_mode;
  }
}

/**
 * Check if a log level should be displayed
 * @param {string} level - Log level to check
 * @returns {boolean} True if level should be logged
 */
function shouldLog(level) {
  const messagePriority = LOG_PRIORITY[level] || 0;
  const currentPriority = LOG_PRIORITY[currentLogLevel] || 0;
  return messagePriority >= currentPriority;
}

/**
 * Format log message with timestamp and prefix
 * @param {string} prefix - Component prefix (e.g., 'Extractor', 'AIProvider')
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @returns {string} Formatted message
 */
function formatMessage(prefix, level, message) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const levelUpper = level.toUpperCase().padEnd(5, ' ');
  return `[${timestamp}] [${levelUpper}] [${prefix}] ${message}`;
}

/**
 * Log debug message
 * Only logged if debug_mode is enabled
 * @param {string} prefix - Component prefix
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments to log
 */
export function debug(prefix, message, ...args) {
  if (!debugMode || !shouldLog(LOG_LEVELS.DEBUG)) {
    return;
  }

  console.debug(formatMessage(prefix, LOG_LEVELS.DEBUG, message), ...args);
}

/**
 * Log info message
 * @param {string} prefix - Component prefix
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments to log
 */
export function info(prefix, message, ...args) {
  if (!shouldLog(LOG_LEVELS.INFO)) {
    return;
  }

  console.info(formatMessage(prefix, LOG_LEVELS.INFO, message), ...args);
}

/**
 * Log warning message
 * @param {string} prefix - Component prefix
 * @param {string} message - Log message
 * @param {...any} args - Additional arguments to log
 */
export function warn(prefix, message, ...args) {
  if (!shouldLog(LOG_LEVELS.WARN)) {
    return;
  }

  console.warn(formatMessage(prefix, LOG_LEVELS.WARN, message), ...args);
}

/**
 * Log error message
 * Always logged regardless of level
 * @param {string} prefix - Component prefix
 * @param {string} message - Log message
 * @param {Error} [err] - Error object
 * @param {...any} args - Additional arguments to log
 */
export function error(prefix, message, err, ...args) {
  const errorMessage = formatMessage(prefix, LOG_LEVELS.ERROR, message);
  if (err instanceof Error) {
    console.error(errorMessage, err, ...args);
  } else {
    console.error(errorMessage, err, ...args);
  }
}

/**
 * Log extraction event (specialized logger)
 * @param {string} stage - Extraction stage (start, progress, complete, error)
 * @param {Object} data - Event data
 */
export function logExtraction(stage, data) {
  const prefix = 'Extraction';
  switch (stage) {
    case 'start':
      info(prefix, `Starting extraction: ${data.mode} on ${data.url}`);
      break;
    case 'progress':
      debug(prefix, `Progress: ${data.percentage}%`, data);
      break;
    case 'complete':
      info(prefix, `Extraction complete: ${data.itemCount} items in ${data.duration}ms`);
      break;
    case 'error':
      error(prefix, `Extraction failed: ${data.error}`, data.errorObject);
      break;
    default:
      debug(prefix, `Unknown stage: ${stage}`, data);
  }
}

/**
 * Log AI provider event (specialized logger)
 * @param {string} provider - Provider name (chrome_ai or gemini_cloud)
 * @param {string} event - Event type (request, response, error, rate_limit)
 * @param {Object} data - Event data
 */
export function logAIProvider(provider, event, data) {
  const prefix = `AI-${provider}`;
  switch (event) {
    case 'request':
      debug(prefix, `API request: ${data.model}`, data);
      break;
    case 'response':
      debug(prefix, `API response: ${data.responseTime}ms`, data);
      break;
    case 'error':
      error(prefix, `API error: ${data.error}`, data.errorObject);
      break;
    case 'rate_limit':
      warn(prefix, `Rate limit hit: ${data.limit}`, data);
      break;
    default:
      debug(prefix, `Unknown event: ${event}`, data);
  }
}

/**
 * Log rate limiting event (specialized logger)
 * @param {string} event - Event type (check, block, reset)
 * @param {Object} data - Event data
 */
export function logRateLimit(event, data) {
  const prefix = 'RateLimit';
  switch (event) {
    case 'check':
      debug(prefix, `Rate check: ${data.current}/${data.limit} (${data.type})`);
      break;
    case 'block':
      warn(prefix, `Request blocked: Rate limit reached`, data);
      break;
    case 'reset':
      info(prefix, `Rate limit reset: ${data.type}`, data);
      break;
    default:
      debug(prefix, `Unknown event: ${event}`, data);
  }
}

/**
 * Log storage operation (specialized logger)
 * @param {string} operation - Operation type (read, write, delete)
 * @param {string} key - Storage key
 * @param {boolean} success - Operation success status
 * @param {Error} [err] - Error if operation failed
 */
export function logStorage(operation, key, success, err) {
  const prefix = 'Storage';
  if (success) {
    debug(prefix, `${operation} success: ${key}`);
  } else {
    error(prefix, `${operation} failed: ${key}`, err);
  }
}

/**
 * Create a prefixed logger for a specific component
 * Returns object with debug, info, warn, error methods
 * @param {string} componentName - Name of the component
 * @returns {Object} Logger object with methods
 */
export function createLogger(componentName) {
  return {
    debug: (message, ...args) => debug(componentName, message, ...args),
    info: (message, ...args) => info(componentName, message, ...args),
    warn: (message, ...args) => warn(componentName, message, ...args),
    error: (message, err, ...args) => error(componentName, message, err, ...args)
  };
}
