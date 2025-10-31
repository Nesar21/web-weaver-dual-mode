// VERSION: v1.0.1 | CHROME BUILT-IN TRANSLATOR | LAST UPDATED: 2025-10-30
// [EXPERIMENTAL] This module uses Chrome's experimental Translation API
// CRITICAL: Service Worker Compatible - Static Imports Only


/**
 * Chrome Built-in Translator
 * Integrates with Chrome's experimental Translation API (TranslateKit)
 * Supports 11 pre-downloaded language pairs for offline translation
 */


import { createLogger } from '../../utils/logger.js';
import { handleAIProviderError } from '../error-handling/error-handler.js';


const logger = createLogger('ChromeTranslator');


/**
 * Safe fetch wrapper for service worker context
 * @param {string} url - URL to fetch
 * @returns {Promise<any>} Parsed JSON response
 */
async function safeFetch(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Fetch failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    logger.error('Safe fetch failed', error);
    return null;
  }
}


/**
 * Check if Chrome Translation API is available
 * @returns {Promise<Object>} Availability status
 */
export async function isChromeTranslatorAvailable() {
  try {
    if (typeof self === 'undefined' || !self.translation || !self.translation.canTranslate) {
      return {
        available: false,
        reason: 'Chrome Translation API not available (Chrome 131+ required)'
      };
    }

    const canTranslate = await self.translation.canTranslate();
    
    return {
      available: canTranslate === 'readily' || canTranslate === 'after-download',
      status: canTranslate,
      reason: canTranslate === 'no' ? 'Translation not available for this device' : null
    };
  } catch (error) {
    logger.error('Translation availability check failed', error);
    return { available: false, reason: error.message };
  }
}


/**
 * Get supported language pairs
 * @returns {Promise<Array>} Array of supported language objects
 */
export async function getSupportedLanguages() {
  try {
    const config = await safeFetch(chrome.runtime.getURL('config/languages.json'));
    return config ? (config.chrome_ai_supported || []) : [];
  } catch (error) {
    logger.error('Failed to load supported languages', error);
    return [];
  }
}


/**
 * Check if specific language pair is supported
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {Promise<boolean>} True if supported
 */
export async function isLanguagePairSupported(sourceLang, targetLang) {
  try {
    if (!self.translation || !self.translation.canTranslate) {
      return false;
    }

    const availability = await self.translation.canTranslate({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang
    });

    return availability === 'readily' || availability === 'after-download';
  } catch (error) {
    logger.warn(`Language pair ${sourceLang} → ${targetLang} not supported`, error);
    return false;
  }
}


/**
 * Create translator instance
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @param {Object} options - Translation options
 * @returns {Promise<Object>} Translator instance
 */
async function createTranslator(sourceLang, targetLang, options = {}) {
  if (!self.translation || !self.translation.canTranslate) {
    throw new Error('Chrome Translation API not available. Please use Gemini Cloud API instead.');
  }

  try {
    logger.info(`Creating translator: ${sourceLang} → ${targetLang}`);

    const translator = await self.translation.createTranslator({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang
    });

    if (translator.ready) {
      translator.addEventListener('downloadprogress', (e) => {
        const progress = Math.round((e.loaded / e.total) * 100);
        logger.info(`Downloading translation model: ${progress}%`);
        
        if (options.onProgress) {
          options.onProgress(progress, `${sourceLang}→${targetLang}`);
        }

        try {
          chrome.runtime.sendMessage({
            type: 'TRANSLATION_DOWNLOAD_PROGRESS',
            lang: `${sourceLang}→${targetLang}`,
            progress
          });
        } catch (msgError) {
          // Silently fail in service worker context
        }
      });

      await translator.ready;
      logger.info('Translator ready');
    }

    return translator;

  } catch (error) {
    logger.error('Failed to create translator', error);
    throw error;
  }
}


/**
 * Translate text using Chrome AI
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: 'en')
 * @param {Object} options - Translation options
 * @returns {Promise<string>} Translated text
 */
