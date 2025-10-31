// VERSION: v1.0.1 | TRANSLATION MANAGER | LAST UPDATED: 2025-10-30
// Smart routing between Chrome AI and Gemini Cloud translation
// CRITICAL: Service Worker Compatible - Static Imports Only


/**
 * Translation Manager
 * Orchestrates translation between Chrome Built-in AI and Gemini Cloud
 * Auto-selects best provider based on language support and availability
 */


import { createLogger } from '../../utils/logger.js';
import * as ChromeTranslator from './chrome-translator.js';
import * as GeminiTranslator from './gemini-translator.js';
import * as LanguageDetector from './language-detector.js';
import { getApiKey } from '../../storage/api-key-storage.js';


const logger = createLogger('TranslationManager');


/**
 * Initialize translation manager
 * @param {Object} options - Initialization options
 * @returns {Promise<Object>} Initialization status
 */
export async function initTranslationManager(options = {}) {
  try {
    logger.info('Initializing Translation Manager');

    const chromeAvailability = await ChromeTranslator.isChromeTranslatorAvailable();
    const detectorAvailability = await LanguageDetector.isLanguageDetectorAvailable();
    
    const geminiAvailable = GeminiTranslator.isGeminiTranslatorAvailable(options.geminiApiKey);

    const status = {
      chromeAI: chromeAvailability,
      languageDetector: detectorAvailability,
      geminiCloud: {
        available: geminiAvailable,
        configured: !!options.geminiApiKey
      },
      initialized: true
    };

    logger.info('Translation Manager initialized', status);
    return status;

  } catch (error) {
    logger.error('Translation Manager initialization failed', error);
    return {
      chromeAI: { available: false },
      languageDetector: { available: false },
      geminiCloud: { available: false, configured: false },
      initialized: false,
      error: error.message
    };
  }
}


/**
 * Auto-detect language of text
 * @param {string} text - Text to detect
 * @param {Object} options - Detection options
 * @returns {Promise<string>} Detected language code
 */
export async function detectLanguage(text, options = {}) {
  try {
    const result = await LanguageDetector.detectLanguage(text, options);
    
    if (result.detected) {
      logger.info(`Language detected: ${result.language} (confidence: ${result.confidence})`);
      return result.language;
    } else {
      logger.warn('Language detection failed, defaulting to English');
      return 'en';
    }
  } catch (error) {
    logger.error('Language detection error', error);
    return 'en';
  }
}


/**
 * Translate text with smart provider selection
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {Object} options - Translation options
 * @returns {Promise<Object>} Translation result
 */
export async function translate(text, targetLang, options = {}) {
  const {
    sourceLang = null,
    provider = 'auto',
    fallback = true,
    geminiApiKey = null
  } = options;

  try {
    logger.info(`Translating: ${sourceLang || 'auto'} → ${targetLang} (provider: ${provider})`);

    let detectedSourceLang = sourceLang;
    if (!detectedSourceLang || detectedSourceLang === 'auto') {
      detectedSourceLang = await detectLanguage(text, options);
    }

    if (detectedSourceLang === targetLang) {
      logger.info('Source and target languages are the same');
      return {
        translated: text,
        provider: 'none',
        sourceLang: detectedSourceLang,
        targetLang,
        success: true
      };
    }

    if (provider === 'auto' || provider === 'chrome_ai') {
      const supported = await ChromeTranslator.isLanguagePairSupported(detectedSourceLang, targetLang);
      
      if (supported) {
        try {
          const translated = await ChromeTranslator.translateText(
            text,
            targetLang,
            detectedSourceLang,
            options
          );
          
          return {
            translated,
            provider: 'chrome_ai',
            sourceLang: detectedSourceLang,
            targetLang,
            success: true,
            cached: false
          };
        } catch (chromeError) {
          logger.warn('Chrome AI translation failed, falling back to Gemini', chromeError);
          
          if (!fallback || provider === 'chrome_ai') {
            throw chromeError;
          }
        }
      } else {
        logger.info(`Chrome AI doesn't support ${detectedSourceLang} → ${targetLang}, using Gemini`);
      }
    }

    if (provider === 'auto' || provider === 'gemini_cloud') {
      if (!geminiApiKey) {
        throw new Error('Gemini API key not configured. Please add your API key in settings.');
      }

      const translated = await GeminiTranslator.translateText(
        text,
        targetLang,
        detectedSourceLang,
        { ...options, apiKey: geminiApiKey }
      );

      return {
        translated,
        provider: 'gemini_cloud',
        sourceLang: detectedSourceLang,
        targetLang,
        success: true,
        cached: false
      };
    }

    throw new Error(`Invalid provider: ${provider}`);

  } catch (error) {
    logger.error('Translation failed', error);
    return {
      translated: null,
      provider: null,
      sourceLang: sourceLang || 'unknown',
      targetLang,
      success: false,
      error: error.message
    };
  }
}


/**
 * Translate multiple texts with smart provider selection
 * @param {Array<string>} texts - Texts to translate
 * @param {string} targetLang - Target language code
 * @param {Object} options - Translation options
 * @returns {Promise<Object>} Batch translation result
 */
