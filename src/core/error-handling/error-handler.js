// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Central Error Handler

/**
 * Central Error Handler
 * Categorizes errors, provides user-friendly messages, and handles error recovery
 * Integrates with notification system for transparent error reporting
 */

import { createLogger } from '../../utils/logger.js';
import { formatErrorMessage } from '../../utils/formatters.js';

const logger = createLogger('ErrorHandler');

/**
 * Error categories
 * @enum {string}
 */
export const ERROR_CATEGORY = {
  LIMITATION: 'limitation',      // Chrome AI unavailable, feature not supported
  TECHNICAL: 'technical',          // Network errors, parse errors, timeouts
  CONFIGURATION: 'configuration',  // Missing API key, invalid settings
  RATE_LIMIT: 'rate_limit',       // API rate limit exceeded
  VALIDATION: 'validation',        // Invalid input, validation failed
  UNKNOWN: 'unknown'               // Unclassified errors
};

/**
 * Error severity levels
 * @enum {string}
 */
export const ERROR_SEVERITY = {
  INFO: 'info',       // Informational, no action needed
  WARNING: 'warning', // Warning, operation may continue
  ERROR: 'error',     // Error, operation failed
  CRITICAL: 'critical' // Critical, extension functionality compromised
};

/**
 * Categorize error
 * @param {Error|string} error - Error to categorize
 * @param {Object} context - Error context
 * @returns {Object} Categorized error {category: string, severity: string, message: string, userMessage: string, recovery: string|null}
 */
export function categorizeError(error, context = {}) {
  const errorMessage = formatErrorMessage(error);
  const errorString = error?.message || String(error);

  // Chrome AI limitations
  if (errorString.includes('window.ai') || 
      errorString.includes('Chrome AI') || 
      errorString.includes('not available') ||
      errorString.includes('canCreateTextSession')) {
    return {
      category: ERROR_CATEGORY.LIMITATION,
      severity: ERROR_SEVERITY.WARNING,
      message: errorMessage,
      userMessage: 'Chrome Built-in AI is not available. Please enable it in chrome://flags or use Gemini Cloud API instead.',
      recovery: 'Switch to Gemini Cloud API or enable Chrome AI in browser flags'
    };
  }

  // API key issues
  if (errorString.includes('API key') || 
      errorString.includes('401') || 
      errorString.includes('403') ||
      errorString.includes('authentication')) {
    return {
      category: ERROR_CATEGORY.CONFIGURATION,
      severity: ERROR_SEVERITY.ERROR,
      message: errorMessage,
      userMessage: 'API key is missing or invalid. Please check your API key in settings.',
      recovery: 'Update API key in settings and try again'
    };
  }

  // Rate limit errors
  if (errorString.includes('429') || 
      errorString.includes('rate limit') || 
      errorString.includes('quota exceeded')) {
    return {
      category: ERROR_CATEGORY.RATE_LIMIT,
      severity: ERROR_SEVERITY.WARNING,
      message: errorMessage,
      userMessage: 'API rate limit reached. Please wait a moment before trying again.',
      recovery: 'Wait for rate limit reset or switch to a faster model'
    };
  }

  // Network errors
  if (errorString.includes('fetch') || 
      errorString.includes('network') || 
      errorString.includes('timeout') ||
      errorString.includes('ECONNREFUSED')) {
    return {
      category: ERROR_CATEGORY.TECHNICAL,
      severity: ERROR_SEVERITY.ERROR,
      message: errorMessage,
      userMessage: 'Network connection failed. Please check your internet connection.',
      recovery: 'Check internet connection and try again'
    };
  }

  // JSON parsing errors
  if (errorString.includes('JSON') || 
      errorString.includes('parse') || 
      errorString.includes('SyntaxError')) {
    return {
      category: ERROR_CATEGORY.TECHNICAL,
      severity: ERROR_SEVERITY.ERROR,
      message: errorMessage,
      userMessage: 'Failed to process AI response. The extracted data may be incomplete.',
      recovery: 'Try extraction again or use a different extraction mode'
    };
  }

  // Validation errors
  if (errorString.includes('validation') || 
      errorString.includes('invalid') || 
      context.isValidation) {
    return {
      category: ERROR_CATEGORY.VALIDATION,
      severity: ERROR_SEVERITY.WARNING,
      message: errorMessage,
      userMessage: 'Invalid input or settings. Please check your configuration.',
      recovery: 'Review and correct your settings'
    };
  }

  // Timeout errors
  if (errorString.includes('timeout') || 
      errorString.includes('timed out')) {
    return {
      category: ERROR_CATEGORY.TECHNICAL,
      severity: ERROR_SEVERITY.WARNING,
      message: errorMessage,
      userMessage: 'Operation timed out. The page may be too large or complex.',
      recovery: 'Try again with a simpler page or increase timeout settings'
    };
  }

  // Model not found
  if (errorString.includes('404') || 
      errorString.includes('not found')) {
    return {
      category: ERROR_CATEGORY.CONFIGURATION,
      severity: ERROR_SEVERITY.ERROR,
      message: errorMessage,
      userMessage: 'AI model not found. Please check your model selection.',
      recovery: 'Select a different model in settings'
    };
  }

  // Server errors
  if (errorString.includes('500') || 
      errorString.includes('503') || 
      errorString.includes('server error')) {
    return {
      category: ERROR_CATEGORY.TECHNICAL,
      severity: ERROR_SEVERITY.ERROR,
      message: errorMessage,
      userMessage: 'AI service is temporarily unavailable. Please try again later.',
      recovery: 'Wait a few moments and try again'
    };
  }

  // Unknown error
  return {
    category: ERROR_CATEGORY.UNKNOWN,
    severity: ERROR_SEVERITY.ERROR,
    message: errorMessage,
    userMessage: 'An unexpected error occurred. Please try again.',
    recovery: 'Try again or contact support if the problem persists'
  };
}

