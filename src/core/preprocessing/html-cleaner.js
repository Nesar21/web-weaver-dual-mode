// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: HTML Preprocessing

/**
 * HTML Cleaner
 * Removes unnecessary elements from HTML before extraction
 */

import { createLogger } from '../../utils/logger.js';
import { loadSettings } from '../storage/settings-storage.js';

const logger = createLogger('HTMLCleaner');

/**
 * Clean HTML based on settings
 * @param {string} html - Raw HTML
 * @returns {Promise<string>} Cleaned HTML
 */
export async function cleanHTML(html) {
  try {
    const settings = await loadSettings();
    const config = settings.preprocessing || {};
    
    let cleaned = html;
    
    if (config.remove_scripts !== false) {
      cleaned = removeScripts(cleaned);
    }
    
    if (config.remove_styles !== false) {
      cleaned = removeStyles(cleaned);
    }
    
    if (config.remove_comments !== false) {
      cleaned = removeComments(cleaned);
    }
    
    if (config.remove_navigation !== false) {
      cleaned = removeNavigation(cleaned);
    }
    
    if (config.remove_footer !== false) {
      cleaned = removeFooter(cleaned);
    }
    
    // Truncate if too large
    const maxSize = (config.max_html_size_kb || 500) * 1024;
    if (cleaned.length > maxSize) {
      cleaned = cleaned.substring(0, maxSize);
      logger.warn(`HTML truncated to ${maxSize} bytes`);
    }
    
    logger.debug(`HTML cleaned: ${html.length} → ${cleaned.length} bytes`);
    return cleaned;
    
  } catch (error) {
    logger.error('HTML cleaning failed', error);
    return html;
  }
}

function removeScripts(html) {
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

function removeStyles(html) {
  return html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
}

function removeComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

function removeNavigation(html) {
  return html.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
}

function removeFooter(html) {
  return html.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
}
