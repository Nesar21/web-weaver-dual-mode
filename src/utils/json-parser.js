// VERSION: v1.0.0 | LAST UPDATED: 2025-10-27 | FEATURE: JSON Parsing with Error Recovery

/**
 * JSON Parser with Error Recovery
 * Attempts to parse JSON with multiple recovery strategies for malformed input
 * Handles common AI output issues: markdown blocks, trailing commas, unescaped quotes
 */

import { createLogger } from './logger.js';

const logger = createLogger('JSONParser');

/**
 * Parse JSON with error recovery
 * @param {string} jsonString - JSON string to parse
 * @returns {Object} Parsed result {success: boolean, data: any, error: string|null}
 */
export function parseJSON(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return {
      success: false,
      data: null,
      error: 'Invalid input: JSON string is required'
    };
  }

  // Strategy 1: Direct parse (for valid JSON)
  try {
    const data = JSON.parse(jsonString);
    return {
      success: true,
      data,
      error: null
    };
  } catch (directError) {
    logger.debug('Direct parse failed, attempting recovery strategies');
  }

  // Strategy 2: Remove markdown code blocks
  let cleaned = removeMarkdownCodeBlocks(jsonString);
  try {
    const data = JSON.parse(cleaned);
    logger.info('Recovered JSON by removing markdown blocks');
    return {
      success: true,
      data,
      error: null
    };
  } catch (markdownError) {
    logger.debug('Markdown block removal failed');
  }

  // Strategy 3: Extract JSON from text
  cleaned = extractJSONFromText(jsonString);
  try {
    const data = JSON.parse(cleaned);
    logger.info('Recovered JSON by extracting from text');
    return {
      success: true,
      data,
      error: null
    };
  } catch (extractError) {
    logger.debug('JSON extraction failed');
  }

  // Strategy 4: Fix common syntax errors
  cleaned = fixCommonSyntaxErrors(jsonString);
  try {
    const data = JSON.parse(cleaned);
    logger.info('Recovered JSON by fixing syntax errors');
    return {
      success: true,
      data,
      error: null
    };
  } catch (syntaxError) {
    logger.debug('Syntax error fixing failed');
  }

  // Strategy 5: Remove trailing commas
  cleaned = removeTrailingCommas(jsonString);
  try {
    const data = JSON.parse(cleaned);
    logger.info('Recovered JSON by removing trailing commas');
    return {
      success: true,
      data,
      error: null
    };
  } catch (commaError) {
    logger.debug('Trailing comma removal failed');
  }

  // Strategy 6: Aggressive cleanup (last resort)
  cleaned = aggressiveCleanup(jsonString);
  try {
    const data = JSON.parse(cleaned);
    logger.warn('Recovered JSON using aggressive cleanup (may be lossy)');
    return {
      success: true,
      data,
      error: null
    };
  } catch (finalError) {
    logger.error('All JSON recovery strategies failed', finalError);
    return {
      success: false,
      data: null,
      error: `JSON parsing failed: ${finalError.message}`
    };
  }
}

/**
 * Remove markdown code blocks (```json ... `````` ... ```
 * ✅ FIXED: Now handles 3 backticks correctly!
 * @param {string} text - Text with potential markdown
 * @returns {string} Cleaned text
 */