/**
 * Handle error with categorization and logging
 * @param {Error|string} error - Error to handle
 * @param {Object} context - Error context
 * @returns {Object} Categorized error
 */
export function handleError(error, context = {}) {
  const categorized = categorizeError(error, context);

  // Log based on severity
  switch (categorized.severity) {
    case ERROR_SEVERITY.INFO:
      logger.info(categorized.message, context);
      break;
    case ERROR_SEVERITY.WARNING:
      logger.warn(categorized.message, context);
      break;
    case ERROR_SEVERITY.ERROR:
      logger.error(categorized.message, error, context);
      break;
    case ERROR_SEVERITY.CRITICAL:
      logger.error(`CRITICAL: ${categorized.message}`, error, context);
      break;
  }

  return categorized;
}

/**
 * Handle extraction error
 * @param {Error} error - Extraction error
 * @param {Object} context - Extraction context
 * @returns {Object} Handled error
 */
export function handleExtractionError(error, context = {}) {
  const categorized = handleError(error, { ...context, operation: 'extraction' });

  // Add extraction-specific recovery suggestions
  if (categorized.category === ERROR_CATEGORY.TECHNICAL) {
    categorized.recovery = 'Try using "Extract Main Article" mode or refresh the page';
  }

  return categorized;
}

/**
 * Handle AI provider error
 * @param {Error} error - AI provider error
 * @param {string} provider - Provider ID (chrome_ai or gemini_cloud)
 * @returns {Object} Handled error
 */
export function handleAIProviderError(error, provider) {
  const categorized = handleError(error, { operation: 'ai_provider', provider });

  // Add provider-specific recovery suggestions
  if (provider === 'chrome_ai') {
    categorized.recovery = 'Switch to Gemini Cloud API for more reliable service';
  } else if (provider === 'gemini_cloud') {
    categorized.recovery = 'Check API key and rate limits in settings';
  }

  return categorized;
}

/**
 * Handle storage error
 * @param {Error} error - Storage error
 * @param {string} operation - Storage operation (read, write, delete)
 * @returns {Object} Handled error
 */
