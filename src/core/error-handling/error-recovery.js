// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Error Recovery Strategies

/**
 * Error Recovery Strategies
 * Implements automatic recovery mechanisms for common errors
 * Provides retry logic, fallback strategies, and graceful degradation
 */

import { createLogger } from '../../utils/logger.js';
import { parseJSON } from '../../utils/json-parser.js';
import { ERROR_CATEGORY } from './error-handler.js';

const logger = createLogger('ErrorRecovery');

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000,
  BACKOFF_MULTIPLIER: 2,
  TIMEOUT_MS: 60000
};

/**
 * Retry an async operation with exponential backoff
 * @param {Function} operation - Async operation to retry
 * @param {Object} options - Retry options
 * @returns {Promise<any>} Operation result
 */
export async function retryWithBackoff(operation, options = {}) {
  const {
    maxRetries = RETRY_CONFIG.MAX_RETRIES,
    baseDelay = RETRY_CONFIG.BASE_DELAY_MS,
    multiplier = RETRY_CONFIG.BACKOFF_MULTIPLIER,
    timeout = RETRY_CONFIG.TIMEOUT_MS
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Attempt ${attempt + 1}/${maxRetries + 1}`);
      
      // Add timeout wrapper
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), timeout)
        )
      ]);
      
      logger.info(`Operation succeeded on attempt ${attempt + 1}`);
      return result;
      
    } catch (error) {
      lastError = error;
      logger.warn(`Attempt ${attempt + 1} failed: ${error.message}`);
      
      // Don't retry on certain errors
      if (shouldNotRetry(error)) {
        logger.info('Error not retryable, aborting');
        throw error;
      }
      
      // If not last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(multiplier, attempt);
        logger.debug(`Waiting ${delay}ms before retry`);
        await sleep(delay);
      }
    }
  }
  
  logger.error('All retry attempts failed', lastError);
  throw lastError;
}

/**
 * Check if error should not be retried
 * @param {Error} error - Error to check
 * @returns {boolean} True if should not retry
 * @private
 */
function shouldNotRetry(error) {
  const errorString = error?.message || String(error);
  
  // Don't retry authentication/authorization errors
  if (errorString.includes('401') || 
      errorString.includes('403') || 
      errorString.includes('invalid api key')) {
    return true;
  }
  
  // Don't retry validation errors
  if (errorString.includes('validation') || 
      errorString.includes('invalid input')) {
    return true;
  }
  
  // Don't retry model not found
  if (errorString.includes('404')) {
    return true;
  }
  
  return false;
}

/**
 * Recover from JSON parsing error
 * @param {string} jsonString - Malformed JSON string
 * @returns {Object} Result {success: boolean, data: any, error: string|null}
 */
export function recoverFromJSONError(jsonString) {
  logger.info('Attempting JSON error recovery');
  
  // Use JSON parser with recovery strategies
  const result = parseJSON(jsonString);
  
  if (result.success) {
    logger.info('JSON recovered successfully');
  } else {
    logger.error('JSON recovery failed', result.error);
  }
  
  return result;
}

/**
 * Recover from Chrome AI timeout
 * @param {Function} chromeAIOperation - Chrome AI operation that timed out
 * @param {Function} fallbackOperation - Fallback operation (e.g., Gemini Cloud)
 * @returns {Promise<any>} Result from fallback
 */
export async function recoverFromChromeAITimeout(chromeAIOperation, fallbackOperation) {
  logger.warn('Chrome AI timed out, attempting fallback');
  
  try {
    // Try Chrome AI with shorter timeout
    const result = await Promise.race([
      chromeAIOperation(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Chrome AI timeout')), 30000)
      )
    ]);
    
    return result;
    
  } catch (error) {
    logger.warn('Chrome AI failed, using fallback', error.message);
    
    // Use fallback operation
    if (fallbackOperation) {
      return await fallbackOperation();
    }
    
    throw new Error('Chrome AI unavailable and no fallback provided');
  }
}

/**
 * Recover from network failure
 * @param {Function} networkOperation - Network operation that failed
 * @param {Object} options - Recovery options
 * @returns {Promise<any>} Operation result
 */
export async function recoverFromNetworkFailure(networkOperation, options = {}) {
  logger.info('Attempting network failure recovery');
  
  // Retry with exponential backoff
  return await retryWithBackoff(networkOperation, {
    maxRetries: options.maxRetries || 3,
    baseDelay: options.baseDelay || 2000,
    timeout: options.timeout || 30000
  });
}

/**
 * Recover from rate limit exceeded
 * @param {Function} operation - Operation to retry after rate limit
 * @param {number} waitTimeSeconds - Seconds to wait before retry
 * @returns {Promise<any>} Operation result
 */
export async function recoverFromRateLimit(operation, waitTimeSeconds) {
  logger.info(`Rate limit hit, waiting ${waitTimeSeconds}s before retry`);
  
  await sleep(waitTimeSeconds * 1000);
  
  logger.info('Retrying after rate limit wait');
  return await operation();
}

/**
 * Recover from quota exceeded
 * @param {string} quotaType - Type of quota exceeded (rpm or rpd)
 * @param {Object} alternativeOptions - Alternative options (e.g., different model)
 * @returns {Object} Recovery suggestion
 */
export function recoverFromQuotaExceeded(quotaType, alternativeOptions = {}) {
  logger.warn(`Quota exceeded: ${quotaType}`);
  
  const recovery = {
    canRecover: false,
    suggestion: null,
    alternativeAction: null
  };
  
  if (quotaType === 'rpm') {
    // Can retry after minute reset
    recovery.canRecover = true;
    recovery.suggestion = 'Wait for rate limit window to reset (up to 60 seconds)';
    recovery.waitTime = 60;
  } else if (quotaType === 'rpd') {
    // Cannot recover until next day
    recovery.canRecover = false;
    recovery.suggestion = 'Daily quota exhausted. Try again after midnight UTC or upgrade API plan.';
  }
  
  // Suggest alternative model if available
  if (alternativeOptions.alternativeModel) {
    recovery.alternativeAction = {
      type: 'switch_model',
      model: alternativeOptions.alternativeModel,
      message: `Switch to ${alternativeOptions.alternativeModel} for more available quota`
    };
  }
  
  return recovery;
}

/**
 * Recover from invalid API key
 * @returns {Object} Recovery instructions
 */
export function recoverFromInvalidAPIKey() {
  logger.error('Invalid API key detected');
  
  return {
    canRecover: true,
    requiresUserAction: true,
    steps: [
      'Go to Extension Settings',
      'Enter a valid Gemini API key',
      'Get a free API key at https://makersuite.google.com/app/apikey',
      'Save and try extraction again'
    ],
    action: 'open_settings'
  };
}

/**
 * Graceful degradation for feature unavailability
 * @param {string} feature - Unavailable feature
 * @param {Object} alternatives - Alternative approaches
 * @returns {Object} Degradation strategy
 */
export function degradeGracefully(feature, alternatives = {}) {
  logger.info(`Feature unavailable: ${feature}, applying graceful degradation`);
  
  const degradation = {
    feature,
    available: false,
    alternative: null,
    message: null
  };
  
  switch (feature) {
    case 'chrome_ai':
      degradation.alternative = alternatives.geminiCloud ? 'gemini_cloud' : null;
      degradation.message = 'Chrome Built-in AI not available. Using Gemini Cloud API instead.';
      break;
      
    case 'screenshot':
      degradation.alternative = 'html_only';
      degradation.message = 'Screenshot capture failed. Using HTML-only extraction.';
      break;
      
    case 'deduplication':
      degradation.alternative = null;
      degradation.message = 'AI deduplication unavailable. Results may contain duplicates.';
      break;
      
    case 'quality_score':
      degradation.alternative = null;
      degradation.message = 'Quality scoring unavailable. Results provided without quality metrics.';
      break;
      
    default:
      degradation.message = `${feature} unavailable. Basic extraction will continue.`;
  }
  
  return degradation;
}

/**
 * Attempt automatic recovery based on error category
 * @param {Object} categorizedError - Categorized error from error-handler
 * @param {Function} operation - Original operation to retry
 * @param {Object} context - Recovery context
 * @returns {Promise<Object>} Recovery result
 */
export async function attemptAutoRecovery(categorizedError, operation, context = {}) {
  const { category } = categorizedError;
  
  logger.info(`Attempting auto-recovery for ${category} error`);
  
  switch (category) {
    case ERROR_CATEGORY.RATE_LIMIT:
      if (context.waitTime) {
        return await recoverFromRateLimit(operation, context.waitTime);
      }
      break;
      
    case ERROR_CATEGORY.TECHNICAL:
      if (context.isNetworkError) {
        return await recoverFromNetworkFailure(operation, context.retryOptions);
      }
      break;
      
    case ERROR_CATEGORY.LIMITATION:
      if (context.fallbackOperation) {
        return await context.fallbackOperation();
      }
      break;
  }
  
  logger.warn('No automatic recovery available for this error');
  return {
    recovered: false,
    error: categorizedError
  };
}

/**
 * Sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 * @private
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// TEST SCENARIOS:
// 1. Retry operation succeeds on first attempt
// 2. Retry operation succeeds on second attempt (with backoff)
// 3. Retry operation fails after max retries
// 4. Retry skips non-retryable errors (401, 403, 404)
// 5. Exponential backoff timing (1s, 2s, 4s)
// 6. Operation timeout after specified duration
// 7. JSON recovery with malformed JSON
// 8. Chrome AI timeout triggers fallback
// 9. Network failure recovery with retries
// 10. Rate limit recovery waits and retries
// 11. RPM quota recovery (can recover)
// 12. RPD quota recovery (cannot recover, suggests alternatives)
// 13. Invalid API key recovery instructions
// 14. Graceful degradation for Chrome AI unavailable
// 15. Graceful degradation for screenshot failure
// 16. Auto-recovery attempts based on error category
