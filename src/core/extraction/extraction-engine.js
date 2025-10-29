// VERSION: v1.0.0 | LAST UPDATED: 2025-10-26 | FEATURE: Extraction Engine Main Orchestrator

/**
 * Extraction Engine
 * Main orchestrator for web data extraction
 * Coordinates preprocessing, AI extraction, and post-processing
 */

import { createLogger, logExtraction } from '../../utils/logger.js';
import { getCurrentProvider, getCurrentModel } from '../ai-providers/provider-manager.js';
import { getPromptsConfig } from '../../utils/config-loader.js';
import { getExtractionSettings } from '../storage/settings-storage.js';
import { handleExtractionError } from '../error-handling/error-handler.js';
import * as ChromeAI from '../ai-providers/chrome-ai/chrome-ai-provider.js';
import * as GeminiCloud from '../ai-providers/gemini-cloud/gemini-provider.js';

const logger = createLogger('ExtractionEngine');

/**
 * Extract data from current tab
 * @param {Object} options - Extraction options
 * @returns {Promise<Object>} Extraction result
 */
export async function extractFromCurrentTab(options = {}) {
  const startTime = Date.now();

  try {
    logExtraction('start', { 
      mode: options.mode || 'extract_all',
      url: 'current_tab'
    });

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('No active tab found');
    }

    // Load settings
    const settings = await getExtractionSettings();
    const mergedOptions = { ...settings, ...options };

    // Preprocess HTML
    const html = await extractHTML(tab.id, mergedOptions);

    // Capture screenshot if enabled
    let screenshot = null;
    if (mergedOptions.screenshot?.enabled && mergedOptions.mode === 'extract_main') {
      screenshot = await captureScreenshot(tab.id, mergedOptions.screenshot);
    }

    // Get AI provider and model
    const provider = await getCurrentProvider();
    const model = await getCurrentModel(provider);

    // Perform extraction
    const extractedData = await performExtraction(
      html,
      screenshot,
      mergedOptions,
      provider,
      model
    );

    // Calculate quality score if enabled
    let qualityScore = null;
    if (mergedOptions.smart_features?.quality_score?.enabled) {
      qualityScore = await calculateQualityScore(extractedData, provider, model);
    }

    // Build result
    const duration = Date.now() - startTime;
    const result = {
      success: true,
      data: extractedData,
      metadata: {
        url: tab.url,
        title: tab.title,
        mode: mergedOptions.mode,
        contentType: mergedOptions.content_type,
        provider,
        model,
        duration,
        timestamp: Date.now()
      },
      qualityScore: qualityScore?.overall_score || null,
      qualityMetrics: qualityScore || null
    };

    logExtraction('complete', {
      itemCount: Array.isArray(extractedData) ? extractedData.length : 1,
      duration
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    logExtraction('error', { error: error.message, duration });

    const handled = handleExtractionError(error, { duration });
    
    return {
      success: false,
      error: handled.userMessage,
      errorCategory: handled.category,
      metadata: {
        duration,
        timestamp: Date.now()
      }
    };
  }
}

/**
 * Extract HTML from tab
 * @param {number} tabId - Tab ID
 * @param {Object} options - Extraction options
 * @returns {Promise<string>} Preprocessed HTML
 * @private
 */
async function extractHTML(tabId, options) {
  try {
    logger.info('Extracting HTML from tab');

    // Inject content script if needed
    await ensureContentScript(tabId);

    // Get HTML from page
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: getPageHTML
    });

    if (!result || !result.result) {
      throw new Error('Failed to extract HTML from page');
    }

    let html = result.result;

    // Preprocess HTML
    html = preprocessHTML(html, options.preprocessing);

    // Check size limit
    const maxSizeKB = options.preprocessing?.max_html_size_kb || 500;
    const sizeKB = new Blob([html]).size / 1024;

    if (sizeKB > maxSizeKB) {
      logger.warn(`HTML size (${Math.round(sizeKB)}KB) exceeds limit (${maxSizeKB}KB), truncating`);
      html = truncateHTML(html, maxSizeKB);
    }

    logger.info(`HTML extracted and preprocessed (${Math.round(sizeKB)}KB)`);
    return html;

  } catch (error) {
    logger.error('HTML extraction failed', error);
    throw error;
  }
}