export async function translateText(text, targetLang, sourceLang = 'en', options = {}) {
  let translator = null;

  try {
    logger.info(`Translating text: ${sourceLang} → ${targetLang}`);

    if (sourceLang === targetLang) {
      logger.info('Source and target languages are the same, returning original text');
      return text;
    }

    const availability = await isChromeTranslatorAvailable();
    if (!availability.available) {
      throw new Error(availability.reason || 'Chrome Translation API not available');
    }

    const supported = await isLanguagePairSupported(sourceLang, targetLang);
    if (!supported) {
      throw new Error(`Language pair ${sourceLang} → ${targetLang} not supported. Use Gemini Cloud API for this language.`);
    }

    translator = await createTranslator(sourceLang, targetLang, options);

    const timeout = options.timeout || 30000;
    const translated = await Promise.race([
      translator.translate(text),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Translation timeout')), timeout)
      )
    ]);

    logger.info('Translation completed successfully');
    return translated;

  } catch (error) {
    const handled = handleAIProviderError(error, 'chrome_ai');
    logger.error('Translation failed', error);
    throw new Error(handled.userMessage);

  } finally {
    if (translator && typeof translator.destroy === 'function') {
      try {
        translator.destroy();
      } catch (e) {
        logger.warn('Failed to destroy translator', e);
      }
    }
  }
}


/**
 * Translate multiple texts (batch translation)
 * @param {Array<string>} texts - Array of texts to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: 'en')
 * @param {Object} options - Translation options
 * @returns {Promise<Array<Object>>} Array of translation results
 */
export async function translateBatch(texts, targetLang, sourceLang = 'en', options = {}) {
  let translator = null;

  try {
    logger.info(`Batch translating ${texts.length} items: ${sourceLang} → ${targetLang}`);

    if (sourceLang === targetLang) {
      return texts.map(text => ({ original: text, translated: text, success: true }));
    }

    const availability = await isChromeTranslatorAvailable();
    if (!availability.available) {
      throw new Error(availability.reason || 'Chrome Translation API not available');
    }

    const supported = await isLanguagePairSupported(sourceLang, targetLang);
    if (!supported) {
      throw new Error(`Language pair ${sourceLang} → ${targetLang} not supported`);
    }

    translator = await createTranslator(sourceLang, targetLang, options);

    const results = [];
    for (let i = 0; i < texts.length; i++) {
      try {
        const translated = await translator.translate(texts[i]);
        results.push({
          original: texts[i],
          translated,
          success: true,
          index: i
        });

        if (options.onItemComplete) {
          options.onItemComplete(i + 1, texts.length);
        }
      } catch (itemError) {
        logger.error(`Failed to translate item ${i}`, itemError);
        results.push({
          original: texts[i],
          translated: null,
          success: false,
          error: itemError.message,
          index: i
        });
      }
    }

    logger.info('Batch translation completed');
    return results;

  } catch (error) {
    const handled = handleAIProviderError(error, 'chrome_ai');
    logger.error('Batch translation failed', error);
    throw new Error(handled.userMessage);

  } finally {
    if (translator && typeof translator.destroy === 'function') {
      try {
        translator.destroy();
      } catch (e) {
        logger.warn('Failed to destroy translator', e);
      }
    }
  }
}


/**
 * Get translator capabilities
 * @returns {Promise<Object>} Capabilities object
 */
export async function getTranslatorCapabilities() {
  try {
    const availability = await isChromeTranslatorAvailable();
    const supported = await getSupportedLanguages();

    return {
      available: availability.available,
      status: availability.status,
      supportedLanguages: supported,
      languageCount: supported.length,
      maxTextLength: 5000,
      supportsOffline: true,
      requiresDownload: availability.status === 'after-download',
      provider: 'chrome_ai'
    };
  } catch (error) {
    logger.error('Failed to get translator capabilities', error);
    return {
      available: false,
      error: error.message
    };
  }
}


/**
 * Get translation model information
 * @returns {Promise<Object>} Model info
 */
export async function getTranslatorInfo() {
  try {
    if (!self.translation) {
      return null;
    }

    const availability = await self.translation.canTranslate();

    return {
      id: 'chrome_translatekit',
      name: 'Chrome TranslateKit',
      provider: 'chrome_ai',
      available: (availability === 'readily' || availability === 'after-download'),
      requiresDownload: (availability === 'after-download'),
      modelSize: '50-60MB per language pair',
      maxTextLength: 5000,
      supportsOffline: true,
      supportedLanguages: 11
    };

  } catch (error) {
    logger.error('Failed to get translator info', error);
    return null;
  }
}