function removeMarkdownCodeBlocks(text) {
  let cleaned = text.trim();
  
  // Remove opening ```json or ```
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '');
  
  // Remove closing ```
  cleaned = cleaned.replace(/\n?```\s*$/,'');
  
  return cleaned.trim();
}

/**
 * Extract JSON from text (find first { or [ and matching closing bracket)
 * @param {string} text - Text containing JSON
 * @returns {string} Extracted JSON
 */
function extractJSONFromText(text) {
  // Find first { or [
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  
  let startIndex = -1;
  let startChar = '';
  let endChar = '';
  
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIndex = firstBrace;
    startChar = '{';
    endChar = '}';
  } else if (firstBracket !== -1) {
    startIndex = firstBracket;
    startChar = '[';
    endChar = ']';
  } else {
    return text; // No JSON structure found
  }

  // Find matching closing bracket
  let depth = 0;
  let endIndex = -1;
  
  for (let i = startIndex; i < text.length; i++) {
    if (text[i] === startChar) depth++;
    if (text[i] === endChar) depth--;
    
    if (depth === 0) {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === -1) {
    return text; // No matching closing bracket
  }
  
  return text.slice(startIndex, endIndex + 1);
}

/**
 * Fix common syntax errors
 * @param {string} text - JSON with potential errors
 * @returns {string} Fixed JSON
 */
function fixCommonSyntaxErrors(text) {
  let fixed = text;
  
  // Fix single quotes (replace with double quotes)
  // Only replace quotes that look like string delimiters
  fixed = fixed.replace(/'/g, '"');
  
  // Fix undefined values
  fixed = fixed.replace(/:\s*undefined/g, ': null');
  
  // Fix NaN values
  fixed = fixed.replace(/:\s*NaN/g, ': null');
  
  return fixed;
}

/**
 * Remove trailing commas
 * @param {string} text - JSON with trailing commas
 * @returns {string} Cleaned JSON
 */
function removeTrailingCommas(text) {
  // Remove commas before closing braces or brackets
  let cleaned = text.replace(/,(\s*[}\]])/g, '$1');
  return cleaned;
}

/**
 * Aggressive cleanup (last resort, may be lossy)
 * @param {string} text - Malformed JSON
 * @returns {string} Aggressively cleaned JSON
 */
function aggressiveCleanup(text) {
  let cleaned = text;
  
  // Remove all markdown
  cleaned = removeMarkdownCodeBlocks(cleaned);
  
  // Extract JSON
  cleaned = extractJSONFromText(cleaned);
  
  // Fix syntax errors
  cleaned = fixCommonSyntaxErrors(cleaned);
  
  // Remove trailing commas
  cleaned = removeTrailingCommas(cleaned);
  
  // Remove control characters
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');
  
  return cleaned;
}

/**
 * Validate and parse JSON array
 * Ensures result is an array
 * @param {string} jsonString - JSON string
 * @returns {Object} Result {success: boolean, data: Array, error: string|null}
 */
export function parseJSONArray(jsonString) {
  const result = parseJSON(jsonString);
  
  if (!result.success) {
    return result;
  }
  
  if (!Array.isArray(result.data)) {
    return {
      success: false,
      data: null,
      error: 'Parsed JSON is not an array'
    };
  }
  
  return result;
}

/**
 * Validate and parse JSON object
 * Ensures result is an object (not array, not primitive)
 * @param {string} jsonString - JSON string
 * @returns {Object} Result {success: boolean, data: Object, error: string|null}
 */
export function parseJSONObject(jsonString) {
  const result = parseJSON(jsonString);
  
  if (!result.success) {
    return result;
  }
  
  if (typeof result.data !== 'object' || result.data === null || Array.isArray(result.data)) {
    return {
      success: false,
      data: null,
      error: 'Parsed JSON is not an object'
    };
  }
  
  return result;
}

/**
 * Safe JSON stringify with error handling
 * @param {any} data - Data to stringify
 * @param {number} indent - Indent spaces (default: 2)
 * @returns {Object} Result {success: boolean, data: string, error: string|null}
 */
export function safeStringify(data, indent = 2) {
  try {
    const jsonString = JSON.stringify(data, null, indent);
    return {
      success: true,
      data: jsonString,
      error: null
    };
  } catch (error) {
    logger.error('JSON stringify failed', error);
    return {
      success: false,
      data: null,
      error: `JSON stringify failed: ${error.message}`
    };
  }
}

/**
 * Repair broken JSON using multiple strategies
 * @param {string} brokenJSON - Broken JSON string
 * @returns {Object} Result {success: boolean, data: any, error: string|null, repairs: Array}
 */
export function repairJSON(brokenJSON) {
  const repairs = [];
  let current = brokenJSON;
  
  // Track which repairs were applied
  const strategies = [
    { name: 'Remove markdown', fn: removeMarkdownCodeBlocks },
    { name: 'Extract JSON', fn: extractJSONFromText },
    { name: 'Fix syntax', fn: fixCommonSyntaxErrors },
    { name: 'Remove trailing commas', fn: removeTrailingCommas }
  ];
  
  for (const strategy of strategies) {
    const before = current;
    current = strategy.fn(current);
    
    if (before !== current) {
      repairs.push(strategy.name);
    }
  }
  
  // Try parsing
  try {
    const data = JSON.parse(current);
    return {
      success: true,
      data,
      error: null,
      repairs
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error.message,
      repairs
    };
  }
}