/**
 * Get page HTML (injected function)
 * @returns {string} Page HTML
 * @private
 */
function getPageHTML() {
  return document.documentElement.outerHTML;
}

/**
 * Preprocess HTML (remove scripts, styles, comments, etc.)
 * @param {string} html - Raw HTML
 * @param {Object} config - Preprocessing config
 * @returns {string} Preprocessed HTML
 * @private
 */
function preprocessHTML(html, config) {
  let processed = html;

  if (config?.remove_scripts) {
    processed = processed.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }

  if (config?.remove_styles) {
    processed = processed.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    processed = processed.replace(/\sstyle="[^"]*"/gi, '');
  }

  if (config?.remove_comments) {
    processed = processed.replace(/<!--[\s\S]*?-->/g, '');
  }

  if (config?.remove_navigation) {
    processed = processed.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');
    processed = processed.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '');
  }

  if (config?.remove_footer) {
    processed = processed.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
  }

  return processed;
}

/**
 * Truncate HTML to size limit
 * @param {string} html - HTML to truncate
 * @param {number} maxSizeKB - Max size in KB
 * @returns {string} Truncated HTML
 * @private
 */
function truncateHTML(html, maxSizeKB) {
  const maxBytes = maxSizeKB * 1024;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(html);

  if (encoded.length <= maxBytes) {
    return html;
  }

  // Truncate to max size
  const truncated = encoded.slice(0, maxBytes);
  const decoder = new TextDecoder();
  return decoder.decode(truncated);
}

/**
 * Capture screenshot from tab
 * @param {number} tabId - Tab ID
 * @param {Object} config - Screenshot config
 * @returns {Promise<string>} Screenshot data URL
 * @private
 */
async function captureScreenshot(tabId, config) {
  try {
    logger.info('Capturing screenshot');

    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: config.format || 'png',
      quality: config.quality || 90
    });

    // Resize if needed
    const resized = await resizeScreenshot(dataUrl, config);

    logger.info('Screenshot captured');
    return resized;

  } catch (error) {
    logger.error('Screenshot capture failed', error);
    return null; // Non-fatal, continue without screenshot
  }
}

/**
 * Resize screenshot if exceeds max dimensions
 * @param {string} dataUrl - Screenshot data URL
 * @param {Object} config - Screenshot config
 * @returns {Promise<string>} Resized data URL
 * @private
 */
async function resizeScreenshot(dataUrl, config) {
  const maxWidth = config.max_width || 1920;
  const maxHeight = config.max_height || 10000;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Check if resize needed
      if (width <= maxWidth && height <= maxHeight) {
        resolve(dataUrl);
        return;
      }

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Resize using canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/png'));
    };

    img.src = dataUrl;
  });
}

/**
 * Ensure content script is injected
 * @param {number} tabId - Tab ID
 * @returns {Promise<void>}
 * @private
 */
async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => { return true; }
    });
  } catch (error) {
    logger.warn('Content script injection check failed', error);
  }
}
/**
 * Perform extraction using AI provider
 * @param {string} html - Preprocessed HTML
 * @param {string|null} screenshot - Screenshot data URL
 * @param {Object} options - Extraction options
 * @param {string} provider - Provider ID
 * @param {string} model - Model ID
 * @returns {Promise<any>} Extracted data
 * @private
 */
async function performExtraction(html, screenshot, options, provider, model) {
  try {
    logger.info(`Performing extraction: ${options.mode} (${provider}/${model})`);

    // Detect content type if auto
    let contentType = options.content_type;
    if (contentType === 'auto') {
      contentType = await detectContentType(html);
      logger.info(`Auto-detected content type: ${contentType}`);
    }

    // Get prompt template
    const prompt = await getExtractionPrompt(contentType, options.mode);

    // Route to appropriate provider
    if (provider === 'chrome_ai') {
      return await extractWithChromeAI(html, prompt, options);
    } else if (provider === 'gemini_cloud') {
      return await extractWithGeminiCloud(html, screenshot, prompt, model, options);
    } else {
      throw new Error(`Unknown provider: ${provider}`);
    }

  } catch (error) {
    logger.error('Extraction performer failed', error);
    throw error;
  }
}