export function handleStorageError(error, operation) {
  const categorized = handleError(error, { operation: 'storage', storageOperation: operation });

  categorized.userMessage = `Failed to ${operation} data. Storage may be full or corrupted.`;
  categorized.recovery = 'Clear extension data in settings or free up browser storage';

  return categorized;
}

/**
 * Handle network error
 * @param {Error} error - Network error
 * @param {string} url - URL that failed
 * @returns {Object} Handled error
 */
export function handleNetworkError(error, url) {
  const categorized = handleError(error, { operation: 'network', url });

  categorized.userMessage = 'Network request failed. Check your internet connection.';
  categorized.recovery = 'Verify internet connection and try again';

  return categorized;
}

/**
 * Create error result object
 * @param {string} category - Error category
 * @param {string} message - Error message
 * @param {string} userMessage - User-friendly message
 * @returns {Object} Error result
 */
export function createErrorResult(category, message, userMessage) {
  return {
    success: false,
    error: {
      category,
      message,
      userMessage
    }
  };
}

/**
 * Check if error is recoverable
 * @param {Object} categorizedError - Categorized error
 * @returns {boolean} True if error is recoverable
 */
export function isRecoverable(categorizedError) {
  return categorizedError.recovery !== null && 
         categorizedError.severity !== ERROR_SEVERITY.CRITICAL;
}

/**
 * Get user-facing error notification
 * @param {Object} categorizedError - Categorized error
 * @returns {Object} Notification object {title: string, message: string, severity: string, actions: Array}
 */
export function getErrorNotification(categorizedError) {
  const notification = {
    title: getErrorTitle(categorizedError.category),
    message: categorizedError.userMessage,
    severity: categorizedError.severity,
    actions: []
  };

  // Add recovery action if available
  if (categorizedError.recovery) {
    notification.actions.push({
      label: 'How to fix',
      type: 'info',
      message: categorizedError.recovery
    });
  }

  // Add category-specific actions
  switch (categorizedError.category) {
    case ERROR_CATEGORY.CONFIGURATION:
      notification.actions.push({
        label: 'Open Settings',
        type: 'action',
        action: 'open_settings'
      });
      break;
    case ERROR_CATEGORY.LIMITATION:
      notification.actions.push({
        label: 'Switch Provider',
        type: 'action',
        action: 'switch_provider'
      });
      break;
    case ERROR_CATEGORY.RATE_LIMIT:
      notification.actions.push({
        label: 'View Rate Limits',
        type: 'action',
        action: 'view_rate_limits'
      });
      break;
  }

  return notification;
}

/**
 * Get error title based on category
 * @param {string} category - Error category
 * @returns {string} Error title
 * @private
 */
function getErrorTitle(category) {
  const titles = {
    [ERROR_CATEGORY.LIMITATION]: 'Feature Unavailable',
    [ERROR_CATEGORY.TECHNICAL]: 'Technical Error',
    [ERROR_CATEGORY.CONFIGURATION]: 'Configuration Error',
    [ERROR_CATEGORY.RATE_LIMIT]: 'Rate Limit Reached',
    [ERROR_CATEGORY.VALIDATION]: 'Validation Error',
    [ERROR_CATEGORY.UNKNOWN]: 'Error'
  };

  return titles[category] || 'Error';
}

// TEST SCENARIOS:
// 1. Categorize Chrome AI unavailable error
// 2. Categorize API key missing/invalid error (401/403)
// 3. Categorize rate limit error (429)
// 4. Categorize network error (fetch failed)
// 5. Categorize JSON parsing error
// 6. Categorize validation error
// 7. Categorize timeout error
// 8. Categorize model not found (404)
// 9. Categorize server error (500/503)
// 10. Categorize unknown error
// 11. Handle error with logging (different severity levels)
// 12. handleExtractionError with custom recovery
// 13. handleAIProviderError with provider-specific recovery
// 14. handleStorageError with operation context
// 15. isRecoverable returns correct value
// 16. getErrorNotification with actions
