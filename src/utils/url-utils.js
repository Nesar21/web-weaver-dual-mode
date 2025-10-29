// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: URL Utilities

/**
 * URL Utility Functions
 */

/**
 * Parse URL and extract components
 * @param {string} url - URL to parse
 * @returns {Object} Parsed URL components
 */
export function parseURL(url) {
  try {
    const urlObj = new URL(url);
    
    return {
      protocol: urlObj.protocol,
      host: urlObj.host,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
      origin: urlObj.origin
    };
  } catch (error) {
    return null;
  }
}

/**
 * Check if URL is valid
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get domain from URL
 * @param {string} url - URL
 * @returns {string} Domain
 */
export function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Normalize URL (remove trailing slash, fragments)
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 */
export function normalizeURL(url) {
  try {
    const urlObj = new URL(url);
    urlObj.hash = '';
    let normalized = urlObj.toString();
    
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    
    return normalized;
  } catch {
    return url;
  }
}