/**
 * Extract using Chrome Built-in AI
 * @param {string} html - HTML content
 * @param {string} prompt - Extraction prompt
 * @param {Object} options - Options
 * @returns {Promise<any>} Extracted data
 * @private
 */
async function extractWithChromeAI(html, prompt, options) {
  try {
    logger.info('Extracting with Chrome AI');

    const result = await ChromeAI.extractData(html, prompt, {
      temperature: 0.3,
      timeout: options.timeout_seconds * 1000 || 60000
    });

    return result.data;

  } catch (error) {
    logger.error('Chrome AI extraction failed', error);
    throw error;
  }
}

/**
 * Extract using Gemini Cloud
 * @param {string} html - HTML content
 * @param {string|null} screenshot - Screenshot data URL
 * @param {string} prompt - Extraction prompt
 * @param {string} model - Model ID
 * @param {Object} options - Options
 * @returns {Promise<any>} Extracted data
 * @private
 */
async function extractWithGeminiCloud(html, screenshot, prompt, model, options) {
  try {
    logger.info('Extracting with Gemini Cloud');

    // Use vision if screenshot available and model supports it
    if (screenshot && options.mode === 'extract_main') {
      const supportsVision = await GeminiCloud.supportsVision(model);
      
      if (supportsVision) {
        logger.info('Using multimodal extraction (HTML + screenshot)');
        const result = await GeminiCloud.extractDataWithVision(
          model,
          html,
          screenshot,
          prompt,
          {
            temperature: 0.3,
            timeout: options.timeout_seconds * 1000 || 60000
          }
        );
        return result.data;
      }
    }

    // Fallback to HTML-only extraction
    logger.info('Using HTML-only extraction');
    const result = await GeminiCloud.extractData(model, html, prompt, {
      temperature: 0.3,
      timeout: options.timeout_seconds * 1000 || 60000
    });

    return result.data;

  } catch (error) {
    logger.error('Gemini Cloud extraction failed', error);
    throw error;
  }
}

/**
 * Detect content type from HTML
 * @param {string} html - HTML content
 * @returns {Promise<string>} Content type (products, articles, jobs, posts, generic)
 * @private
 */
async function detectContentType(html) {
  try {
    logger.info('Detecting content type');

    // Load keyword mappings from config
    const config = await getPromptsConfig();
    const contentTypes = config.content_types;

    // Count keyword matches for each type
    const scores = {};
    const lowerHTML = html.toLowerCase();

    for (const [type, typeConfig] of Object.entries(contentTypes)) {
      scores[type] = 0;

      if (typeConfig.keywords) {
        for (const keyword of typeConfig.keywords) {
          const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
          const matches = lowerHTML.match(regex);
          scores[type] += matches ? matches.length : 0;
        }
      }
    }

    // Find type with highest score
    let maxScore = 0;
    let detectedType = 'generic';

    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedType = type;
      }
    }

    // Require minimum score to avoid false positives
    if (maxScore < 3) {
      detectedType = 'generic';
    }

    logger.info(`Content type detected: ${detectedType} (score: ${maxScore})`);
    return detectedType;

  } catch (error) {
    logger.error('Content type detection failed', error);
    return 'generic';
  }
}

/**
 * Get extraction prompt from config
 * @param {string} contentType - Content type
 * @param {string} mode - Extraction mode (extract_all or extract_main)
 * @returns {Promise<string>} Prompt template
 * @private
 */
async function getExtractionPrompt(contentType, mode) {
  try {
    const config = await getPromptsConfig();
    const promptKey = `${mode}_prompt`;

    if (contentType === 'generic') {
      return config.generic[promptKey];
    }

    const typeConfig = config.content_types[contentType];
    if (!typeConfig || !typeConfig[promptKey]) {
      logger.warn(`No prompt found for ${contentType}/${mode}, using generic`);
      return config.generic[promptKey];
    }

    return typeConfig[promptKey];

  } catch (error) {
    logger.error('Failed to get extraction prompt', error);
    throw error;
  }
}

/**
 * Calculate quality score for extracted data
 * @param {any} data - Extracted data
 * @param {string} provider - Provider ID
 * @param {string} model - Model ID
 * @returns {Promise<Object|null>} Quality score result
 * @private
 */
