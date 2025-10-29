// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Data Formatting Utility

/**
 * Data Formatting Utility
 * Provides formatting functions for dates, numbers, file sizes, durations, etc.
 */

/**
 * Format timestamp to human-readable string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted date string
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Format relative time (e.g., "2 minutes ago")
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Relative time string
 */
export function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  } else if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
}

/**
 * Format duration in milliseconds to human-readable string
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export function formatDuration(milliseconds) {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s` 
      : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 
    ? `${hours}h ${remainingMinutes}m` 
    : `${hours}h`;
}

/**
 * Format file size in bytes to human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format percentage
 * @param {number} value - Value between 0 and 100
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, decimals = 0) {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format API key for display (mask middle characters)
 * @param {string} apiKey - API key to mask
 * @param {number} visibleChars - Number of visible characters at start/end
 * @returns {string} Masked API key
 */
export function formatApiKeyDisplay(apiKey, visibleChars = 4) {
  if (!apiKey || apiKey.length <= visibleChars * 2) {
    return apiKey;
  }
  
  const start = apiKey.slice(0, visibleChars);
  const end = apiKey.slice(-visibleChars);
  const maskLength = apiKey.length - (visibleChars * 2);
  const mask = '*'.repeat(Math.min(maskLength, 8));
  
  return `${start}${mask}${end}`;
}

/**
 * Format filename for download
 * @param {string} template - Filename template (e.g., "web-weaver-{timestamp}")
 * @param {string} extension - File extension (e.g., "json", "csv")
 * @returns {string} Formatted filename
 */
export function formatFilename(template, extension) {
  const replacements = {
    '{timestamp}': formatTimestamp(Date.now()),
    '{date}': new Date().toISOString().split('T')[0],
    '{time}': new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-')
  };
  
  let filename = template;
  for (const [placeholder, value] of Object.entries(replacements)) {
    filename = filename.replace(placeholder, value);
  }
  
  return `${filename}.${extension}`;
}

/**
 * Format countdown timer (seconds to MM:SS)
 * @param {number} seconds - Seconds remaining
 * @returns {string} Formatted countdown
 */
export function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

/**
 * Format URL for display (truncate if too long)
 * @param {string} url - URL to format
 * @param {number} maxLength - Maximum length
 * @returns {string} Formatted URL
 */
export function formatUrlDisplay(url, maxLength = 50) {
  if (url.length <= maxLength) {
    return url;
  }
  
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;
    
    if (domain.length > maxLength - 10) {
      return domain.slice(0, maxLength - 3) + '...';
    }
    
    const availableLength = maxLength - domain.length - 3;
    if (path.length > availableLength) {
      return `${domain}${path.slice(0, availableLength)}...`;
    }
    
    return `${domain}${path}`;
  } catch (e) {
    return url.slice(0, maxLength - 3) + '...';
  }
}

/**
 * Format JSON for display (pretty print)
 * @param {Object} obj - Object to format
 * @param {number} indent - Indent spaces
 * @returns {string} Formatted JSON
 */
export function formatJsonDisplay(obj, indent = 2) {
  return JSON.stringify(obj, null, indent);
}

/**
 * Format quality score color
 * @param {number} score - Quality score (0-100)
 * @returns {string} CSS color code
 */
export function formatQualityScoreColor(score) {
  if (score >= 80) return '#10b981'; // Green (excellent)
  if (score >= 60) return '#f59e0b'; // Yellow (good)
  if (score >= 40) return '#f97316'; // Orange (fair)
  return '#ef4444'; // Red (poor)
}

/**
 * Format quality score label
 * @param {number} score - Quality score (0-100)
 * @returns {string} Quality label
 */
export function formatQualityScoreLabel(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix for truncated text
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength, suffix = '...') {
  if (!text || text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Format rate limit display
 * @param {number} current - Current count
 * @param {number} limit - Maximum limit
 * @param {string} unit - Unit label (e.g., "RPM", "RPD")
 * @returns {string} Formatted rate limit
 */
export function formatRateLimitDisplay(current, limit, unit) {
  return `${current}/${limit} ${unit}`;
}

/**
 * Format error message for user display
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export function formatErrorMessage(error) {
  if (!error) {
    return 'Unknown error occurred';
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
}

/**
 * Format extraction result summary
 * @param {Object} result - Extraction result
 * @returns {string} Summary text
 */
export function formatExtractionSummary(result) {
  const itemCount = Array.isArray(result.data) ? result.data.length : 1;
  const duration = result.duration || 0;
  const score = result.qualityScore || 0;
  
  return `Extracted ${itemCount} item${itemCount !== 1 ? 's' : ''} in ${formatDuration(duration)} (Quality: ${score}%)`;
}

// TEST SCENARIOS:
// 1. Format current timestamp
// 2. Format relative time (seconds, minutes, hours, days ago)
// 3. Format duration (milliseconds, seconds, minutes, hours)
// 4. Format file size (bytes to GB)
// 5. Format large numbers with thousands separator
// 6. Format percentage with/without decimals
// 7. Mask API key (show only first/last 4 chars)
// 8. Format filename with template replacements
// 9. Format countdown timer (seconds to MM:SS)
// 10. Truncate long URLs for display
// 11. Pretty print JSON with indentation
// 12. Quality score color mapping
// 13. Quality score label mapping
// 14. Truncate long text with custom suffix
// 15. Format rate limit display (current/limit unit)
// 16. Format error messages (string, Error object, unknown)
// 17. Format extraction result summary
