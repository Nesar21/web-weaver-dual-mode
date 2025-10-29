// VERSION: v1.0.0 | CHROME AI TOKEN LIMITER | 2025-10-29

/**
 * Chrome AI Token Limiter
 * Limits HTML input size specifically for Chrome's built-in AI (Gemini Nano)
 * Max tokens: ~8,192 tokens ≈ 30,000 characters
 */

import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ChromeAILimiter');

// Chrome AI (Gemini Nano) limits
const CHROME_AI_MAX_TOKENS = 8192;
const CHARS_PER_TOKEN = 4; // Approximate
const MAX_CHARS = CHROME_AI_MAX_TOKENS * CHARS_PER_TOKEN; // ~32,768 characters
const SAFE_LIMIT = Math.floor(MAX_CHARS * 0.7); // Use 70% for safety = ~23,000 chars

/**
 * Limit HTML for Chrome AI
 * @param {string} html - HTML content
 * @param {string} provider - AI provider (chrome_ai or gemini)
 * @returns {string} Limited HTML
 */
export function limitForChromeAI(html, provider) {
  // Only limit for Chrome AI
  if (provider !== 'chrome_ai') {
    return html;
  }

  // Check if within limit
  if (html.length <= SAFE_LIMIT) {
    logger.debug(`HTML within Chrome AI limit: ${html.length} chars`);
    return html;
  }

  // Truncate to safe limit
  const truncated = html.substring(0, SAFE_LIMIT);
  logger.warn(`HTML truncated for Chrome AI: ${html.length} → ${truncated.length} chars`);
  
  return truncated;
}

/**
 * Check if HTML exceeds Chrome AI limit
 * @param {string} html - HTML content
 * @returns {boolean} True if exceeds limit
 */
export function exceedsChromeAILimit(html) {
  return html.length > SAFE_LIMIT;
}

/**
 * Get Chrome AI limits info
 * @returns {Object} Limits information
 */
export function getChromeAILimits() {
  return {
    maxTokens: CHROME_AI_MAX_TOKENS,
    maxChars: MAX_CHARS,
    safeLimit: SAFE_LIMIT,
    charsPerToken: CHARS_PER_TOKEN
  };
}

/**
 * Estimate token count
 * @param {string} text - Text to estimate
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