async function calculateQualityScore(data, provider, model) {
  try {
    logger.info('Calculating quality score');

    // Get quality scoring prompt
    const config = await getPromptsConfig();
    const prompt = config.quality_scoring.prompt;

    // Route to appropriate provider
    if (provider === 'chrome_ai') {
      return await ChromeAI.calculateQualityScore(data, prompt);
    } else if (provider === 'gemini_cloud') {
      return await GeminiCloud.calculateQualityScore(model, data, prompt);
    } else {
      logger.warn('Quality scoring not supported for this provider');
      return null;
    }

  } catch (error) {
    logger.error('Quality score calculation failed', error);
    return null; // Non-fatal, return null score
  }
}

/**
 * Apply smart features (deduplication, etc.)
 * @param {any} data - Extracted data
 * @param {Object} options - Smart features options
 * @param {string} provider - Provider ID
 * @param {string} model - Model ID
 * @returns {Promise<any>} Processed data
 */
export async function applySmartFeatures(data, options, provider, model) {
  let processed = data;

  try {
    // Deduplication
    if (options.deduplication?.enabled && Array.isArray(processed)) {
      logger.info('Applying deduplication');
      
      const config = await getPromptsConfig();
      const prompt = config.smart_features.deduplication.prompt;

      if (provider === 'gemini_cloud') {
        processed = await GeminiCloud.deduplicateItems(model, processed, prompt);
      } else {
        logger.warn('Deduplication only supported for Gemini Cloud');
      }
    }

    return processed;

  } catch (error) {
    logger.error('Smart features application failed', error);
    return data; // Return original data on error
  }
}

/**
 * Export data as CSV
 * @param {any} data - Data to export
 * @param {string} mode - CSV mode (standard, data_scientist, custom)
 * @param {string} provider - Provider ID
 * @param {string} model - Model ID
 * @returns {Promise<string>} CSV string
 */
export async function exportAsCSV(data, mode, provider, model) {
  try {
    logger.info(`Exporting as CSV (${mode})`);

    const config = await getPromptsConfig();
    const prompt = config.smart_features.csv_formatting.prompt;

    if (provider === 'gemini_cloud') {
      return await GeminiCloud.formatAsCSV(model, data, prompt, mode);
    } else {
      throw new Error('CSV export only supported for Gemini Cloud');
    }

  } catch (error) {
    logger.error('CSV export failed', error);
    throw error;
  }
}
/**
 * Generate comparisons for extracted items
 * @param {Array} items - Items to compare
 * @param {string} provider - Provider ID
 * @param {string} model - Model ID
 * @returns {Promise<Object>} Comparison result
 */
export async function generateComparisons(items, provider, model) {
  try {
    logger.info(`Generating comparisons for ${items.length} items`);

    if (!Array.isArray(items) || items.length < 2) {
      throw new Error('At least 2 items required for comparison');
    }

    const config = await getPromptsConfig();
    const prompt = config.smart_features.comparisons.prompt;

    if (provider === 'gemini_cloud') {
      return await GeminiCloud.generateComparisons(model, items, prompt);
    } else {
      throw new Error('Comparisons only supported for Gemini Cloud');
    }

  } catch (error) {
    logger.error('Comparison generation failed', error);
    throw error;
  }
}

/**
 * Generate recommendations for extracted items
 * @param {Array} items - Items to recommend from
 * @param {string} context - User context for personalization
 * @param {string} provider - Provider ID
 * @param {string} model - Model ID
 * @returns {Promise<Object>} Recommendations result
 */
export async function generateRecommendations(items, context, provider, model) {
  try {
    logger.info(`Generating recommendations (context: ${context})`);

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('At least 1 item required for recommendations');
    }

    const config = await getPromptsConfig();
    const prompt = config.smart_features.recommendations.prompt;

    if (provider === 'gemini_cloud') {
      return await GeminiCloud.generateRecommendations(model, items, context, prompt);
    } else {
      throw new Error('Recommendations only supported for Gemini Cloud');
    }

  } catch (error) {
    logger.error('Recommendation generation failed', error);
    throw error;
  }
}

/**
 * Detect trends in extracted items
 * @param {Array} items - Items to analyze for trends
 * @param {string} provider - Provider ID
 * @param {string} model - Model ID
 * @returns {Promise<Object>} Trends analysis result
 */
