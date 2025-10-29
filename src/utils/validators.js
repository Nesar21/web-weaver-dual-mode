// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Input Validation Utility

/**
 * Input Validation Utility
 * Provides validation functions for API keys, URLs, JSON, and other inputs
 */

import { createLogger } from './logger.js';

const logger = createLogger('Validators');

/**
 * Validate Gemini API key format
 * @param {string} apiKey - API key to validate
 * @returns {Object} Validation result {valid: boolean, error: string|null}
 */
export function validateGeminiApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    return {
      valid: false,
      error: 'API key is required'
    };
  }
  
  const trimmed = apiKey.trim();
  
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'API key cannot be empty'
    };
  }
  
  // Gemini API keys typically start with "AIza" and are 39 characters
  if (!trimmed.startsWith('AIza')) {
    return {
      valid: false,
      error: 'Invalid API key format (should start with "AIza")'
    };
  }
  
  if (trimmed.length !== 39) {
    return {
      valid: false,
      error: 'Invalid API key length (should be 39 characters)'
    };
  }
  
  // Check for valid characters (alphanumeric, underscore, hyphen)
  const validChars = /^[A-Za-z0-9_-]+$/;
  if (!validChars.test(trimmed)) {
    return {
      valid: false,
      error: 'API key contains invalid characters'
    };
  }
  
  return {
    valid: true,
    error: null
  };
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {Object} Validation result {valid: boolean, error: string|null}
 */
export function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return {
      valid: false,
      error: 'URL is required'
    };
  }
  
  try {
    const urlObj = new URL(url);
    
    // Check for valid protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        valid: false,
        error: 'URL must use http or https protocol'
      };
    }
    
    return {
      valid: true,
      error: null
    };
  } catch (e) {
    return {
      valid: false,
      error: 'Invalid URL format'
    };
  }
}

/**
 * Validate JSON string
 * @param {string} jsonString - JSON string to validate
 * @returns {Object} Validation result {valid: boolean, error: string|null, data: Object|null}
 */
export function validateJson(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return {
      valid: false,
      error: 'JSON string is required',
      data: null
    };
  }
  
  try {
    const data = JSON.parse(jsonString);
    return {
      valid: true,
      error: null,
      data
    };
  } catch (e) {
    return {
      valid: false,
      error: `Invalid JSON: ${e.message}`,
      data: null
    };
  }
}

/**
 * Validate extraction mode
 * @param {string} mode - Extraction mode to validate
 * @returns {Object} Validation result {valid: boolean, error: string|null}
 */
export function validateExtractionMode(mode) {
  const validModes = ['extract_all', 'extract_main'];
  
  if (!validModes.includes(mode)) {
    return {
      valid: false,
      error: `Invalid extraction mode. Must be one of: ${validModes.join(', ')}`
    };
  }
  
  return {
    valid: true,
    error: null
  };
}

/**
 * Validate content type
 * @param {string} contentType - Content type to validate
 * @returns {Object} Validation result {valid: boolean, error: string|null}
 */
export function validateContentType(contentType) {
  const validTypes = ['products', 'articles', 'jobs', 'posts', 'generic', 'auto'];
  
  if (!validTypes.includes(contentType)) {
    return {
      valid: false,
      error: `Invalid content type. Must be one of: ${validTypes.join(', ')}`
    };
  }
  
  return {
    valid: true,
    error: null
  };
}

/**
 * Validate provider ID
 * @param {string} providerId - Provider ID to validate
 * @returns {Object} Validation result {valid: boolean, error: string|null}
 */
export function validateProviderId(providerId) {
  const validProviders = ['chrome_ai', 'gemini_cloud'];
  
  if (!validProviders.includes(providerId)) {
    return {
      valid: false,
      error: `Invalid provider. Must be one of: ${validProviders.join(', ')}`
    };
  }
  
  return {
    valid: true,
    error: null
  };
}

/**
 * Validate model ID for Gemini Cloud
 * @param {string} modelId - Model ID to validate
 * @returns {Object} Validation result {valid: boolean, error: string|null}
 */
export function validateGeminiModelId(modelId) {
  const validModels = [
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro'
  ];
  
  if (!validModels.includes(modelId)) {
    return {
      valid: false,
      error: `Invalid model. Must be one of: ${validModels.join(', ')}`
    };
  }
  
  return {
    valid: true,
    error: null
  };
}

/**
 * Validate HTML content
 * @param {string} html - HTML content to validate
 * @returns {Object} Validation result {valid: boolean, error: string|null}
 */
