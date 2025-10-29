// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Date Utilities

/**
 * Date Utility Functions
 */

/**
 * Format date to ISO string
 * @param {Date} date - Date object
 * @returns {string} ISO date string
 */
export function formatISO(date = new Date()) {
  return date.toISOString();
}

/**
 * Format date to human-readable string
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
export function formatDate(date = new Date()) {
  return date.toLocaleString();
}

/**
 * Get timestamp in milliseconds
 * @returns {number} Timestamp
 */
export function getTimestamp() {
  return Date.now();
}

/**
 * Calculate duration between two timestamps
 * @param {number} start - Start timestamp
 * @param {number} end - End timestamp
 * @returns {number} Duration in ms
 */
export function getDuration(start, end = Date.now()) {
  return end - start;
}

/**
 * Format duration to human-readable string
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