export async function detectTrends(items, provider, model) {
  try {
    logger.info(`Detecting trends in ${items.length} items`);

    if (!Array.isArray(items) || items.length < 10) {
      throw new Error('At least 10 items required for trend detection');
    }

    const config = await getPromptsConfig();
    const prompt = config.smart_features.trends.prompt;

    if (provider === 'gemini_cloud') {
      return await GeminiCloud.detectTrends(model, items, prompt);
    } else {
      throw new Error('Trend detection only supported for Gemini Cloud');
    }

  } catch (error) {
    logger.error('Trend detection failed', error);
    throw error;
  }
}

/**
 * Get extraction statistics
 * @param {any} data - Extracted data
 * @returns {Object} Statistics
 */
export function getExtractionStatistics(data) {
  const stats = {
    itemCount: 0,
    fieldCount: 0,
    completeness: 0,
    hasImages: false,
    hasPrices: false,
    hasLinks: false
  };

  try {
    if (Array.isArray(data)) {
      stats.itemCount = data.length;

      if (data.length > 0) {
        // Count fields from first item
        stats.fieldCount = Object.keys(data[0]).length;

        // Calculate average completeness
        let totalFields = 0;
        let filledFields = 0;

        data.forEach(item => {
          const keys = Object.keys(item);
          totalFields += keys.length;
          
          keys.forEach(key => {
            const value = item[key];
            if (value !== null && value !== undefined && value !== '') {
              filledFields++;
            }
          });
        });

        stats.completeness = totalFields > 0 
          ? Math.round((filledFields / totalFields) * 100) 
          : 0;

        // Check for common fields
        stats.hasImages = data.some(item => 
          item.image_url || item.image || item.thumbnail
        );
        stats.hasPrices = data.some(item => 
          item.price || item.cost || item.salary
        );
        stats.hasLinks = data.some(item => 
          item.url || item.link || item.href
        );
      }
    } else if (typeof data === 'object' && data !== null) {
      stats.itemCount = 1;
      stats.fieldCount = Object.keys(data).length;

      // Calculate completeness for single object
      const keys = Object.keys(data);
      const filledFields = keys.filter(key => {
        const value = data[key];
        return value !== null && value !== undefined && value !== '';
      }).length;

      stats.completeness = keys.length > 0 
        ? Math.round((filledFields / keys.length) * 100) 
        : 0;

      stats.hasImages = !!(data.image_url || data.image || data.thumbnail);
      stats.hasPrices = !!(data.price || data.cost || data.salary);
      stats.hasLinks = !!(data.url || data.link || data.href);
    }

    return stats;

  } catch (error) {
    logger.error('Failed to calculate extraction statistics', error);
    return stats;
  }
}

/**
 * Validate extraction result
 * @param {any} data - Extracted data
 * @returns {Object} Validation result {valid: boolean, errors: Array}
 */
export function validateExtractionResult(data) {
  const errors = [];

  if (data === null || data === undefined) {
    errors.push('Extraction result is null or undefined');
  } else if (Array.isArray(data) && data.length === 0) {
    errors.push('Extraction result is an empty array');
  } else if (typeof data === 'object' && Object.keys(data).length === 0) {
    errors.push('Extraction result is an empty object');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// TEST SCENARIOS:
// 1. Extract from current tab (extract_all mode)
// 2. Extract from current tab (extract_main mode with screenshot)
// 3. HTML extraction and preprocessing (remove scripts, styles, comments)
// 4. HTML size limit enforcement (truncate if >500KB)
// 5. Screenshot capture and resize
// 6. Content type auto-detection (products, articles, jobs, posts)
// 7. Content type detection with low score (fallback to generic)
// 8. Extraction with Chrome AI provider
// 9. Extraction with Gemini Cloud provider (HTML only)
// 10. Extraction with Gemini Cloud provider (HTML + screenshot)
// 11. Quality score calculation
// 12. Apply smart features (deduplication)
// 13. Export as CSV (standard, data_scientist, custom modes)
// 14. Generate comparisons (min 2 items)
// 15. Generate recommendations with context
// 16. Detect trends (min 10 items)
// 17. Get extraction statistics (item count, field count, completeness)
// 18. Validate extraction result (null, empty array, empty object)
// 19. Error handling for all operations
// 20. Logging for all stages (start, progress, complete, error)
