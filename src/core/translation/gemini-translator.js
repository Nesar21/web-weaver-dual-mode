// VERSION: v1.0.1 | GEMINI CLOUD TRANSLATOR | LAST UPDATED: 2025-10-30
// Gemini Cloud API for 100+ language translation
// CRITICAL: Service Worker Compatible - Static Imports Only


/**
 * Gemini Cloud Translator
 * Uses Gemini API for unlimited language translation (100+ languages)
 * With caching support for optimal performance
 */


import { createLogger } from '../../utils/logger.js';
import { handleAIProviderError } from '../error-handling/error-handler.js';
import { getEndpointsConfig } from '../../utils/config-loader.js';


const logger = createLogger('GeminiTranslator');


// In-memory cache for translations
const translationCache = new Map();
const CACHE_SIZE_LIMIT = 1000;


/**
 * Check if Gemini Translator is configured
 * @param {string} apiKey - Gemini API key
 * @returns {boolean} True if configured
 */
export function isGeminiTranslatorAvailable(apiKey) {
  return !!apiKey && apiKey.length > 0;
}


/**
 * Get cache key for translation
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language
 * @param {string} sourceLang - Source language
 * @returns {string} Cache key
 */
function getCacheKey(text, targetLang, sourceLang) {
  return `${sourceLang}:${targetLang}:${text.substring(0, 100)}`;
}


/**
 * Add to cache with size limit
 * @param {string} key - Cache key
 * @param {string} value - Cached value
 */
function addToCache(key, value) {
  if (translationCache.size >= CACHE_SIZE_LIMIT) {
    const firstKey = translationCache.keys().next().value;
    translationCache.delete(firstKey);
  }
  translationCache.set(key, value);
}


/**
 * Safe JSON parse wrapper
 * @param {string} jsonString - JSON string to parse
 * @returns {Object|null} Parsed object or null
 */
function safeJSONParse(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    logger.error('JSON parse failed', e);
    return null;
  }
}


/**
 * Translate text using Gemini API
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: 'auto')
 * @param {Object} options - Translation options
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, targetLang, sourceLang = 'auto', options = {}) {
  try {
    logger.info(`Translating text with Gemini: ${sourceLang} → ${targetLang}`);

    const apiKey = options.apiKey;
    if (!apiKey) {
      throw new Error('Gemini API key not configured. Please add your API key in settings.');
    }

    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      logger.info('Source and target languages are the same');
      return text;
    }

    const cacheKey = getCacheKey(text, targetLang, sourceLang);
    if (translationCache.has(cacheKey)) {
      logger.info('Translation found in cache');
      return translationCache.get(cacheKey);
    }

    const config = await getEndpointsConfig();
    const endpoint = config.gemini;

    const sourceInstruction = sourceLang === 'auto' 
      ? 'Detect the source language and translate' 
      : `Translate from ${sourceLang}`;
    
    const prompt = `${sourceInstruction} to ${targetLang}. Return ONLY the translated text without any explanations, notes, or metadata.\n\nText to translate:\n"${text}"\n\nTranslation:`;

    const timeout = options.timeout || 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = safeJSONParse(await response.text());
      if (!data || !data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error('Invalid Gemini API response structure');
      }

      const translated = data.candidates[0].content.parts[0].text.trim();

      addToCache(cacheKey, translated);

      logger.info('Translation completed successfully');
      return translated;

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Translation timeout');
      }
      throw fetchError;
    }

  } catch (error) {
    const handled = handleAIProviderError(error, 'gemini_cloud');
    logger.error('Gemini translation failed', error);
    throw new Error(handled.userMessage);
  }
}


/**
 * Translate multiple texts (batch translation)
 * @param {Array<string>} texts - Array of texts to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: 'auto')
 * @param {Object} options - Translation options
 * @returns {Promise<Array<Object>>} Array of translation results
 */
export async function translateBatch(texts, targetLang, sourceLang = 'auto', options = {}) {
  try {
    logger.info(`Batch translating ${texts.length} items with Gemini: ${sourceLang} → ${targetLang}`);

    const apiKey = options.apiKey;
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    if (sourceLang !== 'auto' && sourceLang === targetLang) {
      return texts.map((text, index) => ({
        original: text,
        translated: text,
        success: true,
        index
      }));
    }

    const config = await getEndpointsConfig();
    const endpoint = config.gemini;

    const sourceInstruction = sourceLang === 'auto' 
      ? 'Detect the source language and translate each item' 
      : `Translate each item from ${sourceLang}`;
    
    const prompt = `${sourceInstruction} to ${targetLang}. Return ONLY the translations in the same order, one per line, without numbering or explanations.\n\nItems to translate:\n${texts.map((text, i) => `${i + 1}. ${text}`).join('\n')}\n\nTranslations:`;

    const timeout = options.timeout || 60000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = safeJSONParse(await response.text());
      if (!data || !data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error('Invalid Gemini API response structure');
      }

      const translationsText = data.candidates[0].content.parts[0].text.trim();
      
      const translations = translationsText
        .split('\n')
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(line => line.length > 0);

      const results = texts.map((original, index) => ({
        original,
        translated: translations[index] || original,
        success: true,
        index
      }));

      results.forEach(result => {
        if (result.success) {
          const cacheKey = getCacheKey(result.original, targetLang, sourceLang);
          addToCache(cacheKey, result.translated);
        }
      });

      logger.info('Batch translation completed successfully');
      return results;

    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Batch translation timeout');
      }
      throw fetchError;
    }

  } catch (error) {
    const handled = handleAIProviderError(error, 'gemini_cloud');
    logger.error('Gemini batch translation failed', error);
    throw new Error(handled.userMessage);
  }
}


/**
 * Clear translation cache
 */
export function clearCache() {
  translationCache.clear();
  logger.info('Translation cache cleared');
}


/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  return {
    size: translationCache.size,
    limit: CACHE_SIZE_LIMIT,
    usage: ((translationCache.size / CACHE_SIZE_LIMIT) * 100).toFixed(1) + '%'
  };
}


/**
 * Get translator capabilities
 * @returns {Object} Capabilities object
 */
export function getTranslatorCapabilities() {
  return {
    available: true,
    supportedLanguages: '100+',
    languageCount: 100,
    maxTextLength: 30000,
    supportsOffline: false,
    requiresApiKey: true,
    provider: 'gemini_cloud',
    cache: getCacheStats()
  };
}


/**
 * Get translator information
 * @returns {Object} Translator info
 */
export function getTranslatorInfo() {
  return {
    id: 'gemini_cloud_translator',
    name: 'Gemini Cloud Translator',
    provider: 'gemini_cloud',
    available: true,
    requiresApiKey: true,
    maxTextLength: 30000,
    supportsOffline: false,
    supportedLanguages: '100+',
    cache: getCacheStats()
  };
}