export async function translateBatch(texts, targetLang, options = {}) {
  const {
    sourceLang = null,
    provider = 'auto',
    geminiApiKey = null
  } = options;

  try {
    logger.info(`Batch translating ${texts.length} items (provider: ${provider})`);

    let detectedSourceLang = sourceLang;
    if (!detectedSourceLang || detectedSourceLang === 'auto') {
      detectedSourceLang = await detectLanguage(texts[0], options);
    }

    if (detectedSourceLang === targetLang) {
      return {
        results: texts.map((text, index) => ({
          original: text,
          translated: text,
          success: true,
          index
        })),
        provider: 'none',
        sourceLang: detectedSourceLang,
        targetLang
      };
    }

    if (provider === 'auto' || provider === 'chrome_ai') {
      const supported = await ChromeTranslator.isLanguagePairSupported(detectedSourceLang, targetLang);
      
      if (supported) {
        try {
          const results = await ChromeTranslator.translateBatch(
            texts,
            targetLang,
            detectedSourceLang,
            options
          );
          
          return {
            results,
            provider: 'chrome_ai',
            sourceLang: detectedSourceLang,
            targetLang
          };
        } catch (chromeError) {
          logger.warn('Chrome AI batch translation failed, falling back to Gemini', chromeError);
        }
      }
    }

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const results = await GeminiTranslator.translateBatch(
      texts,
      targetLang,
      detectedSourceLang,
      { ...options, apiKey: geminiApiKey }
    );

    return {
      results,
      provider: 'gemini_cloud',
      sourceLang: detectedSourceLang,
      targetLang
    };

  } catch (error) {
    logger.error('Batch translation failed', error);
    throw error;
  }
}


/**
 * Get available languages for each provider
 * @returns {Promise<Object>} Available languages
 */
export async function getAvailableLanguages() {
  try {
    const chromeLanguages = await ChromeTranslator.getSupportedLanguages();
    
    return {
      chromeAI: chromeLanguages,
      geminiCloud: '100+ languages (requires API key)'
    };
  } catch (error) {
    logger.error('Failed to get available languages', error);
    return {
      chromeAI: [],
      geminiCloud: '100+ languages'
    };
  }
}


/**
 * Get capabilities for all providers
 * @param {string} geminiApiKey - Gemini API key
 * @returns {Promise<Object>} Combined capabilities
 */
export async function getCapabilities(geminiApiKey = null) {
  try {
    const chromeCapabilities = await ChromeTranslator.getTranslatorCapabilities();
    const geminiCapabilities = GeminiTranslator.getTranslatorCapabilities();
    const detectorCapabilities = await LanguageDetector.getDetectorCapabilities();

    return {
      chromeAI: chromeCapabilities,
      geminiCloud: {
        ...geminiCapabilities,
        available: GeminiTranslator.isGeminiTranslatorAvailable(geminiApiKey)
      },
      languageDetector: detectorCapabilities
    };
  } catch (error) {
    logger.error('Failed to get capabilities', error);
    return null;
  }
}


/**
 * Clear all translation caches
 */
export function clearAllCaches() {
  try {
    GeminiTranslator.clearCache();
    logger.info('All translation caches cleared');
  } catch (error) {
    logger.error('Failed to clear caches', error);
  }
}


/**
 * 🔥 NEW: Translate extracted structured data
 * @param {Object|Array} extractedData - Structured data from extraction
 * @param {string} targetLang - Target language code
 * @param {string} provider - Provider type ('chrome_ai' or 'gemini_cloud')
 * @param {string} modelId - Model ID (only for gemini_cloud)
 * @returns {Promise<Object>} Translated data
 */
export async function translateExtractedData(extractedData, targetLang, provider, modelId) {
  try {
    logger.info('Translating extracted data', { targetLang, provider, modelId });
    
    if (!extractedData) {
      throw new Error('No data provided for translation');
    }
    
    if (!targetLang) {
      throw new Error('Target language not specified');
    }
    
    let geminiApiKey = null;
    if (provider === 'gemini_cloud') {
      try {
        const keyData = await getApiKey();
        
        if (!keyData || !keyData.key) {
          throw new Error('Gemini API key not configured. Please add your API key in settings.');
        }
        
        geminiApiKey = keyData.key;
      } catch (keyError) {
        logger.error('Failed to retrieve API key', keyError);
        throw new Error('Gemini API key not available');
      }
    }
    
    const textsToTranslate = [];
    const textMap = new Map();
    
    /**
     * Recursively extract text fields from object
     */
    function extractTexts(obj, path = []) {
      if (typeof obj === 'string') {
        if (obj.length > 2) {
          const index = textsToTranslate.length;
          textsToTranslate.push(obj);
          textMap.set(index, [...path]);
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, i) => extractTexts(item, [...path, i]));
      } else if (obj && typeof obj === 'object') {
        const skipFields = ['id', 'url', 'price', 'currency', 'rating', 'timestamp'];
        
        Object.entries(obj).forEach(([key, value]) => {
          if (!skipFields.includes(key.toLowerCase())) {
            extractTexts(value, [...path, key]);
          }
        });
      }
    }
    
    extractTexts(extractedData);
    
    if (textsToTranslate.length === 0) {
      logger.warn('No translatable text found in data');
      return extractedData;
    }
    
    logger.info(`Found ${textsToTranslate.length} text fields to translate`);
    
    const providerType = provider === 'chrome_ai' ? 'chrome_ai' : 'gemini_cloud';
    
    const batchResult = await translateBatch(textsToTranslate, targetLang, {
      provider: providerType,
      geminiApiKey,
      sourceLang: 'auto',
      fallback: true
    });
    
    const translatedData = JSON.parse(JSON.stringify(extractedData));
    
    batchResult.results.forEach((result, index) => {
      if (result.success && result.translated) {
        const path = textMap.get(index);
        
        let current = translatedData;
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
        }
        current[path[path.length - 1]] = result.translated;
      }
    });
    
    logger.info('Translation completed successfully');
    
    return {
      success: true,
      data: translatedData,
      provider: batchResult.provider,
      sourceLang: batchResult.sourceLang,
      targetLang: batchResult.targetLang,
      translatedFieldCount: textsToTranslate.length
    };
    
  } catch (error) {
    logger.error('Failed to translate extracted data', error);
    throw error;
  }
}