export function validateHtml(html) {
  if (!html || typeof html !== 'string') {
    return {
      valid: false,
      error: 'HTML content is required'
    };
  }
  
  if (html.trim().length === 0) {
    return {
      valid: false,
      error: 'HTML content cannot be empty'
    };
  }
  
  // Check for basic HTML structure
  if (!html.includes('<') || !html.includes('>')) {
    return {
      valid: false,
      error: 'Invalid HTML format (no tags found)'
    };
  }
  
  return {
    valid: true,
    error: null
  };
}

/**
 * Validate screenshot data URL
 * @param {string} dataUrl - Data URL to validate
 * @returns {Object} Validation result {valid: boolean, error: string|null}
 */
export function validateScreenshotDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return {
      valid: false,
      error: 'Screenshot data URL is required'
    };
  }
  
  if (!dataUrl.startsWith('data:image/')) {
    return {
      valid: false,
      error: 'Invalid data URL format (must start with "data:image/")'
    };
  }
  
  if (!dataUrl.includes(';base64,')) {
    return {
      valid: false,
      error: 'Invalid data URL format (must include ";base64,")'
    };
  }
  
  return {
    valid: true,
    error: null
  };
}

/**
 * Validate quality score
 * @param {number} score - Quality score to validate (0-100)
 * @returns {Object} Validation result {valid: boolean, error: string|null}
 */
export function validateQualityScore(score) {
  if (typeof score !== 'number') {
    return {
      valid: false,
      error: 'Quality score must be a number'
    };
  }
  
  if (score < 0 || score > 100) {
    return {
      valid: false,
      error: 'Quality score must be between 0 and 100'
    };
  }
  
  if (!Number.isInteger(score)) {
    return {
      valid: false,
      error: 'Quality score must be an integer'
    };
  }
  
  return {
    valid: true,
    error: null
  };
}

/**
 * Validate rate limit value
 * @param {number} value - Rate limit value to validate
 * @param {number} limit - Maximum allowed value
 * @returns {Object} Validation result {valid: boolean, error: string|null}
 */
export function validateRateLimit(value, limit) {
  if (typeof value !== 'number' || typeof limit !== 'number') {
    return {
      valid: false,
      error: 'Rate limit values must be numbers'
    };
  }
  
  if (value < 0 || limit < 0) {
    return {
      valid: false,
      error: 'Rate limit values cannot be negative'
    };
  }
  
  if (!Number.isInteger(value) || !Number.isInteger(limit)) {
    return {
      valid: false,
      error: 'Rate limit values must be integers'
    };
  }
  
  return {
    valid: true,
    error: null
  };
}

/**
 * Validate settings object
 * @param {Object} settings - Settings object to validate
 * @returns {Object} Validation result {valid: boolean, errors: Array<string>}
 */
export function validateSettings(settings) {
  const errors = [];
  
  if (!settings || typeof settings !== 'object') {
    return {
      valid: false,
      errors: ['Settings must be an object']
    };
  }
  
  // Validate ai_provider if present
  if (settings.ai_provider) {
    const providerValidation = validateProviderId(settings.ai_provider.selected_provider);
    if (!providerValidation.valid) {
      errors.push(providerValidation.error);
    }
  }
  
  // Validate extraction mode if present
  if (settings.extraction?.mode) {
    const modeValidation = validateExtractionMode(settings.extraction.mode);
    if (!modeValidation.valid) {
      errors.push(modeValidation.error);
    }
  }
  
  // Validate content type if present
  if (settings.extraction?.content_type) {
    const typeValidation = validateContentType(settings.extraction.content_type);
    if (!typeValidation.valid) {
      errors.push(typeValidation.error);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// TEST SCENARIOS:
// 1. Valid Gemini API key (AIza... 39 chars)
// 2. Invalid API key (wrong prefix, wrong length, invalid chars)
// 3. Valid HTTP/HTTPS URLs
// 4. Invalid URLs (missing protocol, invalid format)
// 5. Valid JSON string parsing
// 6. Invalid JSON (syntax errors, malformed)
// 7. Valid extraction modes (extract_all, extract_main)
// 8. Invalid extraction mode (unknown mode)
// 9. Valid provider IDs (chrome_ai, gemini_cloud)
// 10. Valid model IDs for Gemini Cloud
// 11. Valid HTML content with tags
// 12. Invalid HTML (empty, no tags)
// 13. Valid screenshot data URL
// 14. Invalid data URL format
// 15. Valid quality score (0-100 integer)
// 16. Invalid quality score (negative, >100, float)
// 17. Valid rate limit values
// 18. Complex settings object validation
